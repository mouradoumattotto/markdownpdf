// Renders the raster icons from src/app/icon.svg (the single source of the mark):
//   src/app/favicon.ico   16, 32, 48 px — what Google and old browsers fetch
//   src/app/icon.png      192 px — Google's search-result favicon (a multiple of 48)
//   src/app/apple-icon.png 180 px, full-bleed — iOS masks the corners itself
//   public/logo.png       512 px — Organization logo in the structured data
//
//   node scripts/build-icons.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const root = join(import.meta.dirname, "..");
const svg = readFileSync(join(root, "src/app/icon.svg"), "utf8");
// iOS rounds the corners itself; transparent corners would show as black.
const fullBleed = svg.replace(/ rx="\d+"/, "");

async function png(source, size) {
  const img = await loadImage(Buffer.from(source));
  const canvas = createCanvas(size, size);
  canvas.getContext("2d").drawImage(img, 0, 0, size, size);
  return canvas.toBuffer("image/png");
}

/** An ICO file holding PNG images (supported everywhere since Windows Vista). */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4); // colour planes
    header.writeUInt16LE(32, e + 6); // bits per pixel
    header.writeUInt32LE(data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.data)]);
}

const sizes = [16, 32, 48];
writeFileSync(join(root, "src/app/favicon.ico"), ico(await Promise.all(sizes.map(async (size) => ({ size, data: await png(svg, size) })))));
writeFileSync(join(root, "src/app/icon.png"), await png(svg, 192));
writeFileSync(join(root, "src/app/apple-icon.png"), await png(fullBleed, 180));
writeFileSync(join(root, "public/logo.png"), await png(fullBleed, 512));
console.log("icons written");
