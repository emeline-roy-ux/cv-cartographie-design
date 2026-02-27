#!/usr/bin/env node

import { writeFile } from "node:fs/promises";

const DEFAULT_QUERY = "authIdHal_s:emeline-cusenier";
const DEFAULT_ROWS = 200;
const DEFAULT_OUTPUT = "hal-publications.json";

function parseArgs(argv) {
  const args = {
    query: DEFAULT_QUERY,
    rows: DEFAULT_ROWS,
    output: DEFAULT_OUTPUT
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--query" && argv[i + 1]) {
      args.query = argv[i + 1];
      i += 1;
    } else if (token === "--rows" && argv[i + 1]) {
      args.rows = Number(argv[i + 1]);
      i += 1;
    } else if (token === "--output" && argv[i + 1]) {
      args.output = argv[i + 1];
      i += 1;
    } else if (token === "--help") {
      args.help = true;
    }
  }

  return args;
}

function pickTitle(doc) {
  if (Array.isArray(doc.title_s) && doc.title_s.length) return doc.title_s[0];
  if (typeof doc.label_s === "string") return doc.label_s;
  return "Publication sans titre";
}

function pickLink(doc) {
  if (Array.isArray(doc.files_s) && doc.files_s.length) return doc.files_s[0];
  if (typeof doc.uri_s === "string") return doc.uri_s;
  return null;
}

function normalizeDoc(doc) {
  const year = doc.producedDateY_i || doc.publicationDateY_i || null;
  const title = pickTitle(doc);
  const link = pickLink(doc);
  const source = [doc.journalTitle_s, doc.conferenceTitle_s, doc.bookTitle_s]
    .filter(Boolean)
    .map(value => String(value).trim())
    .find(Boolean);

  return {
    id: doc.docid || doc.halId_s || null,
    year,
    title,
    source: source || null,
    docType: doc.docType_s || null,
    url: link
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage:\n  node scripts/sync-hal.mjs [--query <solr-query>] [--rows <n>] [--output <file>]\n\nExamples:\n  node scripts/sync-hal.mjs\n  node scripts/sync-hal.mjs --query \"authIdHal_s:emeline-cusenier\" --output data/hal-publications.json`);
    return;
  }

  if (!Number.isFinite(args.rows) || args.rows <= 0) {
    throw new Error("--rows doit être un entier strictement positif.");
  }

  const apiBase = process.env.HAL_API_BASE || "https://api.archives-ouvertes.fr/search/";
  const params = new URLSearchParams({
    q: args.query,
    rows: String(args.rows),
    sort: "producedDateY_i desc",
    wt: "json",
    fl: "docid,halId_s,title_s,label_s,uri_s,files_s,docType_s,producedDateY_i,publicationDateY_i,journalTitle_s,conferenceTitle_s,bookTitle_s"
  });

  const url = `${apiBase}?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "cv-cartographie-design/1.0"
    }
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`HAL API error (${response.status}): ${details.slice(0, 300)}`);
  }

  const payload = await response.json();
  const docs = payload?.response?.docs;

  if (!Array.isArray(docs)) {
    throw new Error("Réponse HAL invalide: payload.response.docs absent.");
  }

  const publications = docs.map(normalizeDoc).filter(item => item.title);
  await writeFile(args.output, `${JSON.stringify(publications, null, 2)}\n`, "utf8");

  console.log(`✅ ${publications.length} publication(s) exportée(s) vers ${args.output}`);
}

main().catch(error => {
  console.error("❌ Échec de la synchronisation HAL");
  console.error(error.message);
  process.exitCode = 1;
});
