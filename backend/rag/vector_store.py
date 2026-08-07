"""Optional ChromaDB-backed vector store.

Embeddings are computed locally with feature-hashing (no model downloads), so
retrieval works fully offline while still exercising a real vector database.
The BM25 engine in `engine.py` is used automatically if ChromaDB is absent.
"""

import hashlib
import os
from typing import Any, Dict, List, Optional

try:
    import chromadb
    from chromadb.config import Settings

    CHROMA_AVAILABLE = True
except Exception:  # pragma: no cover
    CHROMA_AVAILABLE = False

import math
import re

DIM = 512
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "chroma")


def _tokenize(text: str) -> List[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


def hash_embed(text: str) -> List[float]:
    """Feature-hashed bag-of-words embedding with TF weighting + L2 norm."""
    vec = [0.0] * DIM
    for tok in _tokenize(text):
        digest = int(hashlib.sha256(tok.encode("utf-8")).hexdigest(), 16)
        idx = digest % DIM
        sign = 1.0 if (digest // DIM) % 2 == 0 else -1.0
        vec[idx] += sign
    norm = math.sqrt(sum(v * v for v in vec))
    if norm > 0:
        vec = [v / norm for v in vec]
    return vec


class VectorStore:
    def __init__(self, persist_dir: str = DB_PATH) -> None:
        self.available = CHROMA_AVAILABLE
        self._store: Optional[Any] = None
        if not CHROMA_AVAILABLE:
            return
        try:
            client = chromadb.PersistentClient(path=persist_dir, settings=Settings(anonymized_telemetry=False))
            self._store = client.get_or_create_collection(
                name="campus_docs",
                metadata={"hnsw:space": "cosine"},
            )
        except Exception:
            self._store = None
            self.available = False

    def add_documents(self, docs: List[Dict[str, Any]]) -> None:
        if not self.available or self._store is None:
            return
        try:
            existing = set(self._store.get()["ids"] or [])
            ids, documents, metadatas, embeddings = [], [], [], []
            for doc in docs:
                doc_id = f"doc-{hashlib.md5(doc['title'].encode()).hexdigest()[:12]}"
                if doc_id in existing:
                    continue
                ids.append(doc_id)
                documents.append(doc["content"])
                metadatas.append({"title": doc["title"]})
                embeddings.append(hash_embed(doc["content"]))
            if ids:
                self._store.add(ids=ids, documents=documents, metadatas=metadatas, embeddings=embeddings)
        except Exception:
            self.available = False

    def query(self, text: str, top_k: int = 3) -> List[Dict[str, Any]]:
        if not self.available or self._store is None:
            return []
        try:
            res = self._store.query(
                query_embeddings=[hash_embed(text)],
                n_results=top_k,
                include=["documents", "metadatas", "distances"],
            )
            out = []
            docs = (res.get("documents") or [[]])[0]
            metas = (res.get("metadatas") or [[]])[0]
            dists = (res.get("distances") or [[]])[0]
            for doc, meta, dist in zip(docs, metas, dists):
                out.append({
                    "title": (meta or {}).get("title", "Unknown"),
                    "content": doc,
                    "score": round(1.0 - float(dist), 3),
                })
            return out
        except Exception:
            return []


vector_store = VectorStore()
