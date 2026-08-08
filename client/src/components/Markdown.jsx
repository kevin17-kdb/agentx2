import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const KB_HEADER = /####\s*📚 Institutional Knowledge/;

/**
 * Extracts the "Institutional Knowledge" citations block from markdown text and
 * returns { rest, citations } where citations is a list of
 * { title, relevance, snippet }. Outside of that block the markdown is passed
 * through untouched so the vendor KB sources render as compact horizontal cards
 * instead of full-width stacked quote boxes.
 */
function extractKnowledgeBlock(text) {
  const lines = (text || "").split("\n");
  const citations = [];
  const rest = [];
  let inside = false;
  let headerLine = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!inside && KB_HEADER.test(line.trim())) {
      inside = true;
      headerLine = line.trim();
      continue;
    }

    if (inside) {
      const trimmed = line.trim();
      if (trimmed.startsWith(">")) {
        citations.push(trimmed.replace(/^>\s?/, ""));
      } else if (trimmed === "") {
        continue;
      } else {
        inside = false;
        rest.push(line);
      }
      continue;
    }

    rest.push(line);
  }

  const parsed = [];
  let current = null;
  for (const raw of citations) {
    const titleMatch = raw.match(/^\*\*(.+?)\*\*\s*\*?\(relevance ([\d.]+)\)/);
    if (titleMatch) {
      current = { title: titleMatch[1], relevance: titleMatch[2], snippet: "" };
      parsed.push(current);
    } else if (current) {
      current.snippet = (current.snippet ? current.snippet + " " : "") + raw;
    }
  }

  return { header: parsed.length ? headerLine : null, citations: parsed, rest: rest.join("\n") };
}

export default function Markdown({ children }) {
  const { header, citations, rest } = extractKnowledgeBlock(children || "");

  return (
    <div className="md">
      {citations.length > 0 && (
        <div className="kb">
          {header && <h4>{header}</h4>}
          <div className="kb-row">
            {citations.map((c, i) => (
              <div key={i} className="kb-card">
                <div className="kb-card-top">
                  <span className="kb-card-title">{c.title}</span>
                  <span className="kb-rel">rel {parseFloat(c.relevance).toFixed(2)}</span>
                </div>
                <div className="kb-card-snippet">{c.snippet}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {rest.trim() && (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{rest}</ReactMarkdown>
      )}
    </div>
  );
}