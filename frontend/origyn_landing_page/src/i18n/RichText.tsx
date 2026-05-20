import { Fragment, type ReactNode } from "react";

// Inline emphasis tags allowed inside catalog strings. Keeping the markup in
// the string (rather than splitting into separate keys) lets a translator move
// the emphasized word to wherever the target language's grammar needs it.
//   <i>…</i>  italic emphasis      <s>…</s>  strong (solid ink)
//   <g>…</g>  brand gradient text
const TAG_CLASS: Record<string, string> = {
  i: "font-normal italic",
  s: "font-normal text-ink",
  g: "text-gradient",
};

const TOKEN = /<(i|s|g)>([\s\S]*?)<\/\1>/g;

const parse = (text: string): ReactNode[] => {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  TOKEN.lastIndex = 0;

  while ((match = TOKEN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const [, tag, inner] = match;
    nodes.push(
      <span key={match.index} className={TAG_CLASS[tag]}>
        {inner}
      </span>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
};

// Renders a (possibly emphasized) catalog string as inline React nodes. Does
// not handle line breaks — callers that need multi-line headings split on "\n"
// and render each line through their own element so animations stay per-line.
export default function RichText({ text }: { text?: string }) {
  if (!text) return null;
  if (!text.includes("<")) return <>{text}</>;
  return (
    <>
      {parse(text).map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </>
  );
}
