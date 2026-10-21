// Compresses the oversized team logos in public/logos/ in place.
//
// Why: several of these PNGs are 1900-2100 KB despite being displayed at
// 48-96px in the UI (see src/components/TeamCard.tsx and
// src/pages/TeamDetail.tsx). They're almost certainly full-resolution
// exports that were never resized or compressed before being committed.
//
// This machine has no Node/npm installed, so this script could not be
// run as part of this change — run it yourself once you have Node 18+:
//
//   npm install --no-save sharp
//   node scripts/optimize-images.mjs
//
// It overwrites files in place after backing up the originals to
// public/logos/_originals/, resizing to a sane max dimension and
// re-encoding as a quantized (palette) PNG — no file extensions or
// import paths change, so no other code needs to be touched.
//
// Expected result: ~8.7 MB of logos -> well under 1 MB total.

import { readdir, mkdir, copyFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";
import sharp from "sharp";

const LOGOS_DIR = join(process.cwd(), "public", "logos");
const BACKUP_DIR = join(LOGOS_DIR, "_originals");

// 2x a 96px on-screen max (see TeamCard/TeamDetail usage) gives headroom
// for retina displays without shipping needlessly large source images.
const MAX_DIMENSION = 192;

async function main() {
  const entries = await readdir(LOGOS_DIR, { withFileTypes: true });
  const pngFiles = entries
    .filter((e) => e.isFile() && extname(e.name).toLowerCase() === ".png")
    .map((e) => e.name);

  if (pngFiles.length === 0) {
    console.log("No PNG files found in", LOGOS_DIR);
    return;
  }

  await mkdir(BACKUP_DIR, { recursive: true });

  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of pngFiles) {
    const fullPath = join(LOGOS_DIR, file);
    const backupPath = join(BACKUP_DIR, file);

    const before = (await stat(fullPath)).size;
    totalBefore += before;

    // Keep an untouched copy in case anything looks wrong after conversion.
    await copyFile(fullPath, backupPath);

    const buffer = await sharp(backupPath)
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .png({ palette: true, quality: 85, compressionLevel: 9 })
      .toBuffer();

    await sharp(buffer).toFile(fullPath);

    const after = (await stat(fullPath)).size;
    totalAfter += after;

    console.log(
      `${file}: ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB`
    );
  }

  console.log(
    `\nTotal: ${(totalBefore / 1024 / 1024).toFixed(2)} MB -> ${(totalAfter / 1024 / 1024).toFixed(2)} MB`
  );
  console.log(`Originals kept in ${BACKUP_DIR} — delete once you've checked the results.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
