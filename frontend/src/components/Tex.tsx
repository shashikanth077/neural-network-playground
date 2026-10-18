import katex from "katex";
import { useMemo } from "react";

export function Tex({ children, block = false }: { children: string; block?: boolean }) {
  const html = useMemo(
    () => katex.renderToString(children, { displayMode: block, throwOnError: false, strict: "ignore" }),
    [children, block],
  );
  return <span className={block ? "block" : undefined} dangerouslySetInnerHTML={{ __html: html }} />;
}
