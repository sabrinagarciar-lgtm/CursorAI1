/**
 * Builds docs/screenshots/00-frontend-flow.png from step screenshots.
 * Requires: npm install sharp (run from 8_2 root or docs folder)
 */
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "screenshots");

const panels = [
  "01-shop-page.png",
  "02-cart-with-items.png",
  "04-checkout.png",
  "05-order-confirmation.png",
  "06-my-orders.png",
];

async function main() {
  const sharp = (await import("sharp")).default;
  const images = await Promise.all(
    panels.map(async (name) => {
      const file = path.join(outDir, name);
      const img = sharp(file);
      const meta = await img.metadata();
      const resized = await img
        .resize({ width: 640, withoutEnlargement: true })
        .toBuffer();
      return { buffer: resized, height: Math.round((640 / meta.width) * meta.height) };
    }),
  );

  const panelWidth = 640;
  const gap = 8;
  const totalWidth = panels.length * panelWidth + (panels.length - 1) * gap;
  const maxHeight = Math.max(...images.map((i) => i.height));

  const composites = images.map((img, index) => ({
    input: img.buffer,
    left: index * (panelWidth + gap),
    top: Math.floor((maxHeight - img.height) / 2),
  }));

  await sharp({
    create: {
      width: totalWidth,
      height: maxHeight,
      channels: 3,
      background: { r: 248, g: 250, b: 252 },
    },
  })
    .composite(composites)
    .png()
    .toFile(path.join(outDir, "00-frontend-flow.png"));

  console.log("Created", path.join(outDir, "00-frontend-flow.png"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
