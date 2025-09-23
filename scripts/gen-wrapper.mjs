#!/usr/bin/env node
import fs from "fs";
import path from "path";
import url from "url";

// --- helpers ---
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

function ensureRel(p) {
  return p.replace(/^\.?\//, "");
}
function toPascalCase(s) {
  return s
    .replace(/[_\-./]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^[a-z]/, (c) => c.toUpperCase());
}
function guessSlug(s) {
  return s
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function usage(exit = true) {
  console.log(`
Usage:
  pnpm gen:wrap <src/path/to/component.tsx> <WrapperName> [--out <dir>] [--export <NamedExport>] [--page]

Examples:
  pnpm gen:wrap src/components/ui/shared-assets/signup/signup-sidebar-progress-02.tsx SignupSidebarDemo
  pnpm gen:wrap src/components/ui/application/input-group.tsx InputGroupDemo --out src/components/untitled
  pnpm gen:wrap src/components/ui/application/input-payment.tsx PaymentDemo --export InputPayment
  pnpm gen:wrap src/components/ui/application/dashboard.tsx Dashboard --page
`);
  if (exit) process.exit(1);
}

// --- args ---
const args = process.argv.slice(2);
if (args.length < 2) usage();

let compPathArg = args[0];
let wrapperName = args[1];
let outDir = "src/components/untitled";
let explicitExport = null;
let createPage = false;

for (let i = 2; i < args.length; i++) {
  const a = args[i];
  if (a === "--out") outDir = args[++i];
  else if (a === "--export") explicitExport = args[++i];
  else if (a === "--page") createPage = true;
  else {
    console.warn(`Unknown option: ${a}`);
  }
}

// --- validate paths ---
const compPathRel = ensureRel(compPathArg);
const compPathAbs = path.resolve(process.cwd(), compPathRel);
if (!fs.existsSync(compPathAbs)) {
  console.error(`❌ Component file not found: ${compPathRel}`);
  process.exit(1);
}

// --- read component & detect export ---
const src = fs.readFileSync(compPathAbs, "utf8");
const hasDefault = /export\s+default\s+/m.test(src);
const named = [...src.matchAll(/export\s+(?:const|function|class)\s+([A-Za-z0-9_]+)/g)].map(
  (m) => m[1]
);

// decide import
let importLine = "";
let renderTag = "";

const importPath = compPathRel.replace(/^src\//, "@/"); // alias @/* -> ./src/*

if (explicitExport) {
  // user forces a named export to import
  importLine = `import { ${explicitExport} } from "${importPath}";`;
  renderTag = explicitExport;
} else if (hasDefault) {
  importLine = `import ${wrapperName}Source from "${importPath}";`;
  renderTag = `${wrapperName}Source`;
} else if (named.length > 0) {
  // pick first named by default
  importLine = `import { ${named[0]} } from "${importPath}";`;
  renderTag = named[0];
} else {
  console.error("⚠️ No exports detected in the component file. Use --export <Name> to specify.");
  process.exit(1);
}

// --- make wrapper file ---
const outDirAbs = path.resolve(process.cwd(), ensureRel(outDir));
fs.mkdirSync(outDirAbs, { recursive: true });

const fileName = `${wrapperName}.tsx`; // file is exactly your chosen name
const outPathAbs = path.join(outDirAbs, fileName);
const outPathRel = path.relative(path.resolve(process.cwd(), "src"), outPathAbs);
const importForApp = "@/"+outPathRel.replace(/\\/g, "/");

const wrapperCode = `"use client";
${importLine}

export default function ${wrapperName}() {
  return <${renderTag} />;
}
`;

fs.writeFileSync(outPathAbs, wrapperCode, "utf8");
console.log(`✅ Wrapper created: ${path.relative(process.cwd(), outPathAbs)}`);
console.log(`   Import it with:  import ${wrapperName} from "${importForApp}"`);

// --- optional: generate page route ---
if (createPage) {
  const slug = guessSlug(wrapperName);
  const pageDir = path.resolve(process.cwd(), `src/app/${slug}`);
  const pageFile = path.join(pageDir, "page.tsx");
  fs.mkdirSync(pageDir, { recursive: true });
  const pageCode = `import ${wrapperName} from "${importForApp}";

export const dynamic = "force-static";
// or remove the line above if you want default behavior

export default function Page() {
  return (
    <main className="p-6">
      <${wrapperName} />
    </main>
  );
}
`;
  fs.writeFileSync(pageFile, pageCode, "utf8");
  console.log(`🧭 Route page created: src/app/${slug}/page.tsx  →  /${slug}`);
}
