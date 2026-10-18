import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Fragment, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";

/**
 * The legal pages' text (content/legal/*.md): English, then "---", then Arabic. Only what those files
 * use: # and ## headings, paragraphs, - / • bullets, numbered steps, **bold**, and links.
 */

type Block = { kind: "h1" | "h2" | "p"; lines: string[] } | { kind: "ul" | "ol"; items: string[] };

/** The half of the file in this language. */
export function legalText(file: string, locale: Locale): string {
  const raw = readFileSync(join(process.cwd(), "content", "legal", file), "utf8").replace(/\r\n/g, "\n").replace(/<!--[\s\S]*?-->\n?/, "");
  const [en, ar] = raw.split(/\n---\n/);
  return (locale === "ar" ? ar : en) ?? en;
}

/** The first heading, for the page title. */
export function legalTitle(text: string): string {
  return /^# (.+)$/m.exec(text)?.[1] ?? "laqta";
}

function parse(text: string): Block[] {
  const blocks: Block[] = [];
  for (const line of text.split("\n")) {
    const last = blocks.at(-1);
    if (!line.trim()) {
      blocks.push({ kind: "p", lines: [] });
    } else if (line.startsWith("## ")) {
      blocks.push({ kind: "h2", lines: [line.slice(3)] });
    } else if (line.startsWith("# ")) {
      blocks.push({ kind: "h1", lines: [line.slice(2)] });
    } else if (/^(- |• )/.test(line)) {
      if (last?.kind === "ul") last.items.push(line.slice(2));
      else blocks.push({ kind: "ul", items: [line.slice(2)] });
    } else if (/^\d+\. /.test(line)) {
      if (last?.kind === "ol") last.items.push(line.replace(/^\d+\. /, ""));
      else blocks.push({ kind: "ol", items: [line.replace(/^\d+\. /, "")] });
    } else if (/^\s+/.test(line) && (last?.kind === "ul" || last?.kind === "ol")) {
      // A wrapped list item continues on an indented line.
      last.items[last.items.length - 1] += ` ${line.trim()}`;
    } else if (last?.kind === "p") {
      last.lines.push(line);
    } else {
      blocks.push({ kind: "p", lines: [line] });
    }
  }
  return blocks.filter((b) => ("lines" in b ? b.lines.length > 0 : b.items.length > 0));
}

/**
 * **bold**, links (https://… or /path), emails. A /path is a word of its own ("Privacy Policy: /privacy."),
 * so the "/or" in "and/or" stays text.
 */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s)]+[^\s).,]|(?<!\S)\/[a-z-]+(?=[.,\s]|$)|[\w.+-]+@[\w-]+\.[\w.]+[a-z])/g).map((part, i) => {
    // split() puts the matches at the odd places; the text between them is never a link.
    if (i % 2 === 0) return part;
    if (part.startsWith("**")) return <strong key={i}>{inline(part.slice(2, -2))}</strong>;
    if (/^(https?:\/\/|\/[a-z])/.test(part)) {
      return (
        <a key={i} href={part} className="text-primary underline underline-offset-2">
          {part}
        </a>
      );
    }
    if (part.includes("@") && /^[\w.+-]+@/.test(part)) {
      return (
        <a key={i} href={`mailto:${part}`} className="text-primary underline underline-offset-2">
          <bdi dir="ltr">{part}</bdi>
        </a>
      );
    }
    return part;
  });
}

export function LegalDocument({ text }: { text: string }) {
  return (
    <article className="flex flex-col gap-4 leading-7">
      {parse(text).map((block, i) => {
        switch (block.kind) {
          case "h1":
            return <h1 key={i} className="text-h1 font-medium text-balance">{inline(block.lines[0])}</h1>;
          case "h2":
            return <h2 key={i} className="mt-4 text-h3 font-medium">{inline(block.lines[0])}</h2>;
          case "ul":
          case "ol": {
            const List = block.kind;
            return (
              <List key={i} className={`flex flex-col gap-1.5 ps-6 ${block.kind === "ul" ? "list-disc" : "list-decimal"}`}>
                {block.items.map((item, j) => <li key={j}>{inline(item)}</li>)}
              </List>
            );
          }
          default:
            // Lines that start in bold ("**Contact:** …") stay on their own line.
            return (
              <p key={i}>
                {block.lines.map((line, j) => (
                  <Fragment key={j}>
                    {j > 0 && (line.startsWith("**") ? <br /> : " ")}
                    {inline(line)}
                  </Fragment>
                ))}
              </p>
            );
        }
      })}
    </article>
  );
}
