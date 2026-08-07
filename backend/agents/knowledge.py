"""Knowledge Agent (RAG): answers from institutional documents."""

import re
from typing import Any, Dict

from backend.agents.base import BaseAgent, ToolResult
from backend.rag.engine import rag_engine


def _clean_snippet(text: str, limit: int = 260) -> str:
    text = re.sub(r"^#{1,6}\s*", "", text.strip())
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    out = " ".join(lines)
    return out[:limit] + ("…" if len(out) > limit else "")


class KnowledgeAgent(BaseAgent):
    name = "knowledge"
    description = "Answers institutional questions using RAG over campus policies and handbooks."
    color = "#818cf8"
    glyph = "KB"

    # -- rag_search ---------------------------------------------------------------
    def _rag_search(self, state: Dict[str, Any], params: Dict[str, Any]) -> ToolResult:
        """Retrieve relevant passages from institutional policies via RAG."""
        query = params.get("query", state.get("user_query", ""))
        top_k = int(params.get("top_k", 3))
        results = rag_engine.search(query, top_k=top_k)

        if not results:
            return ToolResult(
                data={"query": query, "citations": []},
                summary=f"No matching institutional passages for '{query}'.",
                markdown=f"#### 📚 Institutional Knowledge\nNo policy passage matched *\"{query}\"* directly.",
            )

        cite_lines = "\n".join(
            f"> **{r['title']}** *(relevance {r['relevance_score']})*\n> {_clean_snippet(r['snippet'])}\n"
            for r in results
        )
        return ToolResult(
            data={"query": query, "sources_found": len(results), "citations": results},
            summary=f"Retrieved {len(results)} passages from institutional documents.",
            markdown=f"#### 📚 Institutional Knowledge — *\"{query}\"*\n\n{cite_lines}",
        )


KnowledgeAgent.TOOLS = {
    "rag_search": KnowledgeAgent._rag_search,
}

knowledge_agent = KnowledgeAgent()
