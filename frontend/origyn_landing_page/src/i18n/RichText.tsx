import { Fragment, type ReactNode } from "react";

const TAG_CLASS: Record<string, string> = {
  i: "font-normal italic",
  s: "font-normal text-ink",
  g: "text-gradient",
};

// Hrefs come from the `links` map, never the catalog, so translators cannot
// retarget them.
const LINK_CLASS =
  "rounded-sm font-medium underline underline-offset-4 hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current";

const TOKEN = /<(\/)?(i|s|g|a:[a-zA-Z0-9_-]+)>/g;

type Links = Record<string, string>;

type TagNode = {
  tag: string;
  start: number;
  children: ParsedNode[];
  closed: boolean;
};

type ParsedNode = string | TagNode;

const tokenize = (text: string): ParsedNode[] => {
  const nodes: ParsedNode[] = [];
  const stack: TagNode[] = [];
  let lastIndex = 0;
  const append = (node: ParsedNode) => {
    const target = stack.at(-1)?.children ?? nodes;
    target.push(node);
  };

  for (const match of text.matchAll(TOKEN)) {
    if (match.index > lastIndex) {
      append(text.slice(lastIndex, match.index));
    }

    const [, slash, tag] = match;
    if (!slash) {
      const node = { tag, start: match.index, children: [], closed: false };
      append(node);
      stack.push(node);
    } else if (stack.at(-1)?.tag === tag) {
      stack.pop()!.closed = true;
    } else {
      append(match[0]);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) append(text.slice(lastIndex));
  return nodes;
};

const render = (
  nodes: ParsedNode[],
  text: string,
  links?: Links,
  keyPrefix = "",
): ReactNode[] =>
  nodes.map((node, index) => {
    if (typeof node === "string") return node;
    if (!node.closed) return text.slice(node.start);

    const key = `${keyPrefix}${index}`;
    const children = render(node.children, text, links, `${key}.`);
    if (node.tag.startsWith("a:")) {
      const href = links?.[node.tag.slice(2)];
      return href ? (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={LINK_CLASS}
        >
          {children}
        </a>
      ) : (
        <Fragment key={key}>{children}</Fragment>
      );
    }

    return (
      <span key={key} className={TAG_CLASS[node.tag]}>
        {children}
      </span>
    );
  });

export default function RichText({
  text,
  links,
}: {
  text?: string;
  links?: Links;
}) {
  if (!text) return null;
  if (!text.includes("<")) return <>{text}</>;
  return <>{render(tokenize(text), text, links)}</>;
}
