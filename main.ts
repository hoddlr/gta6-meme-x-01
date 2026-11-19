import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const W = 1024;
const H = 1024;
type RGB = readonly [number, number, number];
type Point = readonly [number, number];
const C = {
  magenta: '#E6007E', darkMagenta: '#C4006B', ink: '#14141F', white: '#FFFFFF',
  orange: '#FF9A3C', pinkSky: '#FF6B8A', horizon: '#C94B9B', yellow: '#FFD23F',
  sunRing: '#FF9E2C', skyline: '#2B1055', palm: '#241040', sidewalk: '#7A4A9E',
  road: '#2E2E44', car: '#FF2E88', carShade: '#D61E6E', glass: '#BFE8FF',
  interior: '#1A1A2E', jasonSkin: '#E8B88A', jasonJacket: '#22304F',
  luciaSkin: '#C98A5E', luciaTop: '#D7263D', paid: '#22C55E', tail: '#FF1F4D'
};
const rgb = (hex: string): RGB => [
  parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)
];
const ink = rgb(C.ink);
const image = Buffer.alloc(W * H * 3);

function pixel(x: number, y: number, color: RGB) {
  x = Math.floor(x); y = Math.floor(y);
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  image[i] = color[0]; image[i + 1] = color[1]; image[i + 2] = color[2];
}

function rect(x: number, y: number, w: number, h: number, color: RGB) {
  const x0 = Math.max(0, Math.floor(x)), y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(W, Math.ceil(x + w)), y1 = Math.min(H, Math.ceil(y + h));
  for (let yy = y0; yy < y1; yy++) {
    let i = (yy * W + x0) * 3;
    for (let xx = x0; xx < x1; xx++, i += 3) {
      image[i] = color[0]; image[i + 1] = color[1]; image[i + 2] = color[2];
    }
  }
}

function circle(cx: number, cy: number, radius: number, color: RGB) {
  const y0 = Math.max(0, Math.floor(cy - radius)), y1 = Math.min(H - 1, Math.ceil(cy + radius));
  for (let y = y0; y <= y1; y++) {
    const dx = Math.sqrt(Math.max(0, radius * radius - (y - cy) * (y - cy)));
    rect(Math.ceil(cx - dx), y, Math.floor(cx + dx) - Math.ceil(cx - dx) + 1, 1, color);
  }
}

function ellipse(cx: number, cy: number, rx: number, ry: number, color: RGB) {
  const y0 = Math.max(0, Math.floor(cy - ry)), y1 = Math.min(H - 1, Math.ceil(cy + ry));
  for (let y = y0; y <= y1; y++) {
    const q = 1 - ((y - cy) * (y - cy)) / (ry * ry);
    if (q < 0) continue;
    const dx = rx * Math.sqrt(q);
    rect(Math.ceil(cx - dx), y, Math.floor(cx + dx) - Math.ceil(cx - dx) + 1, 1, color);
  }
}

function roundRect(x: number, y: number, w: number, h: number, radius: number, color: RGB) {
  const r = Math.min(radius, w / 2, h / 2);
  rect(x + r, y, w - 2 * r, h, color);
  rect(x, y + r, w, h - 2 * r, color);
  circle(x + r, y + r, r, color);
  circle(x + w - r, y + r, r, color);
  circle(x + r, y + h - r, r, color);
  circle(x + w - r, y + h - r, r, color);
}

function polygon(points: Point[], color: RGB) {
  const yMin = Math.max(0, Math.floor(Math.min(...points.map(p => p[1]))));
  const yMax = Math.min(H - 1, Math.ceil(Math.max(...points.map(p => p[1]))));
  for (let y = yMin; y <= yMax; y++) {
    const scan = y + 0.5;
    const hits: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i], [x2, y2] = points[(i + 1) % points.length];
      if ((y1 <= scan && y2 > scan) || (y2 <= scan && y1 > scan)) {
        hits.push(x1 + (scan - y1) * (x2 - x1) / (y2 - y1));
      }
    }
    hits.sort((a, b) => a - b);
    for (let i = 0; i + 1 < hits.length; i += 2) {
      const x0 = Math.ceil(hits[i] - 0.5), x1 = Math.floor(hits[i + 1] - 0.5);
      rect(x0, y, x1 - x0 + 1, 1, color);
    }
  }
}

function thickLine(a: Point, b: Point, width: number, color: RGB) {
  const r = width / 2;
  const minX = Math.max(0, Math.floor(Math.min(a[0], b[0]) - r));
  const maxX = Math.min(W - 1, Math.ceil(Math.max(a[0], b[0]) + r));
  const minY = Math.max(0, Math.floor(Math.min(a[1], b[1]) - r));
  const maxY = Math.min(H - 1, Math.ceil(Math.max(a[1], b[1]) + r));
  const dx = b[0] - a[0], dy = b[1] - a[1], len = dx * dx + dy * dy || 1;
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / len));
    const ex = x - (a[0] + t * dx), ey = y - (a[1] + t * dy);
    if (ex * ex + ey * ey <= r * r) pixel(x, y, color);
  }
}

function outlinedCircle(cx: number, cy: number, r: number, fill: RGB, border: RGB, size: number) {
  circle(cx, cy, r + size, border);
  circle(cx, cy, r, fill);
}

function starPoints(cx: number, cy: number, outer: number, inner: number, points = 5): Point[] {
  const result: Point[] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = -Math.PI / 2 + i * Math.PI / points;
    const r = i % 2 === 0 ? outer : inner;
    result.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return result;
}

function gradient() {
  const bands: Array<[number, RGB, number, RGB]> = [
    [0, rgb(C.orange), 230, rgb(C.pinkSky)],
    [230, rgb(C.pinkSky), 430, rgb(C.horizon)],
    [430, rgb(C.horizon), 620, rgb(C.horizon)]
  ];
  for (let y = 0; y < 620; y++) {
    const band = bands.find(b => y >= b[0] && y < b[2])!;
    const t = (y - band[0]) / (band[2] - band[0]);
    const color: RGB = [
      Math.round(band[1][0] + (band[3][0] - band[1][0]) * t),
      Math.round(band[1][1] + (band[3][1] - band[1][1]) * t),
      Math.round(band[1][2] + (band[3][2] - band[1][2]) * t)
    ];
    rect(0, y, W, 1, color);
  }
}

const FONT: Record<string, string[]> = {
  A:['01110','10001','10001','11111','10001','10001','10001'], B:['11110','10001','10001','11110','10001','10001','11110'],
  C:['01111','10000','10000','10000','10000','10000','01111'], D:['11110','10001','10001','10001','10001','10001','11110'],
  E:['11111','10000','10000','11110','10000','10000','11111'], F:['11111','10000','10000','11110','10000','10000','10000'],
  G:['01111','10000','10000','10111','10001','10001','01111'], H:['10001','10001','10001','11111','10001','10001','10001'],
  I:['11111','00100','00100','00100','00100','00100','11111'], J:['00111','00010','00010','00010','10010','10010','01100'],
  K:['10001','10010','10100','11000','10100','10010','10001'], L:['10000','10000','10000','10000','10000','10000','11111'],
  M:['10001','11011','10101','10101','10001','10001','10001'], N:['10001','11001','10101','10011','10001','10001','10001'],
  O:['01110','10001','10001','10001','10001','10001','01110'], P:['11110','10001','10001','11110','10000','10000','10000'],
  Q:['01110','10001','10001','10001','10101','10010','01101'], R:['11110','10001','10001','11110','10100','10010','10001'],
  S:['01111','10000','10000','01110','00001','00001','11110'], T:['11111','00100','00100','00100','00100','00100','00100'],
  U:['10001','10001','10001','10001','10001','10001','01110'], V:['10001','10001','10001','10001','10001','01010','00100'],
  W:['10001','10001','10001','10101','10101','10101','01010'], X:['10001','10001','01010','00100','01010','10001','10001'],
  Y:['10001','10001','01010','00100','00100','00100','00100'], Z:['11111','00001','00010','00100','01000','10000','11111'],
  '0':['01110','10001','10011','10101','11001','10001','01110'], '1':['00100','01100','00100','00100','00100','00100','01110'],
  '2':['01110','10001','00001','00010','00100','01000','11111'], '3':['11110','00001','00001','01110','00001','00001','11110'],
  '4':['00010','00110','01010','10010','11111','00010','00010'], '5':['11111','10000','10000','11110','00001','00001','11110'],
  '6':['01110','10000','10000','11110','10001','10001','01110'], '7':['11111','00001','00010','00100','01000','01000','01000'],
  '8':['01110','10001','10001','01110','10001','10001','01110'], '9':['01110','10001','10001','01111','00001','00001','01110'],
  '.':['00000','00000','00000','00000','00000','00110','00110'], '$':['00100','01111','10100','01110','00101','11110','00100'],
  ' ':['00000','00000','00000','00000','00000','00000','00000']
};

type GlyphPixel = [number, number, number, number];
function glyphPixels(text: string, cx: number, top: number, capHeight: number, maxWidth?: number): GlyphPixel[] {
  const units = Math.max(0, text.length * 6 - 1);
  const scale = Math.min(capHeight / 7, maxWidth === undefined ? Infinity : maxWidth / units);
  const totalWidth = units * scale;
  const left = cx - totalWidth / 2;
  const pixels: GlyphPixel[] = [];
  for (let ci = 0; ci < text.length; ci++) {
    const rows = FONT[text[ci]];
    for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) {
      if (rows[y][x] !== '1') continue;
      const x0 = Math.floor(left + (ci * 6 + x) * scale);
      const y0 = Math.floor(top + y * scale);
      const x1 = Math.ceil(left + (ci * 6 + x + 1) * scale);
      const y1 = Math.ceil(top + (y + 1) * scale);
      pixels.push([x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0)]);
    }
  }
  return pixels;
}

function text(textValue: string, cx: number, top: number, capHeight: number, fill: RGB, outline: number, maxWidth: number, shadow = false) {
  const pixels = glyphPixels(textValue, cx, top, capHeight, maxWidth);
  if (shadow) for (const [x, y, w, h] of pixels) rect(x + 6, y + 7, w, h, rgb(C.magenta));
  for (const [x, y, w, h] of pixels) rect(x - outline, y - outline, w + outline * 2, h + outline * 2, ink);
  for (const [x, y, w, h] of pixels) rect(x, y, w, h, fill);
}

function scene() {
  gradient();
  outlinedCircle(700, 470, 120, rgb(C.yellow), rgb(C.sunRing), 10);
  rect(580, 470, 240, 10, rgb(C.horizon));
  rect(580, 505, 240, 14, rgb(C.horizon));
  rect(580, 540, 240, 18, rgb(C.horizon));
  const buildings: Array<[number, number, number]> = [[0,120,150],[140,120,220],[280,80,120],[380,140,190],[760,120,110],[900,124,240]];
  for (const [x, width, height] of buildings) rect(x, 620 - height, width, height, rgb(C.skyline));
  for (const [x, width, height] of [[152,96,220],[392,116,190]]) {
    for (let yy = 620 - height + 18; yy < 608; yy += 34) for (let xx = x + 14; xx < x + width - 8; xx += 25) {
      rect(xx, yy, 8, 12, rgb(C.yellow));
    }
  }
  palm(60, 380, 240);
  palm(970, 420, 200);
  rect(0, 620, W, 30, rgb(C.sidewalk));
  rect(0, 650, W, H - 650, rgb(C.road));
  drawCar();
  drawGhost();
  drawPeople();
  drawStars();
  drawCoins();
  // Reserve stroke and shadow pixels inside each headline's fit range.
  text('OUR GETAWAY DRIVER', 512, 55, 88, rgb(C.white), 8, 922, true);
  text('PAID ON MAKE.FUN', 512, 905, 80, rgb(C.yellow), 8, 784);
}

function palm(cx: number, crownY: number, trunkLength: number) {
  const trunk = rgb(C.palm);
  thickLine([cx, crownY], [cx, crownY + trunkLength], 14, trunk);
  for (const degrees of [-168, -137, -103, -66, -29]) {
    const a = degrees * Math.PI / 180, length = 90;
    const ex = cx + Math.cos(a) * length, ey = crownY + Math.sin(a) * length;
    const px = -Math.sin(a) * 7, py = Math.cos(a) * 7;
    polygon([[cx + px, crownY + py], [ex + px * .4, ey + py * .4], [ex, ey], [ex - px * .4, ey - py * .4], [cx - px, crownY - py]], trunk);
  }
}

function drawStars() {
  const centers = [795, 842, 889, 936, 983];
  centers.forEach((x, i) => {
    const points = starPoints(x, 190, 20, 9);
    polygon(points, i === 4 ? rgb(C.road) : rgb(C.yellow));
    for (let j = 0; j < points.length; j++) thickLine(points[j], points[(j + 1) % points.length], 4, i === 4 ? rgb(C.white) : ink);
  });
}

function drawCar() {
  ellipse(510, 852, 390, 28, rgb(C.darkMagenta));
  roundRect(95, 690, 840, 135, 24, ink);
  roundRect(103, 698, 824, 119, 18, rgb(C.car));
  roundRect(103, 800, 824, 17, 8, rgb(C.carShade));
  polygon([[330,690],[375,605],[455,605],[430,690]], ink);
  polygon([[341,683],[380,613],[448,613],[424,683]], rgb(C.glass));
  rect(462, 632, 418, 58, ink);
  rect(470, 640, 402, 50, rgb(C.interior));
  for (const x of [270, 770]) {
    circle(x, 825, 55, ink);
    circle(x, 825, 24, rgb(C.white));
    circle(x, 825, 8, ink);
  }
  rect(95, 760, 20, 20, rgb(C.yellow));
  rect(915, 760, 20, 20, rgb(C.tail));
  for (const [x, y, length] of [[945,690,75],[950,730,65],[948,770,62]]) thickLine([x,y],[x+length,y],8,rgb(C.white));
  rect(830, 786, 110, 38, ink);
  rect(834, 790, 102, 30, rgb(C.white));
  text('GTA VI', 885, 794, 26, ink, 0, 102);
}

function drawGhost() {
  const outline = ink, white = rgb(C.white);
  const contour: Point[] = [];
  for (let i = 0; i <= 24; i++) {
    const a = Math.PI + Math.PI * i / 24;
    contour.push([390 + Math.cos(a) * 105, 545 + Math.sin(a) * 105]);
  }
  contour.push([495, 690], [495, 702]);
  for (let i = 0; i <= 32; i++) {
    const x = 495 - i * (220 / 32);
    const y = 700 + 17 * Math.sin((x - 275) / 220 * Math.PI * 2) ** 2;
    contour.push([x, y]);
  }
  contour.push([285, 690]);
  for (let i = 0; i <= 24; i++) {
    const a = Math.PI + Math.PI * i / 24;
    contour.push([390 + Math.cos(a) * 105, 545 + Math.sin(a) * 105]);
  }
  polygon(contour, white);
  for (let i = 0; i < contour.length - 1; i++) thickLine(contour[i], contour[i + 1], 10, outline);
  for (const cx of [355, 425]) polygon([
    [cx,505],[cx+4,516],[cx+15,520],[cx+4,524],
    [cx,535],[cx-4,524],[cx-15,520],[cx-4,516]
  ], outline);
  circle(330, 685, 40, outline);
  circle(330, 685, 32, white);
  thickLine([330,685],[305,665],8,outline);
  thickLine([330,685],[352,665],8,outline);
  thickLine([470,630],[545,515],34,outline);
  thickLine([470,630],[545,515],23,white);
  outlinedCircle(330, 660, 18, white, outline, 5);
  outlinedCircle(545, 515, 20, white, outline, 5);
  rect(520, 405, 60, 100, outline);
  rect(528, 415, 44, 55, rgb(C.paid));
  text('PAID', 550, 432, 26, rgb(C.white), 1, 44);
}

function drawPeople() {
  const black = ink;
  text('JASON', 620, 507, 34, rgb(C.white), 3, 112);
  text('LUCIA', 760, 507, 34, rgb(C.white), 3, 112);
  // Lucia's long hair sits behind her face and shoulders.
  ellipse(760, 607, 47, 58, black);
  rect(715, 585, 90, 78, black);
  circle(760, 585, 42, rgb(C.luciaSkin));
  ellipse(760, 553, 41, 14, black);
  circle(747, 584, 3, black); circle(773, 584, 3, black);
  circle(760, 608, 6, black);
  rect(715, 630, 90, 70, rgb(C.luciaTop));
  thickLine([720,650],[680,585],24,rgb(C.luciaSkin));
  circle(680,585,14,rgb(C.luciaSkin));
  // Jason's head, dark hair, sunglasses and open mouth.
  circle(620, 590, 42, rgb(C.jasonSkin));
  ellipse(620, 560, 43, 16, black);
  rect(590, 580, 60, 16, black);
  circle(620, 612, 6, black);
  rect(575, 632, 90, 68, rgb(C.jasonJacket));
  rect(610, 632, 20, 44, rgb(C.white));
  thickLine([650,650],[700,580],24,rgb(C.jasonSkin));
  circle(700,580,14,rgb(C.jasonSkin));
}

function drawCoins() {
  for (const [x, y, r] of [[970,600,24],[990,700,20],[965,790,18],[880,560,20]]) {
    outlinedCircle(x, y, r, rgb(C.yellow), ink, 5);
    text('$', x, y - r * .55, 24, ink, 0, r * 1.5);
  }
}

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  CRC_TABLE[n] = c >>> 0;
}

function crc32(data: Buffer): number {
  let crc = 0xFFFFFFFF;
  for (const value of data) crc = CRC_TABLE[(crc ^ value) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const typeData = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const checksumInput = Buffer.concat([typeData, data]);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(checksumInput));
  return Buffer.concat([length, checksumInput, checksum]);
}

function png(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) image.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function main() {
  const botDir = process.env.MAKEFUN_BOT_DIR ?? '/bot';
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  fs.mkdirSync(outputDir, { recursive: true });
  fs.copyFileSync(path.join(botDir, 'POST.json'), path.join(outputDir, 'POST.json'));
  scene();
  fs.writeFileSync(path.join(outputDir, 'meme.png'), png());
}

main();
