#!/usr/bin/env node

/**
 * GlobOcie release pipeline.
 *
 * The input ZIP is treated as an overlay, never as a deletion manifest:
 *   1. fetch the previous GitHub version,
 *   2. copy the previous version to a staging tree,
 *   3. overlay files from the new ZIP,
 *   4. create a full-site ZIP and a release ZIP containing CHANGES/,
 *   5. optionally sync, commit and push only the calculated changes.
 *
 * It deliberately uses only Node.js built-ins so it works on a clean
 * Windows installation as well as on macOS/Linux.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const ZIP_LOCAL_FILE = 0x04034b50;
const ZIP_CENTRAL_FILE = 0x02014b50;
const ZIP_END = 0x06054b50;

function usage() {
  console.log(`
GlobOcie release pipeline

Usage:
  node tools/globocie-release.mjs --zip <new-site.zip> [options]

Options:
  --repo <dir>          repository root (default: current directory)
  --zip <file>          incoming full-site ZIP (required)
  --version <version>   release version, for example 2.5 (auto-detected if omitted)
  --base-ref <ref>      comparison base (default: origin/main)
  --out <dir>           release output directory (default: <repo>/releases)
  --no-fetch            do not refresh origin/main before comparison
  --sync                copy the merged site into the repository, never delete files
  --commit              commit the calculated sync changes
  --publish             commit (if needed) and push the current branch to origin
  --message <text>      commit message override
  --force               replace an existing release directory with the same name
  --keep-temp           keep temporary extraction files for troubleshooting
  --help                show this help

Examples:
  node tools/globocie-release.mjs --zip "C:\\projekty\\GlobOcie-v2.5-FULL.zip"
  node tools/globocie-release.mjs --zip update.zip --version 2.5 --sync --commit --publish
`);
}

function parseArgs(argv) {
  const options = {
    repo: process.cwd(),
    baseRef: "origin/main",
    out: null,
    fetch: true,
    sync: false,
    commit: false,
    publish: false,
    force: false,
    keepTemp: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    }
    if (arg === "--no-fetch") {
      options.fetch = false;
      continue;
    }
    if (arg === "--sync") {
      options.sync = true;
      continue;
    }
    if (arg === "--commit") {
      options.commit = true;
      continue;
    }
    if (arg === "--publish") {
      options.publish = true;
      options.commit = true;
      options.sync = true;
      continue;
    }
    if (arg === "--force") {
      options.force = true;
      continue;
    }
    if (arg === "--keep-temp") {
      options.keepTemp = true;
      continue;
    }

    const key = {
      "--repo": "repo",
      "--zip": "zip",
      "--version": "version",
      "--base-ref": "baseRef",
      "--out": "out",
      "--message": "message",
    }[arg];
    if (key) {
      const value = argv[++i];
      if (!value) throw new Error(`Brak wartości po ${arg}.`);
      options[key] = value;
      continue;
    }
    throw new Error(`Nieznany argument: ${arg}`);
  }

  if (!options.zip) throw new Error("Podaj --zip z nowym pełnym ZIP-em strony.");
  if ((options.commit || options.publish) && !options.sync) {
    throw new Error("--commit/--publish wymaga także --sync.");
  }
  options.repo = path.resolve(options.repo);
  options.zip = path.resolve(options.zip);
  options.out = path.resolve(options.out || path.join(options.repo, "releases"));
  return options;
}

function mkdir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function exists(file) {
  try {
    fs.accessSync(file);
    return true;
  } catch {
    return false;
  }
}

function removeTree(target) {
  if (exists(target)) fs.rmSync(target, { recursive: true, force: true });
}

function normalizedRelative(name) {
  const normalized = name.replaceAll("\\", "/").replace(/^\.\//, "");
  if (!normalized || normalized.startsWith("/") || /^[A-Za-z]:/.test(normalized)) {
    throw new Error(`Niebezpieczna ścieżka w ZIP-ie: ${name}`);
  }
  const parts = normalized.split("/");
  if (parts.includes("..")) throw new Error(`Niebezpieczna ścieżka w ZIP-ie: ${name}`);
  return normalized;
}

function safeJoin(root, relative) {
  const safe = normalizedRelative(relative);
  const target = path.resolve(root, ...safe.split("/"));
  const rootWithSep = path.resolve(root) + path.sep;
  if (target !== path.resolve(root) && !target.startsWith(rootWithSep)) {
    throw new Error(`Ścieżka wychodzi poza katalog: ${relative}`);
  }
  return target;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function findEndOfCentralDirectory(archive) {
  const minimum = Math.max(0, archive.length - 65557);
  for (let offset = archive.length - 22; offset >= minimum; offset -= 1) {
    if (archive.readUInt32LE(offset) === ZIP_END) return offset;
  }
  throw new Error("Nie znaleziono końca archiwum ZIP.");
}

function decodeZipName(buffer, flags) {
  return buffer.toString(flags & 0x800 ? "utf8" : "latin1");
}

function extractZipBuffer(archive, destination) {
  mkdir(destination);
  const end = findEndOfCentralDirectory(archive);
  const entries = archive.readUInt16LE(end + 10);
  const centralSize = archive.readUInt32LE(end + 12);
  const centralOffset = archive.readUInt32LE(end + 16);
  if (centralOffset + centralSize > archive.length) throw new Error("Uszkodzone archiwum ZIP.");

  let cursor = centralOffset;
  for (let index = 0; index < entries; index += 1) {
    if (archive.readUInt32LE(cursor) !== ZIP_CENTRAL_FILE) {
      throw new Error(`Nieprawidłowy wpis centralny ZIP nr ${index}.`);
    }
    const flags = archive.readUInt16LE(cursor + 8);
    const method = archive.readUInt16LE(cursor + 10);
    const compressedSize = archive.readUInt32LE(cursor + 20);
    const uncompressedSize = archive.readUInt32LE(cursor + 24);
    const nameLength = archive.readUInt16LE(cursor + 28);
    const extraLength = archive.readUInt16LE(cursor + 30);
    const commentLength = archive.readUInt16LE(cursor + 32);
    const localOffset = archive.readUInt32LE(cursor + 42);
    const name = decodeZipName(archive.subarray(cursor + 46, cursor + 46 + nameLength), flags);
    const relative = normalizedRelative(name);
    cursor += 46 + nameLength + extraLength + commentLength;
    if (relative.endsWith("/")) {
      mkdir(safeJoin(destination, relative.slice(0, -1)));
      continue;
    }
    if (flags & 1) throw new Error(`Zaszyfrowany wpis ZIP nie jest obsługiwany: ${relative}`);
    if (archive.readUInt32LE(localOffset) !== ZIP_LOCAL_FILE) {
      throw new Error(`Brak lokalnego nagłówka ZIP: ${relative}`);
    }
    const localNameLength = archive.readUInt16LE(localOffset + 26);
    const localExtraLength = archive.readUInt16LE(localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = archive.subarray(dataOffset, dataOffset + compressedSize);
    let content;
    if (method === 0) content = compressed;
    else if (method === 8) content = zlib.inflateRawSync(compressed);
    else throw new Error(`Nieobsługiwana metoda kompresji ${method}: ${relative}`);
    if (content.length !== uncompressedSize || crc32(content) !== archive.readUInt32LE(cursor - commentLength - extraLength - nameLength - 46 + 16)) {
      // The central-directory CRC is easier to read before cursor moves, but the
      // values above are still deterministic. Re-read it from the entry start.
      const entryStart = cursor - (46 + nameLength + extraLength + commentLength);
      const expectedCrc = archive.readUInt32LE(entryStart + 16);
      if (content.length !== uncompressedSize || crc32(content) !== expectedCrc) {
        throw new Error(`Nieprawidłowa suma kontrolna ZIP: ${relative}`);
      }
    }
    const output = safeJoin(destination, relative);
    mkdir(path.dirname(output));
    fs.writeFileSync(output, content);
  }
}

function walkFiles(root, current = root, result = []) {
  if (!exists(current)) return result;
  const entries = fs.readdirSync(current, { withFileTypes: true });
  for (const entry of entries) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) walkFiles(root, absolute, result);
    else if (entry.isFile()) {
      result.push(path.relative(root, absolute).split(path.sep).join("/"));
    }
  }
  return result.sort();
}

function walkEntries(root, current = root, result = []) {
  if (!exists(current)) return result;
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    const relative = path.relative(root, absolute).split(path.sep).join("/");
    if (entry.isDirectory()) {
      result.push({ relative, directory: true });
      walkEntries(root, absolute, result);
    } else if (entry.isFile()) {
      result.push({ relative, directory: false });
    }
  }
  return result.sort((a, b) => a.relative.localeCompare(b.relative));
}

function copyTree(source, destination) {
  if (!exists(source)) return;
  const stat = fs.lstatSync(source);
  if (stat.isDirectory()) {
    mkdir(destination);
    for (const entry of fs.readdirSync(source)) {
      copyTree(path.join(source, entry), path.join(destination, entry));
    }
  } else if (stat.isFile()) {
    mkdir(path.dirname(destination));
    fs.copyFileSync(source, destination);
  }
}

function fileHash(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function hashes(root) {
  const map = new Map();
  for (const relative of walkFiles(root)) map.set(relative, fileHash(path.join(root, ...relative.split("/"))));
  return map;
}

function git(repo, args, input = undefined) {
  return execFileSync("git", args, {
    cwd: repo,
    input,
    encoding: "utf8",
    stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
  }).trim();
}

function gitRefExists(repo, ref) {
  try {
    git(repo, ["rev-parse", "--verify", `${ref}^{tree}`]);
    return true;
  } catch {
    return false;
  }
}

function gitArchive(repo, ref, destination) {
  const zip = execFileSync("git", ["archive", "--format=zip", ref], {
    cwd: repo,
    maxBuffer: 128 * 1024 * 1024,
  });
  extractZipBuffer(zip, destination);
}

function detectSourceRoot(extracted) {
  const conventional = path.join(extracted, "GlobOcie");
  if (exists(conventional) && fs.statSync(conventional).isDirectory()) return conventional;
  const children = fs.readdirSync(extracted, { withFileTypes: true });
  if (children.length === 1 && children[0].isDirectory()) return path.join(extracted, children[0].name);
  return extracted;
}

function detectVersion(sourceRoot, supplied) {
  if (supplied) return supplied.replace(/^v/i, "");
  const candidates = ["app.js", "README.txt", "README-LOCAL.txt", "index.html"];
  for (const candidate of candidates) {
    const file = path.join(sourceRoot, candidate);
    if (!exists(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    const marker = text.match(/APP_VERSION\s*=\s*["']([0-9]+\.[0-9]+(?:\.[0-9]+)?)["']/);
    if (marker) return marker[1];
    const version = text.match(/\bv([0-9]+\.[0-9]+(?:\.[0-9]+)?)\b/i);
    if (version) return version[1];
  }
  const fromName = path.basename(sourceRoot).match(/v?([0-9]+\.[0-9]+(?:\.[0-9]+)?)/i);
  if (fromName) return fromName[1];
  throw new Error("Nie udało się wykryć wersji. Podaj --version, np. --version 2.5.");
}

function today() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizedVersion(version) {
  const value = version.replace(/^v/i, "");
  if (!/^\d+\.\d+(?:\.\d+)?(?:[-+][0-9A-Za-z.-]+)?$/.test(value)) {
    throw new Error(`Nieprawidłowa wersja: ${version}`);
  }
  return value;
}

function zipDirectory(sourceRoot, outputFile) {
  const entries = walkEntries(sourceRoot);
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  for (const entry of entries) {
    const relative = entry.relative;
    const name = entry.directory ? `${relative.replaceAll(path.sep, "/")}/` : relative.replaceAll(path.sep, "/");
    const nameBuffer = Buffer.from(name, "utf8");
    const raw = entry.directory ? Buffer.alloc(0) : fs.readFileSync(path.join(sourceRoot, ...relative.split("/")));
    const compressed = entry.directory ? raw : zlib.deflateRawSync(raw, { level: 9 });
    const method = entry.directory ? 0 : (compressed.length < raw.length ? 8 : 0);
    const body = method === 8 ? compressed : raw;
    const checksum = entry.directory ? 0 : crc32(raw);
    const local = Buffer.alloc(30 + nameBuffer.length);
    local.writeUInt32LE(ZIP_LOCAL_FILE, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x800, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    local.writeUInt16LE(0, 28);
    nameBuffer.copy(local, 30);
    localParts.push(local, body);

    const central = Buffer.alloc(46 + nameBuffer.length);
    central.writeUInt32LE(ZIP_CENTRAL_FILE, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(nameBuffer.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    nameBuffer.copy(central, 46);
    centralParts.push(central);
    offset += local.length + body.length;
  }

  const localData = Buffer.concat(localParts);
  const centralData = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(ZIP_END, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralData.length, 12);
  end.writeUInt32LE(localData.length, 16);
  end.writeUInt16LE(0, 20);
  mkdir(path.dirname(outputFile));
  fs.writeFileSync(outputFile, Buffer.concat([localData, centralData, end]));
}

function copyChangedFiles(changes, sourceRoot, destinationRoot) {
  for (const change of changes) {
    const source = path.join(sourceRoot, ...change.path.split("/"));
    const destination = path.join(destinationRoot, ...change.path.split("/"));
    copyTree(source, destination);
  }
}

function buildManifest({ version, date, baseRef, baseCommit, sourceZip, changes, preservedCount }) {
  const lines = [
    `GlobOcie release v${version} — ${date}`,
    "",
    "POLITYKA: nowy ZIP jest nakładką; stare pliki pozostają i nie są kasowane automatycznie.",
    `Baza porównania: ${baseRef}${baseCommit ? ` (${baseCommit})` : ""}`,
    `Źródłowy ZIP: ${path.basename(sourceZip)}`,
    `Zachowane pliki z poprzedniej wersji: ${preservedCount}`,
    "",
    "CHANGES/ zawiera wyłącznie pliki dodane lub zmienione względem bazy.",
    "Brak wpisów usunięcia jest zamierzony; usuwanie wymaga osobnej, wyraźnej decyzji.",
    "",
    "ZMIANY:",
  ];
  if (!changes.length) lines.push("(brak różnic)");
  else for (const change of changes) lines.push(`${change.kind.padEnd(8)} ${change.path}`);
  return `${lines.join("\n")}\n`;
}

function printChanges(changes) {
  if (!changes.length) {
    console.log("Zmiany względem bazy: brak.");
    return;
  }
  console.log(`Zmiany względem bazy: ${changes.length}`);
  for (const change of changes) console.log(`  ${change.kind.padEnd(8)} ${change.path}`);
}

function validateSite(siteRoot, version) {
  console.log("Walidacja kodu i wersjonowania cache...");
  const syntaxFiles = ["app.js", "i18n.js", "themes.js", "sw.js", "visitor-counter-config.js"];
  for (const relative of syntaxFiles) {
    const file = path.join(siteRoot, relative);
    if (!exists(file)) continue;
    execFileSync(process.execPath, ["--check", file], { cwd: siteRoot, stdio: "pipe" });
    console.log(`  OK składnia: ${relative}`);
  }

  const tests = ["tests/theme-config.test.js", "tests/render-smoke.test.js"];
  for (const relative of tests) {
    const file = path.join(siteRoot, relative);
    if (!exists(file)) continue;
    const output = execFileSync(process.execPath, [file], {
      cwd: siteRoot,
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
    }).trim();
    if (output) console.log(`  OK test: ${output.split(/\r?\n/).at(-1)}`);
  }

  const appFile = path.join(siteRoot, "app.js");
  if (exists(appFile)) {
    const app = fs.readFileSync(appFile, "utf8");
    const marker = app.match(/APP_VERSION\s*=\s*["']([^"']+)["']/);
    if (marker && marker[1] !== version) {
      throw new Error(`APP_VERSION=${marker[1]} nie pasuje do wydania ${version}.`);
    }
  }
  const indexFile = path.join(siteRoot, "index.html");
  if (exists(indexFile)) {
    const index = fs.readFileSync(indexFile, "utf8");
    if (index.includes("?v=") && !index.includes(`?v=${version}`)) {
      throw new Error(`index.html nie zawiera wersjonowania zasobów dla v${version}.`);
    }
  }
  const serviceWorker = path.join(siteRoot, "sw.js");
  if (exists(serviceWorker)) {
    const sw = fs.readFileSync(serviceWorker, "utf8");
    if (!sw.includes(version)) {
      throw new Error(`sw.js nie zawiera oznaczenia wersji ${version}.`);
    }
    console.log(`  OK Service Worker/cache: v${version}`);
  }
}

function currentBranch(repo) {
  return git(repo, ["branch", "--show-current"]);
}

function syncIntoRepo(mergedRoot, repoRoot) {
  const before = hashes(repoRoot);
  const merged = hashes(mergedRoot);
  const paths = [];
  for (const [relative, hash] of merged) {
    if (before.get(relative) === hash) continue;
    copyTree(path.join(mergedRoot, ...relative.split("/")), path.join(repoRoot, ...relative.split("/")));
    paths.push(relative);
  }
  return paths.sort();
}

function stagePaths(repo, paths) {
  if (!paths.length) return;
  git(repo, ["add", "--", ...paths]);
}

function ensurePublishBranchIsCurrent(repo, baseRef) {
  if (!gitRefExists(repo, baseRef)) return;
  const branch = currentBranch(repo);
  if (!branch) throw new Error("Repozytorium jest w stanie detached HEAD; publikacja zatrzymana.");
  const counts = git(repo, ["rev-list", "--left-right", "--count", `${branch}...${baseRef}`]).split(/\s+/).map(Number);
  const ahead = counts[0] || 0;
  const behind = counts[1] || 0;
  if (behind > 0) {
    throw new Error(`Lokalna gałąź ${branch} jest ${behind} commit(ów) za ${baseRef}. Najpierw zsynchronizuj repozytorium; nie używam force-push.`);
  }
  console.log(`Gałąź ${branch}: ahead ${ahead}, behind ${behind} względem ${baseRef}.`);
}

function commitAndPublish(options, syncPaths, version) {
  stagePaths(options.repo, syncPaths);
  const staged = git(options.repo, ["diff", "--cached", "--name-status"]);
  if (staged) {
    const message = options.message || `Publikacja GlobOcie v${version} — pełny ZIP i zmiany`;
    git(options.repo, ["commit", "-m", message]);
    console.log(`Utworzono commit: ${message}`);
  } else {
    console.log("Brak nowych zmian do commitu.");
  }
  if (options.publish) {
    ensurePublishBranchIsCurrent(options.repo, options.baseRef);
    const branch = currentBranch(options.repo);
    git(options.repo, ["push", "origin", branch]);
    console.log(`Wysłano ${branch} do origin.`);
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!exists(options.zip)) throw new Error(`Nie znaleziono ZIP-a: ${options.zip}`);
  if (!exists(options.repo)) throw new Error(`Nie znaleziono repozytorium: ${options.repo}`);

  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "globocie-release-"));
  try {
    const incomingExtract = path.join(temporaryRoot, "incoming");
    const baseExtract = path.join(temporaryRoot, "base");
    const merged = path.join(temporaryRoot, "merged");
    const incomingArchive = fs.readFileSync(options.zip);
    extractZipBuffer(incomingArchive, incomingExtract);
    const sourceRoot = detectSourceRoot(incomingExtract);
    const version = normalizedVersion(detectVersion(sourceRoot, options.version));
    const date = today();
    const releaseName = `v${version}-${date}`;
    const releaseDir = path.join(options.out, releaseName);
    if (exists(releaseDir) && !options.force) {
      throw new Error(`Wydanie już istnieje: ${releaseDir}. Użyj --force, aby je zastąpić.`);
    }
    if (exists(releaseDir)) removeTree(releaseDir);

    if (options.fetch) {
      try {
        git(options.repo, ["fetch", "origin", "main"]);
        console.log("Odświeżono origin/main.");
      } catch (error) {
        console.warn(`Ostrzeżenie: nie udało się odświeżyć origin/main (${error.message}). Używam dostępnej bazy.`);
      }
    }

    let baseRef = options.baseRef;
    let baseCommit = "";
    if (gitRefExists(options.repo, baseRef)) {
      baseCommit = git(options.repo, ["rev-parse", baseRef]).slice(0, 12);
      gitArchive(options.repo, baseRef, baseExtract);
    } else {
      baseRef = "working tree";
      copyTree(options.repo, baseExtract);
      console.warn("Nie znaleziono origin/main; jako bazę używam bieżącego katalogu repozytorium.");
    }

    copyTree(baseExtract, merged);
    copyTree(sourceRoot, merged);
    validateSite(merged, version);
    const baseHashes = hashes(baseExtract);
    const mergedHashes = hashes(merged);
    const incomingPaths = new Set(walkFiles(sourceRoot));
    const changes = [];
    for (const [relative, hash] of mergedHashes) {
      if (!baseHashes.has(relative)) changes.push({ kind: "ADDED", path: relative });
      else if (baseHashes.get(relative) !== hash) changes.push({ kind: "MODIFIED", path: relative });
    }
    const preservedCount = [...baseHashes.keys()].filter((relative) => !incomingPaths.has(relative)).length;

    mkdir(releaseDir);
    copyTree(merged, path.join(releaseDir, "GlobOcie"));
    mkdir(path.join(releaseDir, "CHANGES"));
    copyChangedFiles(changes, merged, path.join(releaseDir, "CHANGES"));
    const manifest = buildManifest({ version, date, baseRef, baseCommit, sourceZip: options.zip, changes, preservedCount });
    fs.writeFileSync(path.join(releaseDir, "RELEASE-MANIFEST.txt"), manifest, "utf8");

    const fullStage = path.join(temporaryRoot, "full-zip");
    copyTree(merged, path.join(fullStage, "GlobOcie"));
    const stem = `GlobOcie-v${version}-${date}`;
    const fullZip = path.join(options.out, `${stem}-FULL.zip`);
    const releaseZip = path.join(options.out, `${stem}-RELEASE.zip`);
    zipDirectory(fullStage, fullZip);
    zipDirectory(releaseDir, releaseZip);
    mkdir(options.out);
    fs.writeFileSync(path.join(releaseDir, "RELEASE-MANIFEST.txt"), manifest, "utf8");

    console.log(`\nGotowe wydanie: ${releaseName}`);
    console.log(`Pełny ZIP: ${fullZip}`);
    console.log(`ZIP z pełną stroną i CHANGES/: ${releaseZip}`);
    console.log(`Folder zmian: ${path.join(releaseDir, "CHANGES")}`);
    printChanges(changes);
    console.log(`Zachowano bez zmian plików pominiętych w nowym ZIP-ie: ${preservedCount}`);

    let syncPaths = [];
    if (options.sync) {
      syncPaths = syncIntoRepo(merged, options.repo);
      console.log(`Zsynchronizowano do repozytorium bez kasowania: ${syncPaths.length} plików.`);
    }
    if (options.commit) commitAndPublish(options, syncPaths, version);
  } finally {
    if (options.keepTemp) console.log(`Katalog tymczasowy: ${temporaryRoot}`);
    else removeTree(temporaryRoot);
  }
}

try {
  main();
} catch (error) {
  console.error(`\nBŁĄD: ${error.message}`);
  process.exitCode = 1;
}
