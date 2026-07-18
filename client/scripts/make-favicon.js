const sharp = require("sharp");
const path = require("path");

const src = path.join("public", "agent-avatar.png");

async function make(size, out, radiusRatio = 0.5) {
  const r = Math.round(size * radiusRatio);
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#fff"/></svg>`
  );
  await sharp(src)
    .resize(size, size, { fit: "cover", position: "top" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toFile(out);
  console.log("wrote", out);
}

(async () => {
  await make(32, path.join("app", "icon.png"));
  await make(180, path.join("app", "apple-icon.png"));
  await make(64, path.join("public", "favicon-rounded.png"));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
