/**
 * SyncTeX lookups without the `synctex` command-line tool.
 *
 * Reading output/<main>.synctex.gz directly works the same on every OS and
 * with every engine that writes SyncTeX (pdfTeX, XeTeX, LuaTeX, Tectonic),
 * even where the CLI is not installed.
 *
 * Format reference: synctex_parser.c in TeX Live. Each content line is a
 * record; coordinates are in scaled points, origin at the page's top-left.
 *   {page            page start          }page   page end
 *   [tag,line:h,v:W,H,D   vbox start      ]       vbox end
 *   (tag,line:h,v:W,H,D   hbox start      )       hbox end
 *   v/h tag,line:h,v:W,H,D  void v/hbox
 *   x tag,line:h,v  current point    g = glue    $ = math    k tag,line:h,v:W = kern
 * "tag,line" may carry a third ",column" field. "Input:tag:path" maps tags to files.
 */
import { promises as fs } from "fs";
import path from "path";
import { gunzipSync } from "zlib";

/** Scaled points per PostScript point (bp): 65536 * 72.27 / 72. */
const SP_PER_BP = 65781.76;

type BoxKind = "vbox" | "hbox";

interface SyncNode {
  kind: BoxKind | "void" | "point";
  /** record type character: ( [ v h x k g $ */
  type: string;
  tag: number;
  line: number;
  page: number;
  h: number;
  v: number;
  width: number;
  height: number;
  depth: number;
  parent: SyncNode | null;
  children: SyncNode[];
}

export interface SynctexData {
  /** tag -> absolute input path ("/./" segments removed, original case kept) */
  inputs: Map<number, string>;
  /** page -> every node on that page, in file order */
  pages: Map<number, SyncNode[]>;
  /** page -> hboxes on that page */
  hboxes: Map<number, SyncNode[]>;
}

export interface PdfRect {
  /** PDF points from the left edge of the page */
  x: number;
  /** PDF points from the top edge of the page (top of the box) */
  y: number;
  width: number;
  height: number;
}

export interface ForwardResult {
  page: number;
  rects: PdfRect[];
}

export interface InverseResult {
  /** absolute path of the source file */
  file: string;
  line: number;
}

/** For comparisons only: Windows paths are case-insensitive. */
function samePath(a: string, b: string): boolean {
  return process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b;
}

const RECORD = /^([[(vhxkg$])(\d+),(\d+)(?:,-?\d+)?:(-?\d+),(-?\d+)(?::(-?\d+)(?:,(-?\d+),(-?\d+))?)?/;

export function parseSynctex(text: string): SynctexData {
  const inputs = new Map<number, string>();
  const pages = new Map<number, SyncNode[]>();
  const hboxes = new Map<number, SyncNode[]>();

  let unit = 1;
  let magnification = 1000;
  let xOffset = 0;
  let yOffset = 0;
  const toBp = (sp: number, offset = 0): number =>
    ((sp * unit + offset) * (magnification / 1000)) / SP_PER_BP;

  let page = 0;
  const stack: SyncNode[] = [];

  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    if (!line) continue;
    const first = line[0];

    if (line.startsWith("Input:")) {
      const m = line.match(/^Input:(\d+):(.*)$/);
      if (m) inputs.set(Number(m[1]), path.resolve(m[2]));
      continue;
    }
    if (line.startsWith("Unit:")) unit = Number(line.slice(5)) || 1;
    else if (line.startsWith("Magnification:")) magnification = Number(line.slice(14)) || 1000;
    else if (line.startsWith("X Offset:")) xOffset = Number(line.slice(9)) || 0;
    else if (line.startsWith("Y Offset:")) yOffset = Number(line.slice(9)) || 0;

    if (first === "{") {
      page = Number(line.slice(1));
      stack.length = 0;
      if (!pages.has(page)) pages.set(page, []);
      if (!hboxes.has(page)) hboxes.set(page, []);
      continue;
    }
    if (first === "}") {
      page = 0;
      stack.length = 0;
      continue;
    }
    if (first === "]" || first === ")") {
      stack.pop();
      continue;
    }
    if (page === 0) continue;

    const m = line.match(RECORD);
    if (!m) continue;
    const [, type, tag, ln, h, v, w, ht, dp] = m;
    const parent = stack[stack.length - 1] ?? null;
    const node: SyncNode = {
      type,
      kind:
        type === "[" ? "vbox" : type === "(" ? "hbox" : type === "v" || type === "h" ? "void" : "point",
      tag: Number(tag),
      line: Number(ln),
      page,
      h: toBp(Number(h), xOffset),
      v: toBp(Number(v), yOffset),
      width: w !== undefined ? toBp(Number(w)) : 0,
      height: ht !== undefined ? toBp(Number(ht)) : 0,
      depth: dp !== undefined ? toBp(Number(dp)) : 0,
      parent,
      children: [],
    };
    parent?.children.push(node);
    pages.get(page)!.push(node);
    if (node.kind === "hbox") hboxes.get(page)!.push(node);
    if (type === "[" || type === "(") stack.push(node);
  }

  return { inputs, pages, hboxes };
}

function enclosingHbox(node: SyncNode): SyncNode | null {
  if (node.kind === "hbox") return node;
  let p = node.parent;
  while (p && p.kind !== "hbox") p = p.parent;
  return p;
}

function rectOf(box: SyncNode): PdfRect {
  return { x: box.h, y: box.v - box.height, width: box.width, height: box.height + box.depth };
}

/** Source file + line -> where it is in the PDF. Falls back to the nearest line that produced output. */
export function forwardSearch(data: SynctexData, absFile: string, line: number): ForwardResult | null {
  const wanted = path.resolve(absFile);
  const tags = [...data.inputs].filter(([, p]) => samePath(p, wanted)).map(([t]) => t);
  if (tags.length === 0) return null;

  const candidates: SyncNode[] = [];
  for (const nodes of data.pages.values()) {
    for (const n of nodes) if (tags.includes(n.tag)) candidates.push(n);
  }
  if (candidates.length === 0) return null;

  // exact line, else the closest following line, else the closest preceding one
  let best = candidates.filter((n) => n.line === line);
  if (best.length === 0) {
    const after = candidates.filter((n) => n.line > line);
    const target = after.length
      ? Math.min(...after.map((n) => n.line))
      : Math.max(...candidates.map((n) => n.line));
    best = candidates.filter((n) => n.line === target);
  }

  // Glue and kerns tagged with a line also show up in neighbouring boxes
  // (e.g. the space before a \section sits at the end of the previous
  // paragraph). Prefer boxes holding actual typeset material from the line.
  const content = best.filter((n) => n.type === "x" || n.type === "$" || n.kind === "void" || n.kind === "hbox");
  const evidence = content.length ? content : best;

  // A box belongs to the line when most of the text directly inside it comes
  // from that line. TeX tags a paragraph's line boxes with the line where the
  // paragraph *ended* (e.g. the next \section), and stray records leak into
  // neighbouring boxes, so a single matching record is not enough.
  const isText = (n: SyncNode): boolean => n.type === "x" || n.type === "$" || n.kind === "void";
  const matches = (n: SyncNode): boolean => tags.includes(n.tag) && n.line === evidence[0].line;
  const share = (box: SyncNode): number => {
    const text = box.children.filter(isText);
    if (text.length === 0) return matches(box) ? 1 : 0;
    return text.filter(matches).length / text.length;
  };

  const scored = new Map<SyncNode, number>();
  for (const n of evidence) {
    const box = n.kind === "hbox" ? n : enclosingHbox(n);
    if (box && box.width > 0 && box.height + box.depth > 0 && !scored.has(box)) {
      scored.set(box, share(box));
    }
  }
  const top = Math.max(0, ...scored.values());
  // strict majority, and close to the best box (a paragraph's short last
  // line can be half made of a stray record from the next line)
  const owned = [...scored]
    .filter(([, sc]) => (sc > 0.5 && sc >= 0.75 * top) || (top <= 0.5 && sc === top && sc > 0))
    .map(([b]) => b);

  const page = owned.length ? Math.min(...owned.map((b) => b.page)) : Math.min(...evidence.map((n) => n.page));
  const boxes = new Set(owned.filter((b) => b.page === page));
  const rects = [...boxes].map(rectOf).sort((a, b) => a.y - b.y || a.x - b.x);
  if (rects.length === 0) {
    const n = evidence.find((b) => b.page === page)!;
    rects.push({ x: n.h, y: n.v - 10, width: 20, height: 12 });
  }
  return { page, rects };
}

/**
 * PDF point -> source line. Picks the smallest hbox under the point (or the
 * nearest line of text), then the node in it closest to the click. Nodes
 * whose file is not accepted (e.g. a package's .sty) are skipped in favour of
 * an enclosing box from an accepted file.
 */
export function inverseSearch(
  data: SynctexData,
  page: number,
  x: number,
  y: number,
  accept: (absFile: string) => boolean = () => true,
): InverseResult | null {
  const boxes = (data.hboxes.get(page) ?? []).filter((b) => b.width > 0);
  if (boxes.length === 0) return null;

  const inside = boxes.filter(
    (b) => x >= b.h && x <= b.h + b.width && y >= b.v - b.height && y <= b.v + b.depth,
  );
  let box: SyncNode;
  if (inside.length) {
    box = inside.reduce((a, b) => (b.width * (b.height + b.depth) < a.width * (a.height + a.depth) ? b : a));
  } else {
    // nearest line of text vertically, then horizontally
    const dist = (b: SyncNode): number => {
      const dy = y < b.v - b.height ? b.v - b.height - y : y > b.v + b.depth ? y - b.v - b.depth : 0;
      const dx = x < b.h ? b.h - x : x > b.h + b.width ? x - b.h - b.width : 0;
      return dy * 10 + dx;
    };
    box = boxes.reduce((a, b) => (dist(b) < dist(a) ? b : a));
  }

  const fileOf = (n: SyncNode): string | undefined => data.inputs.get(n.tag);
  const usable = (n: SyncNode): boolean => {
    const f = fileOf(n);
    return f !== undefined && accept(f);
  };

  // Leaf nodes inside the box (at any depth) carry the most precise line.
  const leaves: SyncNode[] = [];
  const walk = (n: SyncNode): void => {
    for (const c of n.children) {
      if (c.kind === "hbox" || c.kind === "vbox") walk(c);
      else leaves.push(c);
    }
  };
  walk(box);
  const usableLeaves = leaves.filter(usable);
  if (usableLeaves.length) {
    // the node starting closest to the left of x, else the first one after it
    const before = usableLeaves.filter((n) => n.h <= x);
    const pick = before.length
      ? before.reduce((a, b) => (b.h > a.h ? b : a))
      : usableLeaves.reduce((a, b) => (b.h < a.h ? b : a));
    return { file: fileOf(pick)!, line: pick.line };
  }

  for (let n: SyncNode | null = box; n; n = n.parent) {
    if (usable(n)) return { file: fileOf(n)!, line: n.line };
  }
  return null;
}

const cache = new Map<string, { mtimeMs: number; data: SynctexData }>();

/** Reads and parses <outputDir>/<base>.synctex(.gz), cached until the file changes. */
export async function loadSynctex(outputDir: string, base: string): Promise<SynctexData | null> {
  for (const name of [`${base}.synctex.gz`, `${base}.synctex`]) {
    const file = path.join(outputDir, name);
    let stat;
    try {
      stat = await fs.stat(file);
    } catch {
      continue;
    }
    const hit = cache.get(file);
    if (hit && hit.mtimeMs === stat.mtimeMs) return hit.data;
    const buf = await fs.readFile(file);
    const text = (name.endsWith(".gz") ? gunzipSync(buf) : buf).toString("utf8");
    const data = parseSynctex(text);
    cache.set(file, { mtimeMs: stat.mtimeMs, data });
    return data;
  }
  return null;
}
