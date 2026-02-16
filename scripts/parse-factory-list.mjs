#!/usr/bin/env node
/**
 * Parses factorylist.csv and outputs a clean CSV with only Company, Address, Expertise.
 * Usage: node scripts/parse-factory-list.mjs
 * Reads: factorylist.csv (project root)
 * Writes: factorylist-clean.csv (project root)
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const inputPath = join(root, "factorylist.csv");
const outputPath = join(root, "factorylist-clean.csv");

function parseCSV(text) {
  const rows = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    const row = [];
    while (i < len) {
      if (text[i] === '"') {
        i++;
        let cell = "";
        while (i < len) {
          if (text[i] === '"') {
            if (text[i + 1] === '"') {
              cell += '"';
              i += 2;
            } else {
              i++;
              break;
            }
          } else {
            cell += text[i];
            i++;
          }
        }
        row.push(cell);
        if (text[i] === ",") i++;
        else if (text[i] === "\n" || text[i] === "\r") {
          i++;
          if (text[i] === "\n") i++;
          break;
        } else break;
      } else {
        let cell = "";
        while (i < len && text[i] !== "," && text[i] !== "\n" && text[i] !== "\r") {
          cell += text[i];
          i++;
        }
        row.push(cell);
        if (text[i] === ",") i++;
        else if (text[i] === "\n" || text[i] === "\r") {
          i++;
          if (text[i] === "\n") i++;
          break;
        } else break;
      }
    }
    if (row.some((c) => c.trim())) rows.push(row);
  }
  return rows;
}

function escapeCSV(val) {
  const s = String(val ?? "").trim();
  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

const raw = readFileSync(inputPath, "utf-8");
const rows = parseCSV(raw);

// Header row: Name, Company, HWTrek URL, Located, Industry, , , Expertise, ...
// Index: 0=Name, 1=Company, 2=URL, 3=Located, 4=Industry, 7=Expertise
const header = rows[0] || [];
const dataRows = rows.slice(1);

const out = [["Company", "Address", "Expertise"].join(",")];

for (const row of dataRows) {
  const company = (row[1] ?? "").trim();
  const address = (row[3] ?? "").trim();
  const expertise = (row[7] ?? "").trim().replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
  if (!company) continue;
  out.push([escapeCSV(company), escapeCSV(address), escapeCSV(expertise)].join(","));
}

writeFileSync(outputPath, out.join("\n"), "utf-8");
console.log(`Wrote ${out.length - 1} rows to ${outputPath}`);
