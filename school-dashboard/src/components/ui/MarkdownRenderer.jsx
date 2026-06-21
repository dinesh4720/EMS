/**
 * MarkdownRenderer — safe renderer for user-generated text content.
 *
 * Security guarantee: any URL (from inline markdown links or plain text)
 * whose protocol is not http/https/mailto is stripped to prevent
 * javascript: and data: protocol execution.
 */

const SAFE_PROTOCOLS = /^(https?:|mailto:)/i;

function sanitizeUrl(url) {
  if (!url) return '#';
  const trimmed = url.trim();
  if (!SAFE_PROTOCOLS.test(trimmed)) return '#';
  return trimmed;
}

// Inline markdown link pattern: [text](url)
const LINK_RE = /\[([^\]]*)\]\(([^)]*)\)/g;

function renderInline(text) {
  const parts = [];
  let last = 0;
  let match;

  LINK_RE.lastIndex = 0;
  while ((match = LINK_RE.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const [, label, rawUrl] = match;
    const href = sanitizeUrl(rawUrl);
    parts.push(
      <a
        key={`frag-${match.index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent underline underline-offset-2 hover:opacity-80"
      >
        {label}
      </a>
    );
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * @param {object} props
 * @param {string} props.content  — user-supplied text (may contain [link](url) syntax)
 * @param {string} [props.className]
 */
export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <span className={className}>
      {lines.map((line, i) => (
        <span key={`${i}:${line}`}>
          {renderInline(line)}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </span>
  );
}
