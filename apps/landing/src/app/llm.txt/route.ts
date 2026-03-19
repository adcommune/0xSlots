import { readFileSync } from "node:fs";
import { join } from "node:path";

const content = readFileSync(
  join(process.cwd(), "public", "llm.txt"),
  "utf-8",
);

export function GET() {
  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
