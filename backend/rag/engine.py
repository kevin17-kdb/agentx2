"""Retrieval-Augmented Generation engine.

Primary retrieval uses the ChromaDB vector store when available, reranked with
BM25 scoring; otherwise falls back to a pure stdlib BM25 index. No network or
model downloads are required, so retrieval works fully offline.
"""

import math
import re
from collections import Counter
from typing import Any, Dict, List, Optional

from backend.data.db import INSTITUTIONAL_DOCS
from backend.rag.vector_store import vector_store

DOC_ALIASES = {
    "attendance": "attendance-policy",
    "exam": "exam-regulations",
    "examination": "exam-regulations",
    "hostel": "hostel-rules",
    "scholarship": "scholarship-criteria",
    "placement": "placement-eligibility",
    "internship": "placement-eligibility",
    "library": "library-services",
    "grievance": "grievance-sla",
    "transport": "transport-services",
    "bus": "transport-services",
    "wellness": "wellness-policy",
    "counseling": "wellness-policy",
}

# Domains that own specific policy documents. When a planner already knows the
# intent (e.g. exam/attendance), retrieval should stay inside these documents
# instead of surfacing passages from the whole campus handbook.
DOC_SCOPES = {
    "academic": {
        "exam-regulations",
        "attendance-policy",
    },
    "wellness": {"wellness-policy"},
    "library": {"library-services"},
    "wifi": {"library-services"},
    "services": {
        "hostel-rules",
        "library-services",
        "scholarship-criteria",
        "transport-services",
        "grievance-sla",
    },
    "placement": {"placement-eligibility", "scholarship-criteria"},
    "finance": {"scholarship-criteria"},
}


class RAGEngine:
    def __init__(self) -> None:
        self.documents: List[Dict[str, Any]] = INSTITUTIONAL_DOCS
        self._chunks: List[Dict[str, Any]] = []
        self._df: Counter = Counter()
        self._total = 0
        self._build_index()
        # Index into the vector store (dedup by title).
        if vector_store.available:
            vector_store.add_documents(self.documents)

    # ---- Index ------------------------------------------------------------------
    def _build_index(self) -> None:
        for doc in self.documents:
            content = doc["content"]
            section_chunks = self._split_sections(content)
            for chunk_text in section_chunks:
                tokens = self._tokenize(chunk_text)
                self._chunks.append({
                    "doc_id": doc["id"],
                    "title": doc["title"],
                    "content": chunk_text,
                    "tokens": tokens,
                })
                for tok in set(tokens):
                    self._df[tok] += 1
        self._total = len(self._chunks)

    def _split_sections(self, content: str) -> List[str]:
        blocks = re.split(r"\n(?=#+ |## )", content)
        chunks = []
        for block in blocks:
            block = block.strip()
            if not block:
                continue
            sentences = [s.strip() for s in re.split(r"(?<=[.:])\s+", block) if s.strip()]
            if len(sentences) <= 4:
                chunks.append(block)
                continue
            # group sentences into ~4 sentence chunks
            for i in range(0, len(sentences), 4):
                chunks.append(" ".join(sentences[i:i + 4]))
        return chunks or [content]

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        return re.findall(r"[a-z0-9]+", text.lower())

    # ---- Scoring ----------------------------------------------------------------
    def _bm25(self, tokens: List[str], k1: float = 1.5, b: float = 0.75) -> List[Dict[str, Any]]:
        query = Counter(tokens)
        qn = len(tokens) or 1
        avg_len = (sum(len(c["tokens"]) for c in self._chunks) / self._total) if self._total else 1.0
        results = []
        for idx, chunk in enumerate(self._chunks):
            cl = len(chunk["tokens"])
            ct = Counter(chunk["tokens"])
            score = 0.0
            for term, qf in query.items():
                tf = ct.get(term, 0)
                if not tf:
                    continue
                df = self._df.get(term, 0)
                idf = math.log(1 + (self._total - df + 0.5) / (df + 0.5))
                score += idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * cl / avg_len)) * qf
            if score > 0:
                results.append({"idx": idx, "score": round(score / qn, 4)})
        results.sort(key=lambda r: r["score"], reverse=True)
        return results

    # ---- Public search ------------------------------------------------------------
    def search(self, query: str, top_k: int = 3, scope: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        query_tokens = self._tokenize(query)
        allowed_docs = set(scope or [])  # doc-id prefixes (e.g. "DOC-ATTENDANCE-POLICYMD")

        def in_scope(idx: int) -> bool:
            if not allowed_docs:
                return True
            doc_id = self._chunks[idx]["doc_id"]
            return any(s in doc_id for s in allowed_docs)

        # Vector-store candidates
        vec_hits: Dict[int, float] = {}
        if vector_store.available:
            for hit in vector_store.query(query, top_k=top_k * 3):
                best = self._best_chunk_for(hit.get("content", ""))
                if best is not None and in_scope(best):
                    vec_hits[best] = max(vec_hits.get(best, 0.0), hit.get("score", 0.0))

        # BM25 candidates
        bm25 = self._bm25(query_tokens)

        merged: Dict[int, float] = {}
        for r in bm25[:top_k * 4]:
            idx = r["idx"]
            if in_scope(idx):
                merged[idx] = r["score"]
        for idx, score in vec_hits.items():
            merged[idx] = merged.get(idx, 0.0) + 0.6 * score

        ranked = sorted(merged.items(), key=lambda kv: kv[1], reverse=True)[:top_k]

        results = []
        for idx, score in ranked:
            chunk = self._chunks[idx]
            results.append({
                "doc_id": chunk["doc_id"],
                "title": chunk["title"],
                "snippet": chunk["content"][:500],
                "relevance_score": round(score, 3),
            })

        # Domain-aware boost for obvious topic queries
        for key, alias in DOC_ALIASES.items():
            if key in query.lower() and not any(alias in r["title"].lower() for r in results):
                doc = next((d for d in self.documents if alias in d["id"].lower()), None)
                if doc and (not allowed_docs or any(s in doc["id"] for s in allowed_docs)):
                    results.append({
                        "doc_id": doc["id"],
                        "title": doc["title"],
                        "snippet": doc["content"][:500],
                        "relevance_score": 0.5,
                    })
        return results[:top_k]

    def _best_chunk_for(self, text: str) -> Optional[int]:
        """Map a vector-store hit back to a BM25 chunk index by overlap."""
        if not text:
            return None
        tokens = set(self._tokenize(text))
        best_idx, best_score = None, 0.0
        for idx, chunk in enumerate(self._chunks):
            overlap = len(tokens & set(chunk["tokens"]))
            if overlap > best_score:
                best_score, best_idx = overlap, idx
        return best_idx

    def doc_count(self) -> int:
        return len(self.documents)


rag_engine = RAGEngine()
