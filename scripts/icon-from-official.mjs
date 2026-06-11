// Gera os ícones do PWA a partir do emblema oficial FIFA 2026
// (public/icons/emblem-official.png — dígitos pretos sobre fundo transparente).
// 1) converte os dígitos/texto pretos para branco (versão dark do logo)
// 2) compõe sobre quadrado preto nos tamanhos exigidos pelo manifest.
// Uso: node scripts/icon-from-official.mjs
import sharp from "sharp";

const SRC = "public/icons/emblem-official.png";

// ---- 1) preto -> branco (mantém o troféu dourado intacto) ----
const { data, info } = await sharp(SRC)
  .raw()
  .toBuffer({ resolveWithObject: true });

// Janela do wordmark "FIFA": no logo escuro oficial, essa área permanece
// preta com as letras brancas (não inverte). Retângulo arredondado medido
// no arquivo original de 1280x1975.
const WIN = { x0: 330, x1: 990, y0: 1545, y1: 1830, r: 50 };

function inWordmarkWindow(x, y) {
  if (x < WIN.x0 || x > WIN.x1 || y < WIN.y0 || y > WIN.y1) return false;
  const cx = x < WIN.x0 + WIN.r ? WIN.x0 + WIN.r : x > WIN.x1 - WIN.r ? WIN.x1 - WIN.r : x;
  const cy = y < WIN.y0 + WIN.r ? WIN.y0 + WIN.r : y > WIN.y1 - WIN.r ? WIN.y1 - WIN.r : y;
  return (x - cx) ** 2 + (y - cy) ** 2 <= WIN.r ** 2 || (cx === x && cy === y) ||
    (x >= WIN.x0 + WIN.r && x <= WIN.x1 - WIN.r) || (y >= WIN.y0 + WIN.r && y <= WIN.y1 - WIN.r);
}

for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * info.channels;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const a = info.channels === 4 ? data[i + 3] : 255;
    if (a === 0) continue;
    if (inWordmarkWindow(x, y)) continue; // mantém FIFA branco sobre preto
    // estrito (<8) preserva as sombras douradas do troféu
    if (r < 8 && g < 8 && b < 8) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    }
  }
}

const darkEmblem = await sharp(data, {
  raw: { width: info.width, height: info.height, channels: info.channels },
})
  .png()
  .toBuffer();

await sharp(darkEmblem).toFile("public/logo-26.png");
console.log("✔ public/logo-26.png (emblema branco/dourado, fundo transparente)");

// ---- 2) compor sobre quadrado preto ----
async function makeIcon(out, size, contentRatio) {
  const h = Math.round(size * contentRatio);
  const emblem = await sharp(darkEmblem)
    .resize({ height: h })
    .toBuffer();
  const meta = await sharp(emblem).metadata();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([
      {
        input: emblem,
        left: Math.round((size - meta.width) / 2),
        top: Math.round((size - h) / 2),
      },
    ])
    .png()
    .toFile(out);
  console.log(`✔ ${out} (${size}x${size})`);
}

await makeIcon("public/icons/icon-512.png", 512, 0.92);
await makeIcon("public/icons/icon-192.png", 192, 0.92);
await makeIcon("public/icons/icon-maskable-512.png", 512, 0.68);
await makeIcon("public/icons/apple-touch-icon.png", 180, 0.92);
