import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { chromium } = await import('playwright');

// The archived integration source expects the original team working tree. Set
// POSTER_SOURCE_ROOT to that tree when rebuilding outside the original layout.
const weekDir = process.env.POSTER_SOURCE_ROOT
  ? path.resolve(process.env.POSTER_SOURCE_ROOT)
  : path.resolve(__dirname, '..', '..');
const outputDir = process.env.POSTER_OUTPUT_DIR
  ? path.resolve(process.env.POSTER_OUTPUT_DIR)
  : path.resolve(__dirname, '..', 'final');
const stem = 'W1_Layout_A_Integrated_Final_4960';
const W = 4960;
const H = 3600;
const pageWidthMm = 1189;
const pageHeightMm = +(pageWidthMm * H / W).toFixed(3);
const browserExecutable = process.env.POSTER_BROWSER_EXECUTABLE?.trim() || null;
const mastheadVisualShiftY = -18;

const C = {
  blue: '#52748B',
  dark: '#365866',
  mid: '#4D8DA4',
  pale: '#ADD8E2',
  teal: '#2A9D8F',
  ink: '#294052',
  muted: '#718393',
  grid: '#D9E5EA',
  wash: '#F7FAFB',
  tealWash: '#EAF6F5',
  white: '#FFFFFF',
  warm: '#E8B36A',
  noodle: '#D9903D',
  green: '#70A95A',
};

const FONT = 'Comic Sans MS, Comic Sans, cursive';

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function prefixIds(svgText, prefix) {
  return svgText
    .replace(/\bid="([^"]+)"/g, (_match, id) => `id="${prefix}${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_match, id) => `url(#${prefix}${id})`)
    .replace(/\b(href|xlink:href)="#([^"]+)"/g, (_match, attr, id) => `${attr}="#${prefix}${id}"`);
}

function extractSvg(svgText) {
  const match = svgText.match(/<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/i);
  if (!match) throw new Error('Could not locate SVG root element.');
  const viewBox = match[1].match(/\bviewBox="([^"]+)"/i)?.[1];
  if (!viewBox) throw new Error('SVG is missing a viewBox.');
  return { viewBox, body: match[2] };
}

function parseCsvLine(line) {
  const fields = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        field += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (ch === ',' && !quoted) {
      fields.push(field);
      field = '';
    } else {
      field += ch;
    }
  }
  fields.push(field);
  return fields;
}

function parseCsv(text) {
  return text.trim().split(/\r?\n/).map(parseCsvLine);
}

function polyline(points) {
  return points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
}

function areaPath(topPoints, bottomPoints) {
  const top = topPoints.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
  const bottom = [...bottomPoints].reverse().map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
  return `${top} ${bottom} Z`;
}

function hexToRgb(hex) {
  const v = hex.replace('#', '');
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

function rgbToHex(rgb) {
  return `#${rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
}

function mix(a, b, t) {
  const ar = hexToRgb(a);
  const br = hexToRgb(b);
  return rgbToHex(ar.map((v, i) => v + (br[i] - v) * t));
}

function heatColor(value) {
  const t = Math.max(0, Math.min(1, (value - 0.35) / (2.50 - 0.35)));
  if (t < 0.52) return mix('#F3F8FA', '#82C8C1', t / 0.52);
  return mix('#82C8C1', C.dark, (t - 0.52) / 0.48);
}

function sectionBar(x, y, width, title, sectionId) {
  return [
    `<g data-section-title="${sectionId}">`,
    `<rect x="${x}" y="${y}" width="${width}" height="62" rx="9" fill="${C.blue}"/>`,
    `<text x="${x + width / 2}" y="${y + 44}" text-anchor="middle" font-family="${FONT}" font-size="38" font-weight="bold" fill="${C.white}">${esc(title)}</text>`,
    '</g>',
  ].join('\n');
}

function roundedPanel(x, y, width, height, fill = C.white, stroke = C.grid, rx = 18, extra = '') {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="3" ${extra}/>`;
}

function curvedRoof(y, width, rise, depth) {
  const half = width / 2;
  const inner = width * 0.22;
  return [
    '<path d="M ' + (-half) + ' ' + y +
      ' Q ' + (-half * 0.78) + ' ' + (y - rise * 0.95) + ' ' + (-inner) + ' ' + (y - rise * 0.54) +
      ' Q 0 ' + (y - rise * 1.18) + ' ' + inner + ' ' + (y - rise * 0.54) +
      ' Q ' + (half * 0.78) + ' ' + (y - rise * 0.95) + ' ' + half + ' ' + y +
      ' L ' + (half - 18) + ' ' + (y + depth) +
      ' Q 0 ' + (y + depth - rise * 0.25) + ' ' + (-half + 18) + ' ' + (y + depth) + ' Z" fill="' + C.teal + '" stroke="' + C.dark + '" stroke-width="6" stroke-linejoin="round"/>',
    '<path d="M ' + (-half + 13) + ' ' + (y + 2) + ' Q 0 ' + (y + depth - 4) + ' ' + (half - 13) + ' ' + (y + 2) + '" fill="none" stroke="' + C.pale + '" stroke-width="5" stroke-linecap="round"/>'
  ].join('\n');
}

function latticeBody(yTop, yBottom, width, columns) {
  const half = width / 2;
  const parts = [
    '<path d="M ' + (-half) + ' ' + yTop + ' L ' + (-half + 9) + ' ' + yBottom + ' H ' + (half - 9) + ' L ' + half + ' ' + yTop + ' Z" fill="' + C.tealWash + '" stroke="' + C.dark + '" stroke-width="5"/>'
  ];
  for (let i = 1; i < columns; i += 1) {
    const x = -half + width * i / columns;
    parts.push('<line x1="' + x.toFixed(2) + '" y1="' + (yTop + 4) + '" x2="' + (x * 0.88).toFixed(2) + '" y2="' + (yBottom - 3) + '" stroke="' + C.mid + '" stroke-width="4"/>');
  }
  parts.push('<line x1="' + (-half + 5) + '" y1="' + ((yTop + yBottom) / 2) + '" x2="' + (half - 5) + '" y2="' + ((yTop + yBottom) / 2) + '" stroke="' + C.pale + '" stroke-width="3"/>');
  return parts.join('\n');
}

function yellowCraneTowerV2(x, y, scale) {
  return [
    '<g data-cultural-icon="yellow-crane-tower" transform="translate(' + x + ' ' + y + ') scale(' + scale + ')" opacity="0.82">',
    '<circle cx="0" cy="170" r="178" fill="' + C.pale + '" opacity="0.18"/>',
    '<path d="M -224 356 H 224 M -190 338 H 190 M -158 321 H 158" stroke="' + C.dark + '" stroke-width="8" stroke-linecap="round"/>',
    '<path d="M -139 321 L -124 277 H 124 L 139 321 Z" fill="' + C.tealWash + '" stroke="' + C.dark + '" stroke-width="6"/>',
    latticeBody(234, 277, 210, 6),
    curvedRoof(231, 360, 42, 15),
    latticeBody(177, 219, 174, 5),
    curvedRoof(174, 302, 38, 14),
    latticeBody(126, 163, 139, 4),
    curvedRoof(123, 246, 34, 13),
    latticeBody(80, 113, 103, 3),
    curvedRoof(77, 191, 30, 12),
    latticeBody(40, 68, 69, 2),
    curvedRoof(37, 139, 27, 11),
    '<path d="M 0 9 V -19 M -11 -7 L 0 -25 L 11 -7" fill="none" stroke="' + C.dark + '" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>',
    '<path d="M -246 72 Q -218 42 -188 70 Q -160 42 -132 67 M 150 24 Q 178 -6 207 23 Q 234 -5 260 20" fill="none" stroke="' + C.pale + '" stroke-width="7" stroke-linecap="round"/>',
    '</g>',
  ].join('\n');
}

function hotDryNoodlesV2(x, y, scale) {
  return '<g data-cultural-icon="hot-dry-noodles" transform="translate(' + x + ' ' + y + ') scale(' + scale + ')" opacity="0.82">' +
    '<path d="M 22 105 Q 120 155 218 105 L 197 181 Q 120 218 43 181 Z" fill="' + C.tealWash + '" stroke="' + C.dark + '" stroke-width="7" stroke-linejoin="round"/>' +
    '<ellipse cx="120" cy="105" rx="98" ry="31" fill="' + C.white + '" stroke="' + C.dark + '" stroke-width="7"/>' +
    '<path d="M 48 105 C 66 75 82 137 99 103 C 116 69 133 137 151 102 C 169 67 184 128 199 101" fill="none" stroke="' + C.noodle + '" stroke-width="11" stroke-linecap="round"/>' +
    '<path d="M 58 113 C 76 83 90 145 108 110 C 126 75 140 141 158 108 C 176 76 188 129 201 109" fill="none" stroke="' + C.warm + '" stroke-width="8" stroke-linecap="round"/>' +
    '<circle cx="78" cy="94" r="6" fill="' + C.green + '"/><circle cx="124" cy="118" r="6" fill="' + C.green + '"/><circle cx="170" cy="91" r="6" fill="' + C.green + '"/>' +
    '<path d="M 66 40 C 48 18 77 8 62 -10 M 119 40 C 101 18 130 8 115 -10 M 172 40 C 154 18 183 8 168 -10" fill="none" stroke="' + C.pale + '" stroke-width="7" stroke-linecap="round"/>' +
    '<path d="M 36 18 L 214 80 M 49 2 L 222 62" stroke="' + C.dark + '" stroke-width="7" stroke-linecap="round"/>' +
    '</g>';
}

function workerBeeV2(x, y, scale) {
  return '<g data-cultural-icon="manchester-bee" transform="translate(' + x + ' ' + y + ') scale(' + scale + ')" opacity="0.82">' +
    '<path d="M 120 57 C 92 68 83 108 91 145 C 100 187 120 216 120 216 C 120 216 140 187 149 145 C 157 108 148 68 120 57 Z" fill="' + C.warm + '" stroke="' + C.dark + '" stroke-width="7"/>' +
    '<path d="M 93 94 H 147 M 91 122 H 149 M 96 151 H 144 M 105 180 H 135" stroke="' + C.dark + '" stroke-width="12"/>' +
    '<ellipse cx="120" cy="50" rx="29" ry="25" fill="' + C.dark + '"/>' +
    '<path d="M 100 32 C 81 7 60 18 66 39 M 140 32 C 159 7 180 18 174 39" fill="none" stroke="' + C.dark + '" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M 95 76 C 45 33 4 61 18 105 C 30 143 67 143 96 119 M 145 76 C 195 33 236 61 222 105 C 210 143 173 143 144 119 M 97 126 C 53 120 25 151 45 180 C 66 211 93 187 108 157 M 143 126 C 187 120 215 151 195 180 C 174 211 147 187 132 157" fill="' + C.tealWash + '" fill-opacity="0.72" stroke="' + C.dark + '" stroke-width="7" stroke-linejoin="round"/>' +
    '</g>';
}

function manchesterMillV1(x, y, scale) {
  const windows = [];
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      windows.push('<rect x="' + (26 + col * 38) + '" y="' + (111 + row * 38) + '" width="20" height="21" rx="3" fill="' + C.pale + '" stroke="' + C.dark + '" stroke-width="3"/>');
    }
  }
  return '<g data-cultural-icon="manchester-mill" transform="translate(' + x + ' ' + y + ') scale(' + scale + ')" opacity="0.78">' +
    '<path d="M 12 91 L 55 58 V 91 L 104 58 V 91 L 153 58 V 91 H 226 V 202 H 12 Z" fill="' + C.tealWash + '" stroke="' + C.dark + '" stroke-width="7" stroke-linejoin="round"/>' +
    '<rect x="184" y="14" width="28" height="77" rx="3" fill="' + C.tealWash + '" stroke="' + C.dark + '" stroke-width="7"/>' +
    windows.join('') +
    '<path d="M 0 204 H 238" stroke="' + C.dark + '" stroke-width="8" stroke-linecap="round"/>' +
    '</g>';
}

function headerCulturalMotifs() {
  return [
    yellowCraneTowerV2(593.2, 216, 0.46),
    hotDryNoodlesV2(794.3, 212.4, 0.84),
    manchesterMillV1(3586, 191.5, 0.922),
    workerBeeV2(3892.1, 188.8, 0.884),
  ].join('\n');
}

function mastheadCityDecor() {
  return [
    '<g id="city-identity" aria-label="Wuhan and Manchester visual identity">',
    '<g data-cultural-icon="yellow-crane-tower" transform="translate(150 58)" opacity="0.88">',
    `<path d="M 0 83 H 158 M 18 68 H 140 M 31 52 H 127 M 47 36 H 111" fill="none" stroke="${C.white}" stroke-width="6" stroke-linecap="round"/>`,
    `<path d="M 12 68 L 28 57 H 130 L 146 68 M 25 52 L 42 41 H 116 L 133 52 M 42 36 L 59 25 H 99 L 116 36" fill="none" stroke="${C.white}" stroke-width="5" stroke-linejoin="round"/>`,
    `<path d="M 42 83 V 68 M 64 68 V 52 M 79 52 V 25 M 94 52 V 68 M 116 68 V 83" stroke="${C.white}" stroke-width="5"/>`,
    '</g>',
    '<g data-cultural-icon="hot-dry-noodles" transform="translate(350 59)" opacity="0.88">',
    `<ellipse cx="72" cy="55" rx="64" ry="16" fill="none" stroke="${C.white}" stroke-width="6"/>`,
    `<path d="M 10 58 Q 72 114 134 58" fill="none" stroke="${C.white}" stroke-width="7" stroke-linecap="round"/>`,
    `<path d="M 31 42 C 20 27, 44 20, 34 5 M 70 42 C 59 27, 83 20, 73 5 M 108 42 C 97 27, 121 20, 111 5" fill="none" stroke="${C.warm}" stroke-width="6" stroke-linecap="round"/>`,
    `<path d="M 20 18 L 132 48" stroke="${C.white}" stroke-width="5" stroke-linecap="round"/>`,
    '</g>',
    `<text x="520" y="124" font-family="${FONT}" font-size="22" font-weight="bold" fill="${C.white}" opacity="0.9">WUHAN · TOWER &amp; NOODLES</text>`,
    `<path d="M 655 109 H 1510" stroke="${C.white}" stroke-width="4" stroke-dasharray="12 14" opacity="0.28"/>`,
    '<g data-cultural-icon="manchester-bee" transform="translate(4170 60)" opacity="0.9">',
    `<ellipse cx="66" cy="44" rx="28" ry="41" fill="${C.warm}" stroke="${C.white}" stroke-width="5"/>`,
    `<path d="M 43 29 H 89 M 40 45 H 92 M 45 61 H 87" stroke="${C.dark}" stroke-width="6"/>`,
    `<ellipse cx="27" cy="35" rx="30" ry="19" transform="rotate(-28 27 35)" fill="none" stroke="${C.white}" stroke-width="5"/>`,
    `<ellipse cx="105" cy="35" rx="30" ry="19" transform="rotate(28 105 35)" fill="none" stroke="${C.white}" stroke-width="5"/>`,
    `<path d="M 52 4 L 40 -7 M 80 4 L 92 -7" stroke="${C.white}" stroke-width="4" stroke-linecap="round"/>`,
    '</g>',
    `<text x="4335" y="124" font-family="${FONT}" font-size="22" font-weight="bold" fill="${C.white}" opacity="0.9">MANCHESTER · WORKER BEE</text>`,
    `<path d="M 3450 109 H 4110" stroke="${C.white}" stroke-width="4" stroke-dasharray="12 14" opacity="0.28"/>`,
    '</g>',
  ].join('\n');
}

function photoTile({ id, x, y, width, height, label, uri, focus = 'xMidYMid' }) {
  const clip = `photo_clip_${id}`;
  return [
    `<g data-photo-id="${id}" data-image-block="${id}">`,
    `<defs><clipPath id="${clip}"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="18"/></clipPath></defs>`,
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="18" fill="${C.wash}"/>`,
    `<image x="${x}" y="${y}" width="${width}" height="${height}" href="${uri}" preserveAspectRatio="${focus} slice" clip-path="url(#${clip})"/>`,
    `<rect x="${x}" y="${y + height - 54}" width="${width}" height="54" rx="0" fill="${C.dark}" opacity="0.94" clip-path="url(#${clip})"/>`,
    `<text x="${x + 22}" y="${y + height - 17}" font-family="${FONT}" font-size="25" font-weight="bold" fill="${C.white}">${esc(label)}</text>`,
    '</g>',
  ].join('\n');
}

function footerPhotoThumbnail({ id, x, y, width, height, uri, focus = 'xMidYMid' }) {
  const clip = `footer_photo_clip_${id}`;
  return [
    `<g data-footer-photo="${id}" data-image-block="${id}">`,
    `<defs><clipPath id="${clip}"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="12"/></clipPath></defs>`,
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="12" fill="${C.wash}" stroke="${C.grid}" stroke-width="2"/>`,
    `<image x="${x}" y="${y}" width="${width}" height="${height}" href="${uri}" preserveAspectRatio="${focus} slice" clip-path="url(#${clip})"/>`,
    '</g>',
  ].join('\n');
}

function stepIcon(kind, x, y) {
  if (kind === 'source') {
    return [
      `<ellipse cx="${x}" cy="${y - 23}" rx="47" ry="18" fill="${C.pale}" stroke="${C.dark}" stroke-width="4"/>`,
      `<path d="M ${x - 47} ${y - 23} V ${y + 37} C ${x - 47} ${y + 47}, ${x + 47} ${y + 47}, ${x + 47} ${y + 37} V ${y - 23}" fill="${C.tealWash}" stroke="${C.dark}" stroke-width="4"/>`,
      `<ellipse cx="${x}" cy="${y + 7}" rx="47" ry="18" fill="none" stroke="${C.mid}" stroke-width="3"/>`,
    ].join('\n');
  }
  if (kind === 'clean') {
    return [
      `<path d="M ${x - 54} ${y - 42} H ${x + 54} L ${x + 18} ${y + 3} V ${y + 44} H ${x - 18} V ${y + 3} Z" fill="${C.tealWash}" stroke="${C.dark}" stroke-width="4"/>`,
      `<path d="M ${x - 34} ${y - 21} H ${x + 34}" stroke="${C.teal}" stroke-width="7" stroke-linecap="round"/>`,
    ].join('\n');
  }
  if (kind === 'check') {
    return [
      `<circle cx="${x}" cy="${y}" r="51" fill="${C.tealWash}" stroke="${C.dark}" stroke-width="4"/>`,
      `<path d="M ${x - 29} ${y + 1} L ${x - 7} ${y + 24} L ${x + 34} ${y - 25}" fill="none" stroke="${C.teal}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`,
    ].join('\n');
  }
  if (kind === 'grid') {
    const cells = [];
    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < 3; c += 1) {
        cells.push(`<rect x="${x - 52 + c * 38}" y="${y - 52 + r * 38}" width="28" height="28" rx="4" fill="${r + c > 2 ? C.teal : C.pale}" stroke="${C.dark}" stroke-width="2"/>`);
      }
    }
    return cells.join('\n');
  }
  return [
    `<rect x="${x - 43}" y="${y - 54}" width="86" height="108" rx="10" fill="${C.tealWash}" stroke="${C.dark}" stroke-width="4"/>`,
    `<path d="M ${x - 23} ${y - 22} H ${x + 24} M ${x - 23} ${y + 2} H ${x + 24} M ${x - 23} ${y + 26} H ${x + 10}" stroke="${C.mid}" stroke-width="6" stroke-linecap="round"/>`,
    `<path d="M ${x + 5} ${y + 27} L ${x + 18} ${y + 40} L ${x + 39} ${y + 15}" fill="none" stroke="${C.teal}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
  ].join('\n');
}

const logoPaths = {
  hubu: path.resolve(__dirname, '..', 'assets', 'logos', 'Hubei_University_crest.svg'),
  mmu: path.resolve(__dirname, '..', 'assets', 'logos', 'Manchester_Met_official_landscape.svg'),
};

const logoBlocks = {};
for (const [key, logoPath] of Object.entries(logoPaths)) {
  const raw = await fs.readFile(logoPath, 'utf8');
  if (/<image\b/i.test(raw)) throw new Error(`${key} logo unexpectedly contains raster image content.`);
  const parsed = extractSvg(prefixIds(raw, `${key}_`));
  logoBlocks[key] = parsed;
}

const photoPaths = {
  online_payment: path.join(weekDir, 'sucai', 'Qin Tian - China E-commerce Growth and Global Trade Evidence', 'Images', 'consumer_online_payment_pexels_29205862.jpg'),
  warehouse_team: path.join(weekDir, 'sucai', 'Qin Tian - China E-commerce Growth and Global Trade Evidence', 'Images', 'warehouse_team_pexels_6169653.jpg'),
  warehouse_worker: path.join(weekDir, 'sucai', '工作过程', 'module_03_qin_ecosystem', 'candidate_blocks_real_data', 'assets', 'warehouse_worker_china_pexels_25461764.jpg'),
  delivery_van: path.join(weekDir, '同学的', 'sonpeitong - Global Industry Impact', 'Source_Code', 'assets', 'delivery_van_pexels_21838827.jpg'),
  delivery_worker: path.join(weekDir, '同学的', 'sonpeitong - Global Industry Impact', 'Source_Code', 'assets', 'delivery_woman_phone_packages_pexels_9461225.jpg'),
  checkout: path.join(weekDir, 'sucai', 'Qin Tian - China E-commerce Growth and Global Trade Evidence', 'Images', 'consumer_checkout_boxes_pexels_7620626.jpg'),
  parcel_sorting: path.join(weekDir, 'sucai', 'Qin Tian - China E-commerce Growth and Global Trade Evidence', 'Images', 'parcel_conveyor_pexels_5903898.jpg'),
  last_mile: path.join(weekDir, 'sucai', 'Qin Tian - China E-commerce Growth and Global Trade Evidence', 'Images', 'last_mile_delivery_pexels_4487488.jpg'),
  warehouse: path.join(weekDir, '同学的', 'sonpeitong - Global Industry Impact', 'Source_Code', 'assets', 'warehouse_aisle_pexels_4277794.jpg'),
  warehouse_packages_new: path.resolve(__dirname, '..', 'assets', 'photos', 'warehouse_packages_pexels_6170414.jpg'),
  last_mile_courier_new: path.resolve(__dirname, '..', 'assets', 'photos', 'last_mile_courier_pexels_6169135.jpg'),
  delivery_step_new: path.resolve(__dirname, '..', 'assets', 'photos', 'delivery_step_pexels_6868178.jpg'),
  team_process_1: path.join(weekDir, '现场照片', '1.jpg'),
  team_process_3: path.join(weekDir, '现场照片', '3.jpg'),
  team_process_5: path.join(weekDir, '现场照片', '5.jpg'),
};

const photoUris = {};
for (const [key, photoPath] of Object.entries(photoPaths)) {
  const bytes = await fs.readFile(photoPath);
  photoUris[key] = `data:image/jpeg;base64,${bytes.toString('base64')}`;
}

const tradeCsvPath = path.join(weekDir, 'sucai', 'Qin Tian - China E-commerce Growth and Global Trade Evidence', 'Source_Code', 'data', 'china_cbec_trade_2018_2024_verified.csv');
const rcepCsvPath = path.join(weekDir, 'sucai', 'Qin Tian - China E-commerce Growth and Global Trade Evidence', 'Source_Code', 'data', 'rcep_trade_potential_by_country_year.csv');
const consumerCsvPath = path.join(weekDir, 'sucai', '组员绘图任务包', '02_Milkwort_father_consumer_reach', 'data', 'ipc_purchase_source_china_2016_2023.csv');

const tradeRowsRaw = parseCsv(await fs.readFile(tradeCsvPath, 'utf8'));
const tradeHeader = tradeRowsRaw[0];
const tradeRows = tradeRowsRaw.slice(1).map((row) => Object.fromEntries(tradeHeader.map((key, i) => [key, row[i]]))).map((row) => ({
  year: +row.year,
  total: +row.total_import_export_100m_cny / 10000,
  exports: +row.export_100m_cny / 10000,
  imports: +row.import_100m_cny / 10000,
  totalYoy: row.total_yoy_pct === '' ? null : +row.total_yoy_pct,
  exportShare: +((+row.export_100m_cny / +row.total_import_export_100m_cny) * 100).toFixed(1),
}));

const consumerRows = parseCsv(await fs.readFile(consumerCsvPath, 'utf8'));
const consumer2016Row = consumerRows.find((row) => row[0] === '2016');
const consumer2023Row = consumerRows.find((row) => row[0] === '2023');
const shopper2016 = +consumer2016Row[1];
const shopper2023 = +consumer2023Row[1];
const shopperTrendSample = +(consumer2023Row[3].match(/[\d,]+/)?.[0] || '0').replaceAll(',', '');

const rcepRowsRaw = parseCsv(await fs.readFile(rcepCsvPath, 'utf8'));
const rcepYears = rcepRowsRaw[0].slice(1, 11);
const rcepRows = rcepRowsRaw.slice(1).map((row) => ({
  country: row[0],
  values: row.slice(1, 11).map(Number),
  group: row[12],
}));

if (tradeRows.length !== 7 || shopper2016 !== 26 || shopper2023 !== 37 || shopperTrendSample !== 23005 || rcepRows.length !== 11 || rcepYears.length !== 10) {
  throw new Error('Unexpected input data shape; refusing to render poster with unverified values.');
}

const sections = [];

sections.push([
  '<g id="masthead" data-panel="masthead">',
  `<rect x="40" y="30" width="4880" height="382" rx="18" fill="${C.tealWash}"/>`,
  `<text x="2480" y="119" text-anchor="middle" font-family="${FONT}" font-size="78" font-weight="bold" fill="${C.dark}">THE CHINA E-COMMERCE EFFECT</text>`,
  `<path data-title-rule="continuous" d="M 1710 151 H 3250" fill="none" stroke="${C.pale}" stroke-width="3" stroke-linecap="round" opacity="0.78"/>`,
  `<circle cx="1688" cy="151" r="5" fill="${C.blue}" opacity="0.55"/><circle cx="3272" cy="151" r="5" fill="${C.blue}" opacity="0.55"/>`,
  `<g data-masthead-visual-row="raised" transform="translate(0 ${mastheadVisualShiftY})">`,
  headerCulturalMotifs(),
  `<svg data-school-logo="hubu" x="204" y="204" width="176" height="176" viewBox="${logoBlocks.hubu.viewBox}" preserveAspectRatio="xMidYMid meet">${logoBlocks.hubu.body}</svg>`,
  `<svg data-school-logo="mmu" x="4190.6" y="205" width="490" height="174" viewBox="${logoBlocks.mmu.viewBox}" preserveAspectRatio="xMidYMid meet">${logoBlocks.mmu.body}</svg>`,
  '</g>',
  `<text x="2480" y="210" text-anchor="middle" font-family="${FONT}" font-size="36" font-weight="bold" fill="${C.mid}">FROM ONLINE DEMAND TO REGIONAL AND INDUSTRY EFFECTS</text>`,
  `<text x="2480" y="270" text-anchor="middle" font-family="${FONT}" font-size="48" font-weight="bold" fill="${C.dark}">SILKLINK FOUR</text>`,
  `<text x="2480" y="326" text-anchor="middle" font-family="${FONT}" font-size="34" font-weight="bold" fill="${C.ink}">Tian Qin · Jiacheng Tao · Yikai Wang · Peitong Song</text>`,
  `<line x1="40" y1="414" x2="4920" y2="414" stroke="${C.pale}" stroke-width="4"/>`,
  '</g>',
].join('\n'));

sections.push(sectionBar(40, 464, 1410, 'MARKET CONTEXT', 'market-context'));
sections.push([
  '<g id="market_context" data-panel="market-context-body">',
  photoTile({ id: 'online-payment', x: 56, y: 544, width: 672, height: 402, label: 'ONLINE PAYMENT', uri: photoUris.online_payment, focus: 'xMidYMid' }),
  photoTile({ id: 'delivery-worker', x: 744, y: 544, width: 690, height: 402, label: 'DELIVERY AT THE DOOR', uri: photoUris.delivery_worker, focus: 'xMidYMid' }),
  roundedPanel(56, 970, 420, 224, C.tealWash, C.teal, 18),
  `<g data-fact-id="shopper-reach-2023">`,
  `<text x="266" y="1033" text-anchor="middle" font-family="${FONT}" font-size="22" font-weight="bold" fill="${C.dark}">2023 SURVEYED SHOPPER REACH</text>`,
  `<text x="266" y="1120" text-anchor="middle" font-family="${FONT}" font-size="73" font-weight="bold" fill="${C.teal}">${shopper2023}%</text>`,
  `<text x="266" y="1165" text-anchor="middle" font-family="${FONT}" font-size="18" fill="${C.muted}">latest cross-border purchase came from China</text>`,
  '</g>',
  roundedPanel(500, 970, 934, 224, C.wash, C.grid, 18),
  `<text x="536" y="1025" font-family="${FONT}" font-size="31" font-weight="bold" fill="${C.dark}">DEMAND BECOMES A PHYSICAL NETWORK</text>`,
  `<text x="536" y="1082" font-family="${FONT}" font-size="25" fill="${C.ink}">➤ Shoppers discover and pay for products online.</text>`,
  `<text x="536" y="1132" font-family="${FONT}" font-size="25" fill="${C.ink}">➤ Warehouses, sorting systems and couriers fulfil the order.</text>`,
  `<text x="536" y="1174" font-family="${FONT}" font-size="19" fill="${C.muted}">Photo context supports the evidence; it does not substitute for it.</text>`,
  '</g>',
].join('\n'));

sections.push(sectionBar(40, 1232, 1410, 'EVIDENCE PIPELINE', 'evidence-pipeline'));

const pipelineSteps = [
  { x: 56, y: 1320, w: 648, h: 226, icon: 'source', title: 'SOURCE', line1: 'Official tables, surveys', line2: 'and peer-reviewed evidence' },
  { x: 730, y: 1320, w: 704, h: 226, icon: 'clean', title: 'STANDARDISE', line1: 'Normalize units, fields', line2: 'and year definitions' },
  { x: 56, y: 1602, w: 648, h: 226, icon: 'check', title: 'RECONCILE', line1: 'Check totals against', line2: 'exports and imports' },
  { x: 730, y: 1602, w: 704, h: 226, icon: 'grid', title: 'STRUCTURE', line1: 'Build the RCEP panel', line2: 'for comparison' },
];

const pipelineBody = ['<g id="evidence_pipeline" data-panel="evidence-pipeline-body">'];
for (const step of pipelineSteps) {
  pipelineBody.push(roundedPanel(step.x, step.y, step.w, step.h, C.white, C.pale, 18));
  pipelineBody.push(stepIcon(step.icon, step.x + 96, step.y + 112));
  pipelineBody.push(`<text x="${step.x + 180}" y="${step.y + 72}" font-family="${FONT}" font-size="30" font-weight="bold" fill="${C.dark}">${step.title}</text>`);
  pipelineBody.push(`<text x="${step.x + 180}" y="${step.y + 125}" font-family="${FONT}" font-size="23" fill="${C.ink}">${esc(step.line1)}</text>`);
  pipelineBody.push(`<text x="${step.x + 180}" y="${step.y + 170}" font-family="${FONT}" font-size="23" fill="${C.ink}">${esc(step.line2)}</text>`);
}
pipelineBody.push(`<path d="M 704 1433 H 730" stroke="${C.teal}" stroke-width="6" marker-end="url(#arrowhead)"/>`);
pipelineBody.push(`<path d="M 1082 1546 V 1582 H 378 V 1602" fill="none" stroke="${C.teal}" stroke-width="6" marker-end="url(#arrowhead)"/>`);
pipelineBody.push(`<path d="M 704 1715 H 730" stroke="${C.teal}" stroke-width="6" marker-end="url(#arrowhead)"/>`);
pipelineBody.push(roundedPanel(56, 1884, 1378, 274, C.tealWash, C.teal, 18));
pipelineBody.push(stepIcon('audit', 166, 2020));
pipelineBody.push(`<text x="274" y="1950" font-family="${FONT}" font-size="31" font-weight="bold" fill="${C.dark}">CLAIM-TO-SOURCE AUDIT</text>`);
pipelineBody.push(`<text x="274" y="2010" font-family="${FONT}" font-size="24" fill="${C.ink}">➤ Match every headline to a traceable source and scope.</text>`);
pipelineBody.push(`<text x="274" y="2058" font-family="${FONT}" font-size="24" fill="${C.ink}">➤ Keep each statistic in one place—no duplicated evidence.</text>`);
pipelineBody.push(`<text x="274" y="2106" font-family="${FONT}" font-size="24" fill="${C.ink}">➤ Record photo licences and retain reproducible data/code.</text>`);
pipelineBody.push(`<g data-fact-id="rcep-observation-count"><rect x="1014" y="1937" width="362" height="158" rx="18" fill="${C.white}" stroke="${C.pale}" stroke-width="3"/><text x="1195" y="1990" text-anchor="middle" font-family="${FONT}" font-size="20" font-weight="bold" fill="${C.muted}">RCEP PANEL</text><text x="1195" y="2055" text-anchor="middle" font-family="${FONT}" font-size="51" font-weight="bold" fill="${C.teal}">110 observations</text><text x="1195" y="2085" text-anchor="middle" font-family="${FONT}" font-size="17" fill="${C.muted}">country × year evidence cells</text></g>`);
pipelineBody.push(`<text x="56" y="2216" font-family="${FONT}" font-size="27" font-weight="bold" fill="${C.dark}">TRACEABLE OUTPUTS</text>`);
const badges = [
  { x: 56, label: 'CLEAN CSV' },
  { x: 398, label: 'PLOTTING CODE' },
  { x: 740, label: 'EDITABLE SVG' },
  { x: 1082, label: 'VECTOR PDF' },
];
for (const badge of badges) {
  pipelineBody.push(`<rect x="${badge.x}" y="2242" width="320" height="82" rx="16" fill="${C.blue}"/>`);
  pipelineBody.push(`<text x="${badge.x + 160}" y="2295" text-anchor="middle" font-family="${FONT}" font-size="23" font-weight="bold" fill="${C.white}">${badge.label}</text>`);
}
pipelineBody.push(roundedPanel(56, 2352, 1378, 340, C.wash, C.grid, 18));
pipelineBody.push(`<text x="92" y="2410" font-family="${FONT}" font-size="29" font-weight="bold" fill="${C.dark}">QUALITY GATES</text>`);
const gates = [
  'Source page retained and cited',
  'Units and time scope standardized',
  'Claims limited to observed coverage',
  'No duplicated headline statistics',
  'SVG geometry and text checked after render',
];
gates.forEach((gate, i) => {
  const y = 2460 + i * 44;
  pipelineBody.push(`<circle cx="102" cy="${y - 8}" r="14" fill="${C.teal}"/><path d="M 95 ${y - 8} L 101 ${y - 1} L 112 ${y - 16}" fill="none" stroke="${C.white}" stroke-width="4" stroke-linecap="round"/><text x="132" y="${y}" font-family="${FONT}" font-size="23" fill="${C.ink}">${esc(gate)}</text>`);
});
pipelineBody.push('</g>');
sections.push(pipelineBody.join('\n'));

sections.push(sectionBar(1480, 464, 1840, 'CORE TRADE DYNAMICS', 'trade-dynamics'));

const chart = { x: 1530, y: 625, w: 1740, h: 900, left: 112, right: 70, top: 90, bottom: 105 };
const plotX = chart.x + chart.left;
const plotY = chart.y + chart.top;
const plotW = chart.w - chart.left - chart.right;
const plotH = chart.h - chart.top - chart.bottom;
const yMax = 3.0;
const xScale = (year) => plotX + (year - 2018) / 6 * plotW;
const yScale = (value) => plotY + plotH - value / yMax * plotH;
const importsTop = tradeRows.map((row) => [xScale(row.year), yScale(row.imports)]);
const base = tradeRows.map((row) => [xScale(row.year), yScale(0)]);
const totalTop = tradeRows.map((row) => [xScale(row.year), yScale(row.total)]);

const tradeBody = [
  '<g id="trade_dynamics" data-panel="trade-dynamics-body">',
  roundedPanel(chart.x, chart.y, chart.w, chart.h, C.white, C.grid, 18),
  `<text x="${chart.x + 36}" y="${chart.y + 52}" font-family="${FONT}" font-size="31" font-weight="bold" fill="${C.dark}">AN EXPORT-LED EXPANSION</text>`,
  `<text x="${chart.x + 36}" y="${chart.y + 83}" font-family="${FONT}" font-size="20" fill="${C.muted}">Verified annual cross-border e-commerce trade, RMB trillion</text>`,
];
for (let tick = 0; tick <= yMax + 0.001; tick += 0.5) {
  const y = yScale(tick);
  tradeBody.push(`<line x1="${plotX}" y1="${y}" x2="${plotX + plotW}" y2="${y}" stroke="${C.grid}" stroke-width="2" stroke-dasharray="7 8"/>`);
  tradeBody.push(`<text x="${plotX - 22}" y="${y + 8}" text-anchor="end" font-family="${FONT}" font-size="20" fill="${C.muted}">${tick.toFixed(1)}</text>`);
}
tradeBody.push(`<path d="${areaPath(importsTop, base)}" fill="${C.pale}" opacity="0.9"/>`);
tradeBody.push(`<path d="${areaPath(totalTop, importsTop)}" fill="${C.teal}" opacity="0.86"/>`);
tradeBody.push(`<polyline points="${polyline(totalTop)}" fill="none" stroke="${C.dark}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`);
tradeRows.forEach((row) => {
  const x = xScale(row.year);
  tradeBody.push(`<line x1="${x}" y1="${plotY + plotH}" x2="${x}" y2="${plotY + plotH + 13}" stroke="${C.dark}" stroke-width="3"/>`);
  tradeBody.push(`<text x="${x}" y="${plotY + plotH + 52}" text-anchor="middle" font-family="${FONT}" font-size="22" fill="${C.ink}">${row.year}</text>`);
  tradeBody.push(`<circle cx="${x}" cy="${yScale(row.total)}" r="8" fill="${C.dark}"/>`);
});
tradeBody.push(`<text x="${chart.x + 34}" y="${plotY + plotH / 2}" transform="rotate(-90 ${chart.x + 34} ${plotY + plotH / 2})" text-anchor="middle" font-family="${FONT}" font-size="23" font-weight="bold" fill="${C.ink}">Trade value (RMB trillion)</text>`);
tradeBody.push(`<g><rect x="${chart.x + 1035}" y="${chart.y + 34}" width="26" height="26" fill="${C.teal}"/><text x="${chart.x + 1074}" y="${chart.y + 56}" font-family="${FONT}" font-size="20" fill="${C.ink}">Exports</text><rect x="${chart.x + 1215}" y="${chart.y + 34}" width="26" height="26" fill="${C.pale}"/><text x="${chart.x + 1254}" y="${chart.y + 56}" font-family="${FONT}" font-size="20" fill="${C.ink}">Imports</text><line x1="${chart.x + 1400}" y1="${chart.y + 47}" x2="${chart.x + 1452}" y2="${chart.y + 47}" stroke="${C.dark}" stroke-width="7"/><text x="${chart.x + 1466}" y="${chart.y + 56}" font-family="${FONT}" font-size="20" fill="${C.ink}">Total</text></g>`);
const latestTrade = tradeRows.at(-1);
const latestX = xScale(latestTrade.year);
tradeBody.push(`<g data-fact-id="trade-total-2024"><rect x="${latestX - 2}" y="${yScale(latestTrade.total) - 84}" width="218" height="62" rx="14" fill="${C.dark}"/><text x="${latestX + 107}" y="${yScale(latestTrade.total) - 42}" text-anchor="middle" font-family="${FONT}" font-size="28" font-weight="bold" fill="${C.white}">TOTAL 2.71</text></g>`);
tradeBody.push(`<g data-fact-id="trade-exports-2024"><rect x="${latestX - 2}" y="${yScale(latestTrade.imports + latestTrade.exports / 2) - 31}" width="218" height="62" rx="14" fill="${C.tealWash}" stroke="${C.teal}" stroke-width="3"/><text x="${latestX + 107}" y="${yScale(latestTrade.imports + latestTrade.exports / 2) + 10}" text-anchor="middle" font-family="${FONT}" font-size="27" font-weight="bold" fill="${C.teal}">EXPORTS 2.15</text></g>`);
tradeBody.push(`<g data-fact-id="trade-imports-2024"><rect x="${latestX - 2}" y="${yScale(latestTrade.imports / 2) - 31}" width="218" height="62" rx="14" fill="${C.white}" stroke="${C.pale}" stroke-width="3"/><text x="${latestX + 107}" y="${yScale(latestTrade.imports / 2) + 10}" text-anchor="middle" font-family="${FONT}" font-size="27" font-weight="bold" fill="${C.mid}">IMPORTS 0.56</text></g>`);
tradeBody.push(`<path d="M ${xScale(2021)} ${yScale(tradeRows.find((row) => row.year === 2021).total) - 18} C ${xScale(2021) + 70} ${yScale(2.48)}, ${xScale(2022) - 85} ${yScale(2.43)}, ${xScale(2022)} ${yScale(tradeRows.find((row) => row.year === 2022).total) - 14}" fill="none" stroke="${C.warm}" stroke-width="7" stroke-linecap="round"/>`);
tradeBody.push(`<text x="${xScale(2021.5)}" y="${yScale(2.55)}" text-anchor="middle" font-family="${FONT}" font-size="22" font-weight="bold" fill="${C.dark}">growth slowed before resuming</text>`);
tradeBody.push(photoTile({ id: 'checkout', x: 1530, y: 1555, width: 850, height: 560, label: 'ORDER & CHECKOUT', uri: photoUris.checkout, focus: 'xMidYMid' }));
tradeBody.push(photoTile({ id: 'parcel-sorting', x: 2408, y: 1555, width: 862, height: 560, label: 'PARCEL SORTATION', uri: photoUris.parcel_sorting, focus: 'xMidYMid' }));
tradeBody.push(roundedPanel(1530, 2145, 1740, 547, C.tealWash, C.teal, 18));
tradeBody.push(`<text x="1572" y="2215" font-family="${FONT}" font-size="33" font-weight="bold" fill="${C.dark}">WHAT THE SERIES SHOWS</text>`);
tradeBody.push(`<text x="1572" y="2282" font-family="${FONT}" font-size="28" fill="${C.ink}">➤ Export capacity carried most of the absolute increase.</text>`);
tradeBody.push(`<text x="1572" y="2340" font-family="${FONT}" font-size="28" fill="${C.ink}">➤ Import values stayed comparatively stable.</text>`);
tradeBody.push(`<text x="1572" y="2398" font-family="${FONT}" font-size="28" fill="${C.ink}">➤ The trend links digital demand to fulfilment and trade infrastructure.</text>`);
tradeBody.push(`<line x1="1572" y1="2442" x2="3228" y2="2442" stroke="${C.pale}" stroke-width="4"/>`);
tradeBody.push(`<text x="1572" y="2502" font-family="${FONT}" font-size="23" font-weight="bold" fill="${C.mid}">INTERPRETATION</text>`);
tradeBody.push(`<text x="1572" y="2550" font-family="${FONT}" font-size="23" fill="${C.ink}">The growth story is operational as well as digital: payments, inventory,</text>`);
tradeBody.push(`<text x="1572" y="2593" font-family="${FONT}" font-size="23" fill="${C.ink}">parcel handling and delivery convert online activity into observed trade.</text>`);
tradeBody.push(`<text x="1572" y="2650" font-family="${FONT}" font-size="18" fill="${C.muted}">Source: Ministry of Commerce of the PRC (2025); authors’ visualisation.</text>`);
tradeBody.push('</g>');
sections.push(tradeBody.join('\n'));

sections.push(sectionBar(3350, 464, 1570, 'REGIONAL & INDUSTRY EFFECTS', 'regional-industry-effects'));

const heat = { x: 3380, y: 612, w: 1510, h: 760, labelW: 105, top: 95, cellW: 120, cellH: 45 };
const heatStartX = heat.x + heat.labelW;
const heatStartY = heat.y + heat.top;
const effects = [
  '<g id="regional_industry_effects" data-panel="regional-industry-effects-body">',
  roundedPanel(heat.x, heat.y, heat.w, heat.h, C.white, C.grid, 18),
  `<text x="${heat.x + 28}" y="${heat.y + 45}" font-family="${FONT}" font-size="30" font-weight="bold" fill="${C.dark}">RCEP PARTNERS FOLLOW DIFFERENT PATHS</text>`,
  `<text x="${heat.x + 28}" y="${heat.y + 76}" font-family="${FONT}" font-size="19" fill="${C.muted}">Country-year trade-potential index · darker cells indicate higher values</text>`,
];
rcepYears.forEach((year, c) => {
  effects.push(`<text x="${heatStartX + c * heat.cellW + heat.cellW / 2}" y="${heatStartY - 18}" text-anchor="middle" font-family="${FONT}" font-size="20" font-weight="bold" fill="${C.ink}">${year}</text>`);
});
rcepRows.forEach((row, r) => {
  const y = heatStartY + r * heat.cellH;
  effects.push(`<text x="${heatStartX - 17}" y="${y + 30}" text-anchor="end" font-family="${FONT}" font-size="20" font-weight="bold" fill="${C.ink}">${row.country}</text>`);
  row.values.forEach((value, c) => {
    const x = heatStartX + c * heat.cellW;
    const fill = heatColor(value);
    const textColor = value > 1.24 ? C.white : C.ink;
    effects.push(`<rect x="${x}" y="${y}" width="${heat.cellW}" height="${heat.cellH}" fill="${fill}" stroke="${C.white}" stroke-width="2"/>`);
    effects.push(`<text x="${x + heat.cellW / 2}" y="${y + 29}" text-anchor="middle" font-family="${FONT}" font-size="17" font-weight="bold" fill="${textColor}">${value.toFixed(2)}</text>`);
  });
});
const groupBands = [
  { y: heatStartY, rows: 4, label: 'SIGNIFICANT', color: C.pale },
  { y: heatStartY + 4 * heat.cellH, rows: 4, label: 'EXPLORATORY', color: C.mid },
  { y: heatStartY + 8 * heat.cellH, rows: 3, label: 'RECONSTRUCTIVE', color: C.teal },
];
groupBands.forEach((band) => {
  const x = heatStartX + 10 * heat.cellW + 14;
  const h = band.rows * heat.cellH - 4;
  effects.push(`<rect x="${x}" y="${band.y + 2}" width="75" height="${h}" rx="10" fill="${band.color}"/>`);
  effects.push(`<text x="${x + 38}" y="${band.y + h / 2}" transform="rotate(-90 ${x + 38} ${band.y + h / 2})" text-anchor="middle" font-family="${FONT}" font-size="15" font-weight="bold" fill="${band.label === 'SIGNIFICANT' ? C.dark : C.white}">${band.label}</text>`);
});
effects.push(`<text x="${heatStartX + 600}" y="${heatStartY + 11 * heat.cellH + 43}" text-anchor="middle" font-family="${FONT}" font-size="20" font-weight="bold" fill="${C.ink}">Trade-potential index</text>`);
effects.push(photoTile({ id: 'last-mile', x: 3380, y: 1396, width: 740, height: 410, label: 'LAST-MILE HANDOFF', uri: photoUris.last_mile, focus: 'xMidYMid' }));
effects.push(photoTile({ id: 'warehouse', x: 4140, y: 1396, width: 750, height: 410, label: 'WAREHOUSE CAPACITY', uri: photoUris.warehouse, focus: 'xMidYMid' }));
effects.push(`<g data-fact-id="global-sales-2022">${roundedPanel(3380, 1830, 740, 250, C.tealWash, C.teal, 18)}<text x="3750" y="1885" text-anchor="middle" font-family="${FONT}" font-size="21" font-weight="bold" fill="${C.muted}">2022 INDICATIVE BUSINESS E-COMMERCE SALES</text><text x="3750" y="1982" text-anchor="middle" font-family="${FONT}" font-size="71" font-weight="bold" fill="${C.teal}">US$27T</text><text x="3750" y="2032" text-anchor="middle" font-family="${FONT}" font-size="18" fill="${C.muted}">UNCTAD estimate for the observed economy set</text></g>`);
effects.push(`<g data-fact-id="global-scope-economies">${roundedPanel(4140, 1830, 750, 250, C.wash, C.pale, 18)}<text x="4515" y="1885" text-anchor="middle" font-family="${FONT}" font-size="21" font-weight="bold" fill="${C.muted}">EVIDENCE SCOPE</text><text x="4515" y="1982" text-anchor="middle" font-family="${FONT}" font-size="71" font-weight="bold" fill="${C.dark}">43 economies</text><text x="4515" y="2032" text-anchor="middle" font-family="${FONT}" font-size="18" fill="${C.muted}">broad coverage, not a complete world total</text></g>`);
effects.push(roundedPanel(3380, 2105, 1510, 190, C.white, C.grid, 18));
effects.push(`<text x="3412" y="2160" font-family="${FONT}" font-size="29" font-weight="bold" fill="${C.dark}">INDUSTRY READING</text>`);
effects.push(`<text x="3412" y="2210" font-family="${FONT}" font-size="23" fill="${C.ink}">➤ Regional opportunities are uneven; strategy must be market-specific.</text>`);
effects.push(`<text x="3412" y="2255" font-family="${FONT}" font-size="23" fill="${C.ink}">➤ Scale depends on payment, warehousing, sorting and delivery capacity.</text>`);
effects.push(roundedPanel(3380, 2320, 1510, 372, C.wash, C.blue, 18));
effects.push(`<rect x="3396" y="2336" width="1478" height="62" rx="12" fill="${C.blue}"/>`);
effects.push(`<text x="4135" y="2379" text-anchor="middle" font-family="${FONT}" font-size="31" font-weight="bold" fill="${C.white}">REFERENCES · GITHUB</text>`);
effects.push(`<text x="3418" y="2442" font-family="${FONT}" font-size="18" fill="${C.ink}">[1] Ministry of Commerce of the PRC (2025), Report on China’s Development of Digital Trade.</text>`);
effects.push(`<text x="3418" y="2481" font-family="${FONT}" font-size="18" fill="${C.ink}">[2] Zhang &amp; Abdullah (2026), Humanities and Social Sciences Communications 13:941.</text>`);
effects.push(`<text x="3418" y="2520" font-family="${FONT}" font-size="18" fill="${C.ink}">[3] International Post Corporation (2023), Cross-Border E-commerce Shopper Survey.</text>`);
effects.push(`<text x="3418" y="2559" font-family="${FONT}" font-size="18" fill="${C.ink}">[4] UNCTAD (2024), Business e-commerce sales and the role of online platforms.</text>`);
effects.push(`<text x="3418" y="2598" font-family="${FONT}" font-size="16" fill="${C.muted}">Photos: Pexels IDs 29205862, 9461225, 7620626, 5903898, 4487488, 4277794.</text>`);
effects.push(`<g data-placeholder="github-qr"><rect x="4654" y="2425" width="190" height="190" rx="10" fill="${C.white}" stroke="${C.dark}" stroke-width="4" stroke-dasharray="13 9"/><text x="4749" y="2512" text-anchor="middle" font-family="${FONT}" font-size="26" font-weight="bold" fill="${C.dark}">GITHUB</text><text x="4749" y="2552" text-anchor="middle" font-family="${FONT}" font-size="24" font-weight="bold" fill="${C.dark}">QR</text><text x="4749" y="2645" text-anchor="middle" font-family="${FONT}" font-size="15" fill="${C.muted}">insert after review</text></g>`);
effects.push('</g>');
sections.push(effects.join('\n'));

// Recompose the poster from the strongest completed team SVG modules.
// The earlier custom four-section prototype above is intentionally retained as
// a working record, while the output below follows the latest user direction:
// natural evidence logic, direct reuse of completed work, no repeated metrics.
function escapeRegExp(value) {
  return String(value).replace(/[|\\{}()[\]^$+*?.-]/g, '\\$&');
}

function removeFirstTextNode(svgText, exactText) {
  const pattern = new RegExp('(<text\\b[^>]*>)' + escapeRegExp(exactText) + '(<\\/text>)');
  return svgText.replace(pattern, '$1$2');
}

function removeExactTextNode(svgText, exactText) {
  const pattern = new RegExp('(<text\\b[^>]*>)' + escapeRegExp(exactText) + '(<\\/text>)', 'g');
  return svgText.replace(pattern, '$1$2');
}

function removeGroupById(svgText, groupId) {
  const pattern = new RegExp('<g\\s+id="' + escapeRegExp(groupId) + '">[\\s\\S]*?<\\/g>');
  return svgText.replace(pattern, '');
}

function reusedModule({ id, x, y, width, height, crop, uri }) {
  const clip = `reused_module_clip_${id}`;
  return [
    '<g data-reused-module="' + esc(id) + '">',
    '<defs><clipPath id="' + clip + '" clipPathUnits="userSpaceOnUse"><rect x="' + x + '" y="' + y + '" width="' + width + '" height="' + height + '"/></clipPath></defs>',
    '<rect data-image-block="' + esc(id) + '" x="' + x + '" y="' + y + '" width="' + width + '" height="' + height + '" fill="#ffffff" fill-opacity="0.001" pointer-events="none"/>',
    '<g clip-path="url(#' + clip + ')">',
    '<svg x="' + x + '" y="' + y + '" width="' + width + '" height="' + height + '" viewBox="' + crop.join(' ') + '" preserveAspectRatio="none" overflow="hidden" style="overflow:hidden">',
    '<image x="0" y="0" width="1152" height="648" href="' + uri + '" preserveAspectRatio="none"/>',
    '</svg>',
    '</g>',
    '</g>',
  ].join('\n');
}

const reusedModulePaths = {
  tao_market: path.join(weekDir, '同学的', 'Tao Jiacheng - China Cross-Border E-Commerce at Scale', 'Source_Code', 'figures', 'tao_market_scale.svg'),
  qin_rcep: path.join(weekDir, 'sucai', 'Qin Tian - China E-commerce Growth and Global Trade Evidence', 'Source_Code', 'figures', 'block_c_rcep_evidence.svg'),
  wang_consumer: path.join(weekDir, '同学的', '王奕凯 - China Global Consumer Reach', 'Source_Code', 'figures', 'consumer_reach_w1_hybrid.svg'),
  song_global: path.join(weekDir, '同学的', 'sonpeitong - Global Industry Impact', 'Source_Code', 'figures', 'global_industry_impact_w1.svg'),
};

const reusedModuleRaw = {};
for (const [id, sourcePath] of Object.entries(reusedModulePaths)) {
  reusedModuleRaw[id] = await fs.readFile(sourcePath, 'utf8');
  const externalRefs = [...reusedModuleRaw[id].matchAll(/\b(?:href|xlink:href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((value) => !value.startsWith('#') && !value.startsWith('data:'));
  if (externalRefs.length) throw new Error(id + ' contains an external SVG dependency.');
}

// Tao's finished chart already labels the final total and export share inside
// the visual, so the repeated prose bullets are removed before reuse.
reusedModuleRaw.tao_market = removeExactTextNode(
  reusedModuleRaw.tao_market,
  'Trade value reached RMB 2.71 trillion in 2024.',
);
reusedModuleRaw.tao_market = removeExactTextNode(
  reusedModuleRaw.tao_market,
  'Exports represented 79.5% of the 2024 total.',
);
reusedModuleRaw.tao_market = removeGroupById(reusedModuleRaw.tao_market, 'patch_18');

// Wang's endpoint cards are retained. The duplicate endpoint labels inside the
// lower line plot are removed; that lower plot is then covered by interpretation.
reusedModuleRaw.wang_consumer = removeFirstTextNode(reusedModuleRaw.wang_consumer, '26%');
reusedModuleRaw.wang_consumer = removeFirstTextNode(reusedModuleRaw.wang_consumer, '37%');
reusedModuleRaw.qin_rcep = removeExactTextNode(
  reusedModuleRaw.qin_rcep,
  'Thresholds at 0.8 and 1.2 define three potential groups.',
);
reusedModuleRaw.qin_rcep = removeGroupById(reusedModuleRaw.qin_rcep, 'patch_22');

const reusedModuleUris = Object.fromEntries(
  Object.entries(reusedModuleRaw).map(([id, raw]) => [id, 'data:image/svg+xml;base64,' + Buffer.from(raw, 'utf8').toString('base64')]),
);

const visiblePhotoPaths = {
  'online-payment-story-a': photoPaths.online_payment,
  'warehouse-team-story-a': photoPaths.warehouse_team,
  'last-mile-step-story-a': photoPaths.delivery_step_new,
  'warehouse-worker-story-a': photoPaths.warehouse_worker,
  'checkout-story-a': photoPaths.checkout,
  'parcel-sorting-story-a': photoPaths.parcel_sorting,
  'warehouse-scale-story-a': photoPaths.warehouse_packages_new,
  'last-mile-context-story-a': photoPaths.last_mile_courier_new,
  'footer-team-process-1': photoPaths.team_process_1,
  'footer-team-process-3': photoPaths.team_process_3,
  'footer-team-process-5': photoPaths.team_process_5,
};
const visiblePhotoHashEntries = await Promise.all(Object.entries(visiblePhotoPaths).map(async ([id, source]) => ({
  id,
  source: path.relative(weekDir, source).replaceAll('\\', '/'),
  sha256: sha256(await fs.readFile(source)),
})));
const visiblePhotoHashGroups = new Map();
visiblePhotoHashEntries.forEach((item) => {
  if (!visiblePhotoHashGroups.has(item.sha256)) visiblePhotoHashGroups.set(item.sha256, []);
  visiblePhotoHashGroups.get(item.sha256).push(item.id);
});
const repeatedVisiblePhotoFiles = [...visiblePhotoHashGroups.values()].filter((ids) => ids.length > 1);
const reusedModuleEmbeddedImageHashes = [];
for (const [moduleId, raw] of Object.entries(reusedModuleRaw)) {
  const imageMatches = [...raw.matchAll(/\b(?:href|xlink:href)=["']data:image\/[^;"']+;base64,([^"']+)["']/g)];
  imageMatches.forEach((match, index) => reusedModuleEmbeddedImageHashes.push({
    moduleId,
    imageIndex: index + 1,
    sha256: sha256(Buffer.from(match[1], 'base64')),
  }));
}
const directPhotoVsModuleMatches = visiblePhotoHashEntries.flatMap((photo) =>
  reusedModuleEmbeddedImageHashes
    .filter((embedded) => embedded.sha256 === photo.sha256)
    .map((embedded) => ({ photoId: photo.id, moduleId: embedded.moduleId, moduleImageIndex: embedded.imageIndex })),
);
const reusedModuleImageHashGroups = new Map();
reusedModuleEmbeddedImageHashes.forEach((item) => {
  if (!reusedModuleImageHashGroups.has(item.sha256)) reusedModuleImageHashGroups.set(item.sha256, []);
  reusedModuleImageHashGroups.get(item.sha256).push(`${item.moduleId}:${item.imageIndex}`);
});
const repeatedReusedModuleImageFiles = [...reusedModuleImageHashGroups.values()].filter((ids) => ids.length > 1);
const reusedModulePhotoOriginPaths = {
  'tao-market-scale:warehouse-inspection': path.join(weekDir, '同学的', 'Tao Jiacheng - China Cross-Border E-Commerce at Scale', 'Source_Code', 'assets', 'warehouse_parcel_inspection_pexels_6170405.jpg'),
  'qin-rcep-evidence:last-mile-delivery': path.join(weekDir, 'sucai', 'Qin Tian - China E-commerce Growth and Global Trade Evidence', 'Source_Code', 'assets', 'last_mile_delivery_pexels_4487488.jpg'),
  'wang-consumer-reach:online-shopper': path.join(weekDir, '同学的', '王奕凯 - China Global Consumer Reach', 'Source_Code', 'assets', 'consumer_online_shopping_pexels_8788773.jpg'),
  'song-global-industry:fulfilment': path.join(weekDir, '同学的', 'sonpeitong - Global Industry Impact', 'Source_Code', 'assets', 'delivery_woman_phone_packages_pexels_9461225.jpg'),
  'song-global-industry:payment': path.join(weekDir, '同学的', 'sonpeitong - Global Industry Impact', 'Source_Code', 'assets', 'payment_terminal_pexels_8475155.jpg'),
  'song-global-industry:storage': path.join(weekDir, '同学的', 'sonpeitong - Global Industry Impact', 'Source_Code', 'assets', 'warehouse_aisle_pexels_4277794.jpg'),
  'song-global-industry:delivery': path.join(weekDir, '同学的', 'sonpeitong - Global Industry Impact', 'Source_Code', 'assets', 'delivery_van_pexels_21838827.jpg'),
};
const reusedModulePhotoOriginHashEntries = await Promise.all(Object.entries(reusedModulePhotoOriginPaths).map(async ([id, source]) => ({
  id,
  source: path.relative(weekDir, source).replaceAll('\\', '/'),
  sha256: sha256(await fs.readFile(source)),
})));
const directPhotoVsModuleOriginMatches = visiblePhotoHashEntries.flatMap((photo) =>
  reusedModulePhotoOriginHashEntries
    .filter((origin) => origin.sha256 === photo.sha256)
    .map((origin) => ({ photoId: photo.id, modulePhotoId: origin.id })),
);
const reusedModuleOriginHashGroups = new Map();
reusedModulePhotoOriginHashEntries.forEach((item) => {
  if (!reusedModuleOriginHashGroups.has(item.sha256)) reusedModuleOriginHashGroups.set(item.sha256, []);
  reusedModuleOriginHashGroups.get(item.sha256).push(item.id);
});
const repeatedReusedModuleOriginPhotoFiles = [...reusedModuleOriginHashGroups.values()].filter((ids) => ids.length > 1);

function embeddedVectorModule({ id, x, y, width, height, block }) {
  return [
    '<g data-derived-chart="' + esc(id) + '" data-reviewed-figure="' + esc(id) + '">',
    '<svg x="' + x + '" y="' + y + '" width="' + width + '" height="' + height + '" viewBox="' + block.viewBox + '" preserveAspectRatio="xMidYMid meet" overflow="hidden">',
    block.body,
    '</svg>',
    '</g>',
  ].join('\n');
}

const reviewedFigurePaths = {
  trade_mix: path.join(outputDir, 'Mini_Figure_Review_Round_3', 'A_2024_trade_mix_review.svg'),
  growth_waterfall: path.join(outputDir, 'Mini_Figure_Review_Round_3', 'B_growth_contribution_waterfall_review.svg'),
  rcep_opportunity: path.join(outputDir, 'Mini_Figure_Review_Round_3', 'C_rcep_opportunity_map_review.svg'),
};
const reviewedFigureBlocks = {};
for (const [id, sourcePath] of Object.entries(reviewedFigurePaths)) {
  let raw = await fs.readFile(sourcePath, 'utf8');
  raw = raw
    .replace('A · 2024 TRADE MIX', '2024 TRADE MIX')
    .replace('A compact donut plus four verified headline numbers', 'Verified cross-border e-commerce trade, 2024')
    .replace('B · WHO DROVE THE GROWTH?', 'WHO DROVE THE GROWTH?')
    .replace('C · RCEP OPPORTUNITY MAP', 'RCEP OPPORTUNITY MAP');
  reviewedFigureBlocks[id] = extractSvg(prefixIds(raw, 'review_' + id + '_'));
}

const githubUrl = 'https://github.com/hansu650/ice-week1-ecommerce-poster';
const githubQrPath = process.env.POSTER_QR_SVG
  ? path.resolve(process.env.POSTER_QR_SVG)
  : path.resolve(__dirname, '..', 'assets', 'qr', 'github_repo_qr.svg');
const githubQrBlock = extractSvg(prefixIds(await fs.readFile(githubQrPath, 'utf8'), 'github_qr_'));

const rcepGroupSeries = [
  { key: 'significant potential', label: 'SIGNIFICANT', color: C.blue, dash: '13 9', marker: 'circle' },
  { key: 'exploratory potential', label: 'EXPLORATORY', color: C.mid, dash: '4 8', marker: 'square' },
  { key: 'reconstructive potential', label: 'RECONSTRUCTIVE', color: C.teal, dash: '', marker: 'diamond' },
].map((group) => {
  const members = rcepRows.filter((row) => row.group === group.key);
  return {
    ...group,
    memberCount: members.length,
    values: rcepYears.map((_year, index) => members.reduce((sum, row) => sum + row.values[index], 0) / members.length),
  };
});

if (rcepGroupSeries.map((group) => group.memberCount).join(',') !== '4,4,3') {
  throw new Error('Unexpected RCEP grouping; refusing to draw derived group trends.');
}

function tradeMomentumChart(x, y, width, height) {
  const rows = tradeRows.filter((row) => row.totalYoy !== null);
  const left = 72;
  const right = 28;
  const top = 116;
  const bottom = 62;
  const px = x + left;
  const py = y + top;
  const pw = width - left - right;
  const ph = height - top - bottom;
  const yMax = 30;
  const parts = [
    '<g data-derived-chart="trade-momentum">',
    '<text x="' + (x + 28) + '" y="' + (y + 43) + '" font-family="' + FONT + '" font-size="28" font-weight="bold" fill="' + C.dark + '">TRADE MOMENTUM</text>',
    '<text x="' + (x + 28) + '" y="' + (y + 78) + '" font-family="' + FONT + '" font-size="18" fill="' + C.muted + '">Annual change in total CBEC trade (%)</text>',
    '<line x1="' + (x + 28) + '" y1="' + (y + 94) + '" x2="' + (x + width - 28) + '" y2="' + (y + 94) + '" stroke="' + C.pale + '" stroke-width="3"/>',
  ];
  [0, 10, 20, 30].forEach((tick) => {
    const ty = py + ph - tick / yMax * ph;
    parts.push('<line x1="' + px + '" y1="' + ty + '" x2="' + (px + pw) + '" y2="' + ty + '" stroke="' + C.grid + '" stroke-width="2"/>');
    parts.push('<text x="' + (px - 14) + '" y="' + (ty + 6) + '" text-anchor="end" font-family="' + FONT + '" font-size="16" fill="' + C.muted + '">' + tick + '</text>');
  });
  const slot = pw / rows.length;
  rows.forEach((row, index) => {
    const bw = slot * 0.52;
    const bx = px + index * slot + (slot - bw) / 2;
    const bh = row.totalYoy / yMax * ph;
    const by = py + ph - bh;
    parts.push('<rect x="' + bx.toFixed(2) + '" y="' + by.toFixed(2) + '" width="' + bw.toFixed(2) + '" height="' + bh.toFixed(2) + '" rx="5" fill="' + C.teal + '"/>');
    parts.push('<text x="' + (bx + bw / 2).toFixed(2) + '" y="' + (by - 9).toFixed(2) + '" text-anchor="middle" font-family="' + FONT + '" font-size="16" font-weight="bold" fill="' + C.dark + '">' + row.totalYoy.toFixed(1) + '</text>');
    parts.push('<text x="' + (bx + bw / 2).toFixed(2) + '" y="' + (py + ph + 30).toFixed(2) + '" text-anchor="middle" font-family="' + FONT + '" font-size="16" fill="' + C.ink + '">' + row.year + '</text>');
  });
  parts.push('</g>');
  return parts.join('\n');
}

function exportIntensityChart(x, y, width, height) {
  const left = 70;
  const right = 26;
  const top = 116;
  const bottom = 60;
  const px = x + left;
  const py = y + top;
  const pw = width - left - right;
  const ph = height - top - bottom;
  const slot = pw / tradeRows.length;
  const barWidth = Math.min(80, slot * 0.56);
  const change = +(tradeRows.at(-1).exportShare - tradeRows[0].exportShare).toFixed(1);
  const parts = [
    '<g data-derived-chart="export-composition">',
    '<text x="' + (x + 28) + '" y="' + (y + 43) + '" font-family="' + FONT + '" font-size="28" font-weight="bold" fill="' + C.dark + '">EXPORTS TAKE A LARGER SHARE</text>',
    '<text x="' + (x + 28) + '" y="' + (y + 78) + '" font-family="' + FONT + '" font-size="18" fill="' + C.muted + '">Export share of annual total; pale remainder = imports</text>',
    '<text x="' + (x + width - 28) + '" y="' + (y + 46) + '" text-anchor="end" font-family="' + FONT + '" font-size="26" font-weight="bold" fill="' + C.teal + '">+' + change.toFixed(1) + ' pp</text>',
    '<line x1="' + (x + 28) + '" y1="' + (y + 94) + '" x2="' + (x + width - 28) + '" y2="' + (y + 94) + '" stroke="' + C.pale + '" stroke-width="3"/>',
  ];
  parts.push('<line x1="' + px + '" y1="' + py + '" x2="' + (px + pw) + '" y2="' + py + '" stroke="' + C.grid + '" stroke-width="2"/>');
  parts.push('<line x1="' + px + '" y1="' + (py + ph) + '" x2="' + (px + pw) + '" y2="' + (py + ph) + '" stroke="' + C.grid + '" stroke-width="2"/>');
  parts.push('<text x="' + (px - 12) + '" y="' + (py + 6) + '" text-anchor="end" font-family="' + FONT + '" font-size="16" fill="' + C.muted + '">100%</text>');
  parts.push('<text x="' + (px - 12) + '" y="' + (py + ph + 6) + '" text-anchor="end" font-family="' + FONT + '" font-size="16" fill="' + C.muted + '">0%</text>');
  tradeRows.forEach((row, index) => {
    const cx = px + slot * index + slot / 2;
    const bx = cx - barWidth / 2;
    const boundaryY = py + ph - row.exportShare / 100 * ph;
    const clipId = 'diag_export_bar_' + row.year;
    const fill = index === tradeRows.length - 1 ? C.dark : C.teal;
    parts.push('<defs><clipPath id="' + clipId + '"><rect x="' + bx.toFixed(2) + '" y="' + py + '" width="' + barWidth.toFixed(2) + '" height="' + ph.toFixed(2) + '" rx="10"/></clipPath></defs>');
    parts.push('<rect x="' + bx.toFixed(2) + '" y="' + py + '" width="' + barWidth.toFixed(2) + '" height="' + ph.toFixed(2) + '" rx="10" fill="' + C.pale + '"/>');
    parts.push('<rect x="' + bx.toFixed(2) + '" y="' + boundaryY.toFixed(2) + '" width="' + barWidth.toFixed(2) + '" height="' + (py + ph - boundaryY).toFixed(2) + '" fill="' + fill + '" clip-path="url(#' + clipId + ')"/>');
    parts.push('<line x1="' + bx.toFixed(2) + '" y1="' + boundaryY.toFixed(2) + '" x2="' + (bx + barWidth).toFixed(2) + '" y2="' + boundaryY.toFixed(2) + '" stroke="' + C.white + '" stroke-width="3"/>');
    parts.push('<text x="' + cx.toFixed(2) + '" y="' + (boundaryY + 23).toFixed(2) + '" text-anchor="middle" font-family="' + FONT + '" font-size="16" font-weight="bold" fill="' + C.white + '">' + row.exportShare.toFixed(1) + '%</text>');
    parts.push('<text x="' + cx.toFixed(2) + '" y="' + (py + ph + 30).toFixed(2) + '" text-anchor="middle" font-family="' + FONT + '" font-size="16" fill="' + C.ink + '">' + row.year + '</text>');
  });
  parts.push('</g>');
  return parts.join('\n');
}

function rcepGroupTrendChart(x, y, width, height) {
  const left = 68;
  const right = 190;
  const top = 116;
  const bottom = 62;
  const px = x + left;
  const py = y + top;
  const pw = width - left - right;
  const ph = height - top - bottom;
  const yMin = 0.4;
  const yMax = 2.3;
  const sx = (index) => px + index / (rcepYears.length - 1) * pw;
  const sy = (value) => py + ph - (value - yMin) / (yMax - yMin) * ph;
  const parts = [
    '<g data-derived-chart="rcep-group-trends">',
    '<text x="' + (x + 28) + '" y="' + (y + 43) + '" font-family="' + FONT + '" font-size="28" font-weight="bold" fill="' + C.dark + '">REGIONAL TRAJECTORIES</text>',
    '<text x="' + (x + 28) + '" y="' + (y + 78) + '" font-family="' + FONT + '" font-size="18" fill="' + C.muted + '">Mean potential index by evidence group</text>',
    '<line x1="' + (x + 28) + '" y1="' + (y + 94) + '" x2="' + (x + width - 28) + '" y2="' + (y + 94) + '" stroke="' + C.pale + '" stroke-width="3"/>',
  ];
  [0.5, 1.0, 1.5, 2.0].forEach((tick) => {
    const ty = sy(tick);
    parts.push('<line x1="' + px + '" y1="' + ty + '" x2="' + (px + pw) + '" y2="' + ty + '" stroke="' + C.grid + '" stroke-width="2"/>');
    parts.push('<text x="' + (px - 12) + '" y="' + (ty + 6) + '" text-anchor="end" font-family="' + FONT + '" font-size="16" fill="' + C.muted + '">' + tick.toFixed(1) + '</text>');
  });
  rcepYears.forEach((year, index) => {
    if (index === 0 || index === 3 || index === 6 || index === 9) {
      parts.push('<text x="' + sx(index).toFixed(2) + '" y="' + (py + ph + 30).toFixed(2) + '" text-anchor="middle" font-family="' + FONT + '" font-size="16" fill="' + C.ink + '">' + year + '</text>');
    }
  });
  rcepGroupSeries.forEach((group) => {
    const points = group.values.map((value, index) => [sx(index), sy(value)]);
    parts.push('<polyline points="' + polyline(points) + '" fill="none" stroke="' + group.color + '" stroke-width="6" stroke-dasharray="' + group.dash + '" stroke-linecap="round" stroke-linejoin="round"/>');
    points.forEach(([cx, cy]) => {
      if (group.marker === 'circle') {
        parts.push('<circle cx="' + cx.toFixed(2) + '" cy="' + cy.toFixed(2) + '" r="6" fill="' + C.white + '" stroke="' + group.color + '" stroke-width="4"/>');
      } else if (group.marker === 'square') {
        parts.push('<rect x="' + (cx - 6).toFixed(2) + '" y="' + (cy - 6).toFixed(2) + '" width="12" height="12" fill="' + C.white + '" stroke="' + group.color + '" stroke-width="4"/>');
      } else {
        parts.push('<path d="M ' + cx.toFixed(2) + ' ' + (cy - 8).toFixed(2) + ' L ' + (cx + 8).toFixed(2) + ' ' + cy.toFixed(2) + ' L ' + cx.toFixed(2) + ' ' + (cy + 8).toFixed(2) + ' L ' + (cx - 8).toFixed(2) + ' ' + cy.toFixed(2) + ' Z" fill="' + C.white + '" stroke="' + group.color + '" stroke-width="4"/>');
      }
    });
    const endY = sy(group.values.at(-1));
    parts.push('<text x="' + (px + pw + 16) + '" y="' + (endY + 6).toFixed(2) + '" font-family="' + FONT + '" font-size="15" font-weight="bold" fill="' + C.ink + '">' + group.label + ' (n=' + group.memberCount + ')</text>');
  });
  parts.push('</g>');
  return parts.join('\n');
}

const legacyRecomposedSections = [sections[0]];
legacyRecomposedSections.push(sectionBar(40, 464, 1120, 'OVERVIEW & EVIDENCE ROUTE', 'overview-evidence'));
legacyRecomposedSections.push(sectionBar(1190, 464, 1870, 'TRADE SCALE & OPERATIONS', 'trade-operations'));
legacyRecomposedSections.push(sectionBar(3090, 464, 1830, 'REGIONAL & GLOBAL EFFECTS', 'regional-global'));

const left = ['<g id="overview_evidence" data-panel="overview-evidence-body">'];
left.push(roundedPanel(56, 548, 1088, 340, C.tealWash, C.teal, 18));
left.push('<text x="92" y="612" font-family="' + FONT + '" font-size="36" font-weight="bold" fill="' + C.dark + '">THE QUESTION</text>');
left.push('<text x="92" y="672" font-family="' + FONT + '" font-size="27" fill="' + C.ink + '">How does online demand become observable</text>');
left.push('<text x="92" y="718" font-family="' + FONT + '" font-size="27" fill="' + C.ink + '">trade, regional opportunity and industry capacity?</text>');
left.push('<line x1="103" y1="764" x2="103" y2="851" stroke="' + C.teal + '" stroke-width="6"/>');
const overviewNodes = [
  { y: 774, label: 'ONLINE DEMAND' },
  { y: 802, label: 'VERIFIED TRADE' },
  { y: 830, label: 'MARKET-SPECIFIC EFFECTS' },
  { y: 858, label: 'FULFILMENT CAPACITY' },
];
overviewNodes.forEach((node) => {
  left.push('<circle cx="103" cy="' + node.y + '" r="9" fill="' + C.teal + '"/>');
  left.push('<text x="131" y="' + (node.y + 8) + '" font-family="' + FONT + '" font-size="21" font-weight="bold" fill="' + C.dark + '">' + node.label + '</text>');
});

left.push(roundedPanel(56, 916, 1088, 930, C.white, C.pale, 18));
left.push('<text x="92" y="980" font-family="' + FONT + '" font-size="34" font-weight="bold" fill="' + C.dark + '">HOW THE EVIDENCE WAS BUILT</text>');
left.push('<text x="92" y="1023" font-family="' + FONT + '" font-size="21" fill="' + C.muted + '">A reproducible route from source material to poster claim</text>');
const evidenceSteps = [
  ['SOURCE', 'Official trade tables, survey evidence and peer-reviewed regional data'],
  ['STANDARDISE', 'Align units, year fields, country names and stated scope'],
  ['RECONCILE', 'Check totals against components and inspect discontinuities'],
  ['STRUCTURE', 'Create time-series and country-year evidence panels'],
  ['AUDIT', 'Link every visible claim to one source and one location'],
];
evidenceSteps.forEach((step, index) => {
  const cy = 1110 + index * 142;
  if (index < evidenceSteps.length - 1) {
    left.push('<line x1="126" y1="' + (cy + 34) + '" x2="126" y2="' + (cy + 109) + '" stroke="' + C.pale + '" stroke-width="7"/>');
  }
  left.push('<circle cx="126" cy="' + cy + '" r="34" fill="' + (index === evidenceSteps.length - 1 ? C.teal : C.blue) + '"/>');
  left.push('<text x="126" y="' + (cy + 10) + '" text-anchor="middle" font-family="' + FONT + '" font-size="25" font-weight="bold" fill="' + C.white + '">' + (index + 1) + '</text>');
  left.push('<text x="188" y="' + (cy - 5) + '" font-family="' + FONT + '" font-size="27" font-weight="bold" fill="' + C.dark + '">' + step[0] + '</text>');
  left.push('<text x="188" y="' + (cy + 34) + '" font-family="' + FONT + '" font-size="20" fill="' + C.ink + '">' + esc(step[1]) + '</text>');
});

left.push(photoTile({
  id: 'online-payment-story',
  x: 56,
  y: 1874,
  width: 1088,
  height: 465,
  label: 'ONLINE PAYMENT · DEMAND ENTERS THE CHAIN',
  uri: photoUris.online_payment,
  focus: 'xMidYMid',
}));
left.push(roundedPanel(56, 2367, 1088, 555, C.wash, C.grid, 18));
left.push('<text x="92" y="2433" font-family="' + FONT + '" font-size="34" font-weight="bold" fill="' + C.dark + '">TRACEABLE WORK, NOT DECORATION</text>');
left.push('<text x="92" y="2495" font-family="' + FONT + '" font-size="24" fill="' + C.ink + '">➤ Clean source tables and documented transformations</text>');
left.push('<text x="92" y="2547" font-family="' + FONT + '" font-size="24" fill="' + C.ink + '">➤ Reusable plotting code and editable vector modules</text>');
left.push('<text x="92" y="2599" font-family="' + FONT + '" font-size="24" fill="' + C.ink + '">➤ Photo provenance and claim-to-source notes</text>');
left.push('<line x1="92" y1="2640" x2="1108" y2="2640" stroke="' + C.pale + '" stroke-width="4"/>');
left.push('<text x="92" y="2705" font-family="' + FONT + '" font-size="28" font-weight="bold" fill="' + C.teal + '">ONE FACT · ONE PLACE</text>');
left.push('<text x="92" y="2754" font-family="' + FONT + '" font-size="23" fill="' + C.ink + '">Repeated metric cards are removed. Space is used for</text>');
left.push('<text x="92" y="2795" font-family="' + FONT + '" font-size="23" fill="' + C.ink + '">source-traced photographs, method and interpretation.</text>');
left.push('<text x="92" y="2874" font-family="' + FONT + '" font-size="19" fill="' + C.muted + '">Deliverables: clean CSV · plotting code · editable SVG · vector PDF</text>');
left.push('</g>');
legacyRecomposedSections.push(left.join('\n'));

const centre = ['<g id="trade_operations" data-panel="trade-operations-body">'];
centre.push(reusedModule({
  id: 'tao-market-scale',
  x: 1204,
  y: 548,
  width: 1842,
  height: 812,
  crop: [0, 140, 1152, 508],
  uri: reusedModuleUris.tao_market,
}));
centre.push(photoTile({
  id: 'checkout-story',
  x: 1204,
  y: 1390,
  width: 906,
  height: 480,
  label: 'CHECKOUT · THE COMMERCIAL TRIGGER',
  uri: photoUris.checkout,
  focus: 'xMidYMid',
}));
centre.push(photoTile({
  id: 'parcel-sorting-story',
  x: 2140,
  y: 1390,
  width: 906,
  height: 480,
  label: 'SORTATION · THE OPERATIONAL BRIDGE',
  uri: photoUris.parcel_sorting,
  focus: 'xMidYMid',
}));
centre.push(roundedPanel(1204, 1898, 1842, 640, C.white, C.grid, 18));
centre.push('<text x="1248" y="1968" font-family="' + FONT + '" font-size="36" font-weight="bold" fill="' + C.dark + '">EVIDENCE → MEANING</text>');
centre.push('<line x1="1405" y1="2078" x2="2845" y2="2078" stroke="' + C.pale + '" stroke-width="12" stroke-linecap="round"/>');
const meaningNodes = [
  { x: 1405, title: 'ONLINE ORDER', line: 'demand signal' },
  { x: 2125, title: 'TRADE FLOW', line: 'recorded movement' },
  { x: 2845, title: 'LOGISTICS CAPACITY', line: 'physical delivery' },
];
meaningNodes.forEach((node, index) => {
  centre.push('<circle cx="' + node.x + '" cy="2078" r="42" fill="' + (index === 1 ? C.teal : C.blue) + '"/>');
  centre.push('<text x="' + node.x + '" y="2155" text-anchor="middle" font-family="' + FONT + '" font-size="25" font-weight="bold" fill="' + C.dark + '">' + node.title + '</text>');
  centre.push('<text x="' + node.x + '" y="2192" text-anchor="middle" font-family="' + FONT + '" font-size="20" fill="' + C.muted + '">' + node.line + '</text>');
});
centre.push('<text x="1248" y="2270" font-family="' + FONT + '" font-size="27" fill="' + C.ink + '">➤ Export expansion is the outcome of a connected operating system,</text>');
centre.push('<text x="1286" y="2317" font-family="' + FONT + '" font-size="27" fill="' + C.ink + '">not of a storefront alone.</text>');
centre.push('<text x="1248" y="2375" font-family="' + FONT + '" font-size="27" fill="' + C.ink + '">➤ Payment, inventory, parcel handling and delivery are the bridge</text>');
centre.push('<text x="1286" y="2422" font-family="' + FONT + '" font-size="27" fill="' + C.ink + '">between digital demand and observed trade.</text>');
centre.push('<text x="1248" y="2490" font-family="' + FONT + '" font-size="18" fill="' + C.muted + '">Reused module: Tao Jiacheng · verified trade series and warehouse context</text>');
centre.push(roundedPanel(1204, 2566, 1842, 356, C.tealWash, C.teal, 18));
centre.push('<text x="1248" y="2636" font-family="' + FONT + '" font-size="34" font-weight="bold" fill="' + C.dark + '">TAKEAWAY</text>');
centre.push('<text x="1248" y="2700" font-family="' + FONT + '" font-size="29" font-weight="bold" fill="' + C.teal + '">China’s e-commerce effect is a chain, not a single sales number.</text>');
centre.push('<text x="1248" y="2760" font-family="' + FONT + '" font-size="25" fill="' + C.ink + '">Digital demand becomes export-led trade through fulfilment capacity;</text>');
centre.push('<text x="1248" y="2807" font-family="' + FONT + '" font-size="25" fill="' + C.ink + '">the resulting opportunities differ by market and regional context.</text>');
centre.push('<text x="1248" y="2872" font-family="' + FONT + '" font-size="19" fill="' + C.muted + '">The poster therefore moves from mechanism → trade evidence → differentiated effects.</text>');
centre.push('</g>');
legacyRecomposedSections.push(centre.join('\n'));

const right = ['<g id="regional_global" data-panel="regional-global-body">'];
right.push(reusedModule({
  id: 'qin-rcep-evidence',
  x: 3104,
  y: 548,
  width: 1802,
  height: 927,
  crop: [0, 55, 1152, 593],
  uri: reusedModuleUris.qin_rcep,
}));
right.push(reusedModule({
  id: 'wang-consumer-reach',
  x: 3104,
  y: 1505,
  width: 887,
  height: 457,
  crop: [0, 55, 1152, 593],
  uri: reusedModuleUris.wang_consumer,
}));
right.push(roundedPanel(3468, 1658, 507, 288, C.wash, C.grid, 14));
right.push('<text x="3502" y="1712" font-family="' + FONT + '" font-size="25" font-weight="bold" fill="' + C.dark + '">SURVEY SIGNAL</text>');
right.push('<text x="3502" y="1762" font-family="' + FONT + '" font-size="20" fill="' + C.ink + '">A wider overseas customer base</text>');
right.push('<text x="3502" y="1800" font-family="' + FONT + '" font-size="20" fill="' + C.ink + '">supports the demand side of the story.</text>');
right.push('<text x="3502" y="1876" font-family="' + FONT + '" font-size="16" fill="' + C.muted + '">Endpoint cards retained;</text>');
right.push('<text x="3502" y="1906" font-family="' + FONT + '" font-size="16" fill="' + C.muted + '">duplicate line labels removed.</text>');
right.push(reusedModule({
  id: 'song-global-industry',
  x: 4019,
  y: 1505,
  width: 887,
  height: 457,
  crop: [0, 55, 1152, 593],
  uri: reusedModuleUris.song_global,
}));
right.push(roundedPanel(3104, 1990, 1802, 310, C.tealWash, C.teal, 18));
right.push('<text x="3142" y="2052" font-family="' + FONT + '" font-size="32" font-weight="bold" fill="' + C.dark + '">SYNTHESIS</text>');
right.push('<text x="3142" y="2112" font-family="' + FONT + '" font-size="25" fill="' + C.ink + '">➤ Regional evidence rejects a one-size-fits-all expansion story.</text>');
right.push('<text x="3142" y="2161" font-family="' + FONT + '" font-size="25" fill="' + C.ink + '">➤ Consumer reach explains demand; industry scale explains capacity.</text>');
right.push('<text x="3142" y="2210" font-family="' + FONT + '" font-size="25" fill="' + C.ink + '">➤ Together they connect market opportunity to operational readiness.</text>');
right.push('<text x="3142" y="2260" font-family="' + FONT + '" font-size="17" fill="' + C.muted + '">Reused modules: Qin Tian · Yikai Wang · Peitong Song</text>');
right.push(roundedPanel(3104, 2328, 1802, 594, C.white, C.blue, 18));
right.push('<rect x="3120" y="2344" width="1770" height="66" rx="12" fill="' + C.blue + '"/>');
right.push('<text x="4005" y="2389" text-anchor="middle" font-family="' + FONT + '" font-size="31" font-weight="bold" fill="' + C.white + '">SOURCES & REPRODUCIBILITY</text>');
right.push('<text x="3146" y="2464" font-family="' + FONT + '" font-size="20" fill="' + C.ink + '">[1] Ministry of Commerce of the PRC (2025), digital trade report.</text>');
right.push('<text x="3146" y="2511" font-family="' + FONT + '" font-size="20" fill="' + C.ink + '">[2] Zhang &amp; Abdullah (2026), Humanities &amp; Social Sciences Communications.</text>');
right.push('<text x="3146" y="2558" font-family="' + FONT + '" font-size="20" fill="' + C.ink + '">[3] International Post Corporation (2023), shopper survey.</text>');
right.push('<text x="3146" y="2605" font-family="' + FONT + '" font-size="20" fill="' + C.ink + '">[4] UNCTAD (2024), business e-commerce sales technical note.</text>');
right.push('<text x="3146" y="2670" font-family="' + FONT + '" font-size="18" fill="' + C.muted + '">Photos: source-traced Pexels originals retained in the project archive.</text>');
right.push('<text x="3146" y="2710" font-family="' + FONT + '" font-size="18" fill="' + C.muted + '">Modules remain editable SVG; data, scripts and source notes are preserved.</text>');
right.push('<g data-placeholder="github-qr"><rect x="4612" y="2445" width="238" height="238" rx="12" fill="' + C.wash + '" stroke="' + C.dark + '" stroke-width="4" stroke-dasharray="14 9"/><text x="4731" y="2548" text-anchor="middle" font-family="' + FONT + '" font-size="27" font-weight="bold" fill="' + C.dark + '">GITHUB</text><text x="4731" y="2590" text-anchor="middle" font-family="' + FONT + '" font-size="25" font-weight="bold" fill="' + C.dark + '">QR</text><text x="4731" y="2714" text-anchor="middle" font-family="' + FONT + '" font-size="15" fill="' + C.muted + '">insert after review</text></g>');
right.push('<line x1="3146" y1="2760" x2="4850" y2="2760" stroke="' + C.grid + '" stroke-width="3"/>');
right.push('<text x="3146" y="2820" font-family="' + FONT + '" font-size="20" font-weight="bold" fill="' + C.teal + '">EDITABLE MASTER</text>');
right.push('<text x="3146" y="2860" font-family="' + FONT + '" font-size="18" fill="' + C.ink + '">Fixed width · content-driven height · vector charts and logos</text>');
right.push('<text x="3146" y="2898" font-family="' + FONT + '" font-size="16" fill="' + C.muted + '">Photographs are embedded at original resolution inside the self-contained SVG.</text>');
right.push('</g>');
legacyRecomposedSections.push(right.join('\n'));

const recomposedSections = [sections[0]];

const flowRibbon = [
  '<g id="layout_a_reading_path" data-panel="reading-path">',
  '<path d="M 330 515 C 700 482, 1160 482, 1550 515 S 2810 548, 3220 515 S 4140 482, 4560 515" fill="none" stroke="' + C.pale + '" stroke-width="5" stroke-linecap="round"/>',
];
const flowStages = [
  { x: 330, n: 1, title: 'QUESTION & METHOD' },
  { x: 1550, n: 2, title: 'TRADE SCALE' },
  { x: 3220, n: 3, title: 'REGIONAL & GLOBAL' },
  { x: 4560, n: 4, title: 'SYNTHESIS' },
];
flowStages.forEach((stage, index) => {
  flowRibbon.push('<g data-section-title="stage-' + stage.n + '">');
  flowRibbon.push('<circle cx="' + stage.x + '" cy="515" r="27" fill="' + (index === 3 ? C.teal : C.blue) + '" stroke="' + C.white + '" stroke-width="4"/>');
  flowRibbon.push('<text x="' + stage.x + '" y="524" text-anchor="middle" font-family="' + FONT + '" font-size="22" font-weight="bold" fill="' + C.white + '">' + stage.n + '</text>');
  flowRibbon.push('<text x="' + stage.x + '" y="584" text-anchor="middle" font-family="' + FONT + '" font-size="24" font-weight="bold" fill="' + C.dark + '">' + stage.title + '</text>');
  flowRibbon.push('</g>');
});
flowRibbon.push('</g>');
recomposedSections.push(flowRibbon.join('\n'));

const connectorLayer = [
  '<g id="layout_a_connectors" data-panel="reading-connectors" fill="none" stroke="' + C.blue + '" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.92">',
  '<g data-stage-bridge="1"><circle cx="1174" cy="999" r="13" fill="' + C.blue + '" stroke="' + C.white + '" stroke-width="2"/><text x="1174" y="1006" text-anchor="middle" font-family="' + FONT + '" font-size="17" font-weight="bold" fill="' + C.white + '" stroke="none">1</text><path data-layout-arrow="journey-to-trade" d="M 1159 1030 H 1189" marker-end="url(#moduleArrowhead)"/></g>',
  '<g data-stage-bridge="2"><circle cx="3049" cy="1084" r="13" fill="' + C.blue + '" stroke="' + C.white + '" stroke-width="2"/><text x="3049" y="1091" text-anchor="middle" font-family="' + FONT + '" font-size="17" font-weight="bold" fill="' + C.white + '" stroke="none">2</text><path data-layout-arrow="trade-to-region" d="M 3034 1115 H 3064" marker-end="url(#moduleArrowhead)"/></g>',
  '<g data-stage-bridge="3"><circle cx="3958" cy="1622" r="13" fill="' + C.blue + '" stroke="' + C.white + '" stroke-width="2"/><text x="3958" y="1629" text-anchor="middle" font-family="' + FONT + '" font-size="17" font-weight="bold" fill="' + C.white + '" stroke="none">3</text><path data-layout-arrow="region-to-industry" d="M 3990 1607 V 1637" marker-end="url(#moduleArrowhead)"/></g>',
  '<g data-stage-bridge="4"><circle cx="4728" cy="2718" r="13" fill="' + C.blue + '" stroke="' + C.white + '" stroke-width="2"/><text x="4728" y="2725" text-anchor="middle" font-family="' + FONT + '" font-size="17" font-weight="bold" fill="' + C.white + '" stroke="none">4</text><path data-layout-arrow="synthesis-to-figures" d="M 4760 2703 V 2733" marker-end="url(#moduleArrowhead)"/></g>',
  '</g>',
];

const evidenceRail = ['<g id="layout_a_evidence_rail" data-panel="evidence-rail">'];
evidenceRail.push(roundedPanel(56, 630, 1088, 300, C.tealWash, C.teal, 18));
evidenceRail.push('<text x="92" y="692" font-family="' + FONT + '" font-size="35" font-weight="bold" fill="' + C.dark + '">THE QUESTION</text>');
evidenceRail.push('<text x="92" y="746" font-family="' + FONT + '" font-size="25" fill="' + C.ink + '">How does online demand become observable trade,</text>');
evidenceRail.push('<text x="92" y="787" font-family="' + FONT + '" font-size="25" fill="' + C.ink + '">regional opportunity and industry capacity?</text>');
evidenceRail.push('<line x1="112" y1="846" x2="1050" y2="846" stroke="' + C.pale + '" stroke-width="7" stroke-linecap="round"/>');
const questionNodes = [
  { x: 112, label: 'DEMAND' },
  { x: 414, label: 'TRADE' },
  { x: 706, label: 'MARKETS' },
  { x: 1016, label: 'CAPACITY' },
];
questionNodes.forEach((node, index) => {
  evidenceRail.push('<circle cx="' + node.x + '" cy="846" r="18" fill="' + (index === 3 ? C.teal : C.blue) + '"/>');
  evidenceRail.push('<text x="' + node.x + '" y="892" text-anchor="middle" font-family="' + FONT + '" font-size="17" font-weight="bold" fill="' + C.dark + '">' + node.label + '</text>');
});

evidenceRail.push(roundedPanel(56, 960, 1088, 840, C.white, C.pale, 18));
evidenceRail.push('<text x="92" y="1022" font-family="' + FONT + '" font-size="33" font-weight="bold" fill="' + C.dark + '">HOW THE EVIDENCE WAS BUILT</text>');
evidenceRail.push('<text x="92" y="1060" font-family="' + FONT + '" font-size="19" fill="' + C.muted + '">A reproducible route from source material to poster claim</text>');
const layoutASteps = [
  ['SOURCE', 'Official trade tables, survey evidence and regional data'],
  ['STANDARDISE', 'Align units, years, country names and stated scope'],
  ['RECONCILE', 'Check totals, components and discontinuities'],
  ['STRUCTURE', 'Build time-series and country-year panels'],
  ['AUDIT', 'Link every visible claim to one source location'],
];
layoutASteps.forEach((step, index) => {
  const cy = 1132 + index * 131;
  if (index < layoutASteps.length - 1) {
    evidenceRail.push('<line x1="126" y1="' + (cy + 31) + '" x2="126" y2="' + (cy + 101) + '" stroke="' + C.pale + '" stroke-width="7"/>');
  }
  evidenceRail.push('<circle cx="126" cy="' + cy + '" r="31" fill="' + (index === layoutASteps.length - 1 ? C.teal : C.blue) + '"/>');
  evidenceRail.push('<text x="126" y="' + (cy + 9) + '" text-anchor="middle" font-family="' + FONT + '" font-size="23" font-weight="bold" fill="' + C.white + '">' + (index + 1) + '</text>');
  evidenceRail.push('<text x="184" y="' + (cy - 5) + '" font-family="' + FONT + '" font-size="25" font-weight="bold" fill="' + C.dark + '">' + step[0] + '</text>');
  evidenceRail.push('<text x="184" y="' + (cy + 33) + '" font-family="' + FONT + '" font-size="18" fill="' + C.ink + '">' + esc(step[1]) + '</text>');
});

evidenceRail.push(photoTile({
  id: 'online-payment-story-a',
  x: 56,
  y: 1830,
  width: 1088,
  height: 420,
  label: 'ONLINE PAYMENT · DEMAND ENTERS THE CHAIN',
  uri: photoUris.online_payment,
  focus: 'xMidYMid',
}));

evidenceRail.push(roundedPanel(56, 2280, 1088, 520, C.wash, C.grid, 18));
evidenceRail.push('<text x="92" y="2345" font-family="' + FONT + '" font-size="32" font-weight="bold" fill="' + C.dark + '">TRACEABLE WORK, NOT DECORATION</text>');
evidenceRail.push('<text x="92" y="2412" font-family="' + FONT + '" font-size="23" fill="' + C.ink + '">➤ Clean source tables and documented transformations</text>');
evidenceRail.push('<text x="92" y="2464" font-family="' + FONT + '" font-size="23" fill="' + C.ink + '">➤ Reusable plotting code and editable vector modules</text>');
evidenceRail.push('<text x="92" y="2516" font-family="' + FONT + '" font-size="23" fill="' + C.ink + '">➤ Photo provenance and claim-to-source notes</text>');
evidenceRail.push('<line x1="92" y1="2560" x2="1108" y2="2560" stroke="' + C.pale + '" stroke-width="4"/>');
evidenceRail.push('<text x="92" y="2620" font-family="' + FONT + '" font-size="27" font-weight="bold" fill="' + C.teal + '">ONE FACT · ONE PLACE</text>');
evidenceRail.push('<text x="92" y="2670" font-family="' + FONT + '" font-size="21" fill="' + C.ink + '">Headline values stay in their source modules.</text>');
evidenceRail.push('<text x="92" y="2712" font-family="' + FONT + '" font-size="21" fill="' + C.ink + '">New mini-plots show derived patterns, not copied cards.</text>');
evidenceRail.push('<text x="92" y="2762" font-family="' + FONT + '" font-size="17" fill="' + C.muted + '">Clean CSV · plotting code · editable SVG · vector PDF</text>');

evidenceRail.push(roundedPanel(56, 2830, 1088, 720, C.white, C.blue, 18));
evidenceRail.push('<rect x="72" y="2846" width="1056" height="68" rx="12" fill="' + C.blue + '"/>');
evidenceRail.push('<text x="600" y="2892" text-anchor="middle" font-family="' + FONT + '" font-size="30" font-weight="bold" fill="' + C.white + '">EVIDENCE INVENTORY</text>');
evidenceRail.push('<text x="92" y="2960" font-family="' + FONT + '" font-size="18" font-weight="bold" fill="' + C.muted + '">ASSET</text>');
evidenceRail.push('<text x="475" y="2960" font-family="' + FONT + '" font-size="18" font-weight="bold" fill="' + C.muted + '">COVERAGE</text>');
evidenceRail.push('<text x="860" y="2960" font-family="' + FONT + '" font-size="18" font-weight="bold" fill="' + C.muted + '">ROLE</text>');
const inventoryRows = [
  ['Trade series', tradeRows.length + ' annual rows', tradeRows[0].year + '–' + tradeRows.at(-1).year],
  ['RCEP matrix', rcepRows.length + ' partners × ' + rcepYears.length + ' years', 'regional index'],
  ['Shopper trend', '2 endpoints', 'trend n=' + shopperTrendSample.toLocaleString('en-US')],
  ['Team artwork', '4 SVG modules', 'editable vectors'],
];
inventoryRows.forEach((row, index) => {
  const top = 2990 + index * 108;
  if (index > 0) evidenceRail.push('<line x1="92" y1="' + (top - 14) + '" x2="1108" y2="' + (top - 14) + '" stroke="' + C.grid + '" stroke-width="2"/>');
  evidenceRail.push('<text x="92" y="' + (top + 36) + '" font-family="' + FONT + '" font-size="22" font-weight="bold" fill="' + C.dark + '">' + row[0] + '</text>');
  evidenceRail.push('<text x="475" y="' + (top + 36) + '" font-family="' + FONT + '" font-size="21" fill="' + C.ink + '">' + row[1] + '</text>');
  evidenceRail.push('<text x="860" y="' + (top + 36) + '" font-family="' + FONT + '" font-size="19" fill="' + C.muted + '">' + row[2] + '</text>');
});
evidenceRail.push('<line x1="92" y1="3435" x2="1108" y2="3435" stroke="' + C.grid + '" stroke-width="2"/>');
evidenceRail.push('<text x="92" y="3488" font-family="' + FONT + '" font-size="17" fill="' + C.muted + '">All coverage counts are calculated from the archived source files.</text>');
evidenceRail.push('</g>');
// The previous evidence rail remains above as a construction record. The
// refined layout below separates the real-world journey from our research
// workflow and removes the two meta blocks that obscured the story.
const refinedEvidenceRail = ['<g id="layout_a_evidence_rail_refined" data-panel="evidence-rail">'];
refinedEvidenceRail.push('<text x="56" y="674" font-family="' + FONT + '" font-size="20" font-weight="bold" fill="' + C.teal + '">REAL-WORLD JOURNEY</text>');
refinedEvidenceRail.push('<text x="56" y="722" font-family="' + FONT + '" font-size="38" font-weight="bold" fill="' + C.dark + '">FROM A CLICK TO CAPACITY</text>');
refinedEvidenceRail.push('<text x="56" y="764" font-family="' + FONT + '" font-size="22" fill="' + C.ink + '">How online demand becomes observable trade and fulfilment activity</text>');
refinedEvidenceRail.push('<line x1="56" y1="790" x2="1144" y2="790" stroke="' + C.pale + '" stroke-width="4"/>');

refinedEvidenceRail.push(photoTile({
  id: 'online-payment-story-a',
  x: 56,
  y: 818,
  width: 524,
  height: 394,
  label: '1  CLICK & PAY',
  uri: photoUris.online_payment,
  focus: 'xMidYMid',
}));
refinedEvidenceRail.push(photoTile({
  id: 'warehouse-team-story-a',
  x: 620,
  y: 818,
  width: 524,
  height: 394,
  label: '2  STOCK & PICK',
  uri: photoUris.warehouse_team,
  focus: 'xMidYMid',
}));
refinedEvidenceRail.push(photoTile({
  id: 'last-mile-step-story-a',
  x: 56,
  y: 1252,
  width: 524,
  height: 394,
  label: '4  MOVE & DELIVER',
  uri: photoUris.delivery_step_new,
  focus: 'xMidYMid',
}));
refinedEvidenceRail.push(photoTile({
  id: 'warehouse-worker-story-a',
  x: 620,
  y: 1252,
  width: 524,
  height: 394,
  label: '3  PACK & SORT',
  uri: photoUris.warehouse_worker,
  focus: 'xMidYMid',
}));
refinedEvidenceRail.push('<g fill="none" stroke="' + C.teal + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.78">');
refinedEvidenceRail.push('<path d="M 592 1007 L 606 1015 L 592 1023"/>');
refinedEvidenceRail.push('<path d="M 874 1226 L 882 1240 L 890 1226"/>');
refinedEvidenceRail.push('<path d="M 608 1441 L 594 1449 L 608 1457"/>');
refinedEvidenceRail.push('</g>');
refinedEvidenceRail.push('<text x="600" y="1696" text-anchor="middle" font-family="' + FONT + '" font-size="25" font-weight="bold" fill="' + C.teal + '">DEMAND → OPERATIONS → TRADE CAPACITY</text>');

refinedEvidenceRail.push('<line x1="56" y1="1750" x2="1144" y2="1750" stroke="' + C.grid + '" stroke-width="3"/>');
refinedEvidenceRail.push('<text x="56" y="1812" font-family="' + FONT + '" font-size="20" font-weight="bold" fill="' + C.teal + '">CAPACITY IN CONTEXT</text>');
refinedEvidenceRail.push('<text x="56" y="1860" font-family="' + FONT + '" font-size="35" font-weight="bold" fill="' + C.dark + '">REAL OPERATIONS BEHIND THE NUMBERS</text>');
refinedEvidenceRail.push('<line x1="56" y1="1884" x2="1144" y2="1884" stroke="' + C.pale + '" stroke-width="4"/>');
refinedEvidenceRail.push(photoTile({
  id: 'warehouse-scale-story-a',
  x: 56,
  y: 1908,
  width: 1088,
  height: 628,
  label: 'WAREHOUSE SCALE · CAPACITY ON THE GROUND',
  uri: photoUris.warehouse_packages_new,
  focus: 'xMidYMid',
}));
refinedEvidenceRail.push('<path d="M 592 2553 L 600 2567 L 608 2553" fill="none" stroke="' + C.teal + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.78"/>');
refinedEvidenceRail.push(photoTile({
  id: 'last-mile-context-story-a',
  x: 56,
  y: 2586,
  width: 1088,
  height: 850,
  label: 'LAST-MILE DELIVERY · REGIONAL REACH',
  uri: photoUris.last_mile_courier_new,
  focus: 'xMidYMid',
}));
refinedEvidenceRail.push('</g>');
recomposedSections.push(refinedEvidenceRail.join('\n'));

const heroModules = ['<g id="layout_a_hero_modules" data-panel="hero-modules">'];
heroModules.push(reusedModule({
  id: 'tao-market-scale',
  x: 1204,
  y: 630,
  width: 1818,
  height: 802,
  crop: [0, 140, 1152, 508],
  uri: reusedModuleUris.tao_market,
}));
heroModules.push(photoTile({
  id: 'checkout-story-a',
  x: 1204,
  y: 1462,
  width: 896,
  height: 278,
  label: 'CHECKOUT · COMMERCIAL TRIGGER',
  uri: photoUris.checkout,
  focus: 'xMidYMid',
}));
heroModules.push(photoTile({
  id: 'parcel-sorting-story-a',
  x: 2126,
  y: 1462,
  width: 896,
  height: 278,
  label: 'SORTATION · OPERATIONAL BRIDGE',
  uri: photoUris.parcel_sorting,
  focus: 'xMidYMid',
}));
heroModules.push(reusedModule({
  id: 'wang-consumer-reach',
  x: 1204,
  y: 1770,
  width: 1818,
  height: 936,
  crop: [0, 55, 1152, 593],
  uri: reusedModuleUris.wang_consumer,
}));
heroModules.push(reusedModule({
  id: 'qin-rcep-evidence',
  x: 3074,
  y: 660,
  width: 1832,
  height: 944,
  crop: [0, 55, 1152, 593],
  uri: reusedModuleUris.qin_rcep,
}));
heroModules.push(reusedModule({
  id: 'song-global-industry',
  x: 3074,
  y: 1640,
  width: 1832,
  height: 944,
  crop: [0, 55, 1152, 593],
  uri: reusedModuleUris.song_global,
}));
heroModules.push('<line x1="3074" y1="2614" x2="4906" y2="2614" stroke="' + C.pale + '" stroke-width="4"/>');
heroModules.push('<text x="3990" y="2674" text-anchor="middle" font-family="' + FONT + '" font-size="24" font-weight="bold" fill="' + C.dark + '">Uneven regional potential meets a large but capacity-dependent global market.</text>');
heroModules.push('</g>');
recomposedSections.push(heroModules.join('\n'));

const diagnosticsBand = [
  '<g id="layout_a_diagnostics" data-panel="reviewed-advanced-figures">',
  embeddedVectorModule({
    id: 'reviewed-trade-mix',
    x: 1204,
    y: 2740,
    width: 1218,
    height: 528,
    block: reviewedFigureBlocks.trade_mix,
  }),
  embeddedVectorModule({
    id: 'reviewed-growth-waterfall',
    x: 2446,
    y: 2740,
    width: 1218,
    height: 528,
    block: reviewedFigureBlocks.growth_waterfall,
  }),
  embeddedVectorModule({
    id: 'reviewed-rcep-opportunity',
    x: 3688,
    y: 2740,
    width: 1218,
    height: 528,
    block: reviewedFigureBlocks.rcep_opportunity,
  }),
  '</g>',
];
recomposedSections.push(diagnosticsBand.join('\n'));

const closingBand = ['<g id="layout_a_closing_band" data-panel="closing-band">'];
closingBand.push('<line x1="1204" y1="3300" x2="4906" y2="3300" stroke="' + C.pale + '" stroke-width="4"/>');
closingBand.push('<text x="1204" y="3342" font-family="' + FONT + '" font-size="23" font-weight="bold" fill="' + C.dark + '">SOURCES &amp; REPRODUCIBILITY</text>');
closingBand.push('<line x1="2450" y1="3360" x2="2450" y2="3492" stroke="' + C.grid + '" stroke-width="2"/>');
closingBand.push('<line x1="3750" y1="3360" x2="3750" y2="3492" stroke="' + C.grid + '" stroke-width="2"/>');
closingBand.push('<text data-reference-item="1" x="1204" y="3382" font-family="' + FONT + '" font-size="14" fill="' + C.ink + '">[1] Ministry of Commerce of the PRC (2025), Digital Trade Development Report.</text>');
closingBand.push('<text data-reference-item="2" x="1204" y="3418" font-family="' + FONT + '" font-size="14" fill="' + C.ink + '">[2] Zhang &amp; Abdullah (2026), Humanities &amp; Social Sciences Communications 13:941.</text>');
closingBand.push('<text data-reference-item="3" x="1204" y="3454" font-family="' + FONT + '" font-size="14" fill="' + C.ink + '">[3] International Post Corporation (2023), Cross-Border E-commerce Shopper Survey.</text>');
closingBand.push(footerPhotoThumbnail({ id: 'footer-team-process-1', x: 2182, y: 3348, width: 250, height: 144, uri: photoUris.team_process_1, focus: 'xMidYMid' }));
closingBand.push('<text data-reference-item="4" x="2500" y="3382" font-family="' + FONT + '" font-size="14" fill="' + C.ink + '">[4] UNCTAD (2024), Business e-commerce sales and the role of online platforms.</text>');
closingBand.push('<text data-reference-item="5" x="2500" y="3418" font-family="' + FONT + '" font-size="14" fill="' + C.ink + '">[5] General Administration of Customs of China (2020–2024), annual CBEC releases.</text>');
closingBand.push('<text data-reference-item="6" x="2500" y="3454" font-family="' + FONT + '" font-size="14" fill="' + C.ink + '">[6] HKTDC (2024), Digital Trade Transformation, p. 8 (IPC trend reproduction).</text>');
closingBand.push('<text data-reference-item="7" x="2500" y="3490" font-family="' + FONT + '" font-size="14" fill="' + C.ink + '">[7] UNCTADstat, E-commerce: domestic and international sales — annual dataset.</text>');
closingBand.push(footerPhotoThumbnail({ id: 'footer-team-process-3', x: 3482, y: 3348, width: 250, height: 144, uri: photoUris.team_process_3, focus: 'xMidYMid' }));
closingBand.push('<text x="3790" y="3382" font-family="' + FONT + '" font-size="17" font-weight="bold" fill="' + C.teal + '">DATA, CODE &amp; FULL SOURCE NOTES</text>');
closingBand.push('<text x="3790" y="3422" font-family="' + FONT + '" font-size="14" fill="' + C.dark + '">' + esc(githubUrl) + '</text>');
closingBand.push('<text x="3790" y="3460" font-family="' + FONT + '" font-size="14" fill="' + C.ink + '">Full URLs, data tables, licences and editable figures.</text>');
closingBand.push('<text x="3790" y="3490" font-family="' + FONT + '" font-size="13" fill="' + C.ink + '">Scan to open the reproducibility archive.</text>');
closingBand.push(footerPhotoThumbnail({ id: 'footer-team-process-5', x: 4448, y: 3348, width: 250, height: 144, uri: photoUris.team_process_5, focus: 'xMidYMid' }));
closingBand.push('<g data-github-qr="repository"><svg x="4705" y="3310" width="225" height="225" viewBox="' + githubQrBlock.viewBox + '" preserveAspectRatio="xMidYMid meet">' + githubQrBlock.body + '</svg></g>');
closingBand.push('</g>');
recomposedSections.push(closingBand.join('\n'));
// Connectors are deliberately rendered last so no module, image or panel can
// cover any part of a numbered arrow or its arrowhead.
recomposedSections.push(connectorLayer.join('\n'));

const masterSvg = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" data-measure-role="poster" role="img" aria-label="The China E-Commerce Effect story-led team poster">`,
  '<defs>',
  `<marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M 1 1 L 7 4 L 1 7" fill="none" stroke="${C.teal}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker>`,
  `<marker id="flowArrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M 1 1 L 7 4 L 1 7" fill="none" stroke="${C.teal}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker>`,
  `<marker id="softArrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M 1 1 L 7 4 L 1 7" fill="none" stroke="${C.teal}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker>`,
  `<marker id="moduleArrowhead" markerWidth="18" markerHeight="18" refX="14" refY="9" orient="auto" markerUnits="userSpaceOnUse" overflow="visible"><path d="M 3 3 L 14 9 L 3 15" fill="none" stroke="${C.blue}" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round"/></marker>`,
  '</defs>',
  `<rect x="0" y="0" width="${W}" height="${H}" fill="${C.white}"/>`,
  recomposedSections.join('\n'),
  '</svg>',
  '',
].join('\n');

const svgOut = path.join(outputDir, `${stem}.svg`);
const htmlOut = path.join(outputDir, `${stem}.html`);
const pdfOut = path.join(outputDir, `${stem}.pdf`);
const previewOut = path.join(outputDir, `${stem}_preview.png`);
const reviewPreviewOut = path.join(outputDir, `${stem}_review_preview.png`);
const grayscaleOut = path.join(outputDir, `${stem}_grayscale_check.png`);
const reviewGrayscaleOut = path.join(outputDir, `${stem}_review_grayscale.png`);
const reportOut = path.join(outputDir, `${stem}.validation.json`);
const manifestOut = path.join(outputDir, `${stem}.manifest.json`);

await fs.writeFile(svgOut, masterSvg, 'utf8');

const html = [
  '<!doctype html><html lang="en"><head><meta charset="utf-8">',
  '<title>The China E-Commerce Effect</title>',
  '<style>',
  `@page { size: ${pageWidthMm}mm ${pageHeightMm}mm; margin: 0; }`,
  `html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: #fff; }`,
  `body > svg { display: block; width: ${W}px; height: ${H}px; }`,
  `@media print { html, body { width: ${pageWidthMm}mm; height: ${pageHeightMm}mm; } body > svg { width: ${pageWidthMm}mm; height: ${pageHeightMm}mm; } }`,
  '</style></head><body>',
  masterSvg,
  '</body></html>',
].join('\n');
await fs.writeFile(htmlOut, html, 'utf8');

const browser = await chromium.launch({
  headless: true,
  ...(browserExecutable ? { executablePath: browserExecutable } : {}),
});
let diagnostics;
try {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(htmlOut).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  diagnostics = await page.evaluate(() => {
    const root = document.querySelector('body > svg');
    const rootRect = root.getBoundingClientRect();
    const textBoxes = [...root.querySelectorAll('text')].map((node) => {
      const box = node.getBoundingClientRect();
      return {
        text: (node.textContent || '').replace(/\s+/g, ' ').trim(),
        x: +(box.left - rootRect.left).toFixed(2),
        y: +(box.top - rootRect.top).toFixed(2),
        width: +box.width.toFixed(2),
        height: +box.height.toFixed(2),
      };
    }).filter((item) => item.text);
    const clipping = textBoxes.filter((item) =>
      item.x < -0.5 || item.y < -0.5 ||
      item.x + item.width > rootRect.width + 0.5 ||
      item.y + item.height > rootRect.height + 0.5
    );
    const factIds = [...root.querySelectorAll('[data-fact-id]')].map((node) => node.getAttribute('data-fact-id'));
    const factCounts = Object.fromEntries([...new Set(factIds)].map((id) => [id, factIds.filter((candidate) => candidate === id).length]));
    const photoIds = [...root.querySelectorAll('[data-photo-id]')].map((node) => node.getAttribute('data-photo-id'));
    const reusedModuleIds = [...root.querySelectorAll('[data-reused-module]')].map((node) => node.getAttribute('data-reused-module'));
    const directPhotoEntries = [...root.querySelectorAll('[data-photo-id], [data-footer-photo]')].map((node) => ({
      id: node.getAttribute('data-photo-id') || node.getAttribute('data-footer-photo'),
      href: node.querySelector('image')?.getAttribute('href') || '',
    }));
    const directPhotoSourceGroups = new Map();
    directPhotoEntries.forEach(({ id, href }) => {
      if (!directPhotoSourceGroups.has(href)) directPhotoSourceGroups.set(href, []);
      directPhotoSourceGroups.get(href).push(id);
    });
    const repeatedDirectPhotoSources = [...directPhotoSourceGroups.values()].filter((ids) => ids.length > 1);
    const imageBlocks = [...root.querySelectorAll('[data-image-block]')].map((node) => {
      const box = node.getBoundingClientRect();
      return {
        id: node.getAttribute('data-image-block'),
        x: +(box.left - rootRect.left).toFixed(2),
        y: +(box.top - rootRect.top).toFixed(2),
        width: +box.width.toFixed(2),
        height: +box.height.toFixed(2),
      };
    });
    const imageBlockOverlaps = [];
    for (let i = 0; i < imageBlocks.length; i += 1) {
      for (let j = i + 1; j < imageBlocks.length; j += 1) {
        const a = imageBlocks[i];
        const b = imageBlocks[j];
        const overlapWidth = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const overlapHeight = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        if (overlapWidth > 0.5 && overlapHeight > 0.5) {
          imageBlockOverlaps.push({ a: a.id, b: b.id, overlapWidth: +overlapWidth.toFixed(2), overlapHeight: +overlapHeight.toFixed(2) });
        }
      }
    }
    const moduleArrows = [...root.querySelectorAll('[data-layout-arrow]')].map((node) => {
      const box = node.getBBox();
      return {
        id: node.getAttribute('data-layout-arrow'),
        x: +box.x.toFixed(2),
        y: +box.y.toFixed(2),
        width: +box.width.toFixed(2),
        height: +box.height.toFixed(2),
        length: +node.getTotalLength().toFixed(2),
        orientation: box.width >= box.height ? 'horizontal' : 'vertical',
        strokeWidth: +Number.parseFloat(getComputedStyle(node).strokeWidth).toFixed(2),
      };
    });
    const connectorCorridors = {
      'journey-to-trade': { axis: 'x', min: 1144, max: 1204 },
      'trade-to-region': { axis: 'x', min: 3022, max: 3074 },
      'region-to-industry': { axis: 'y', min: 1604, max: 1640 },
      'synthesis-to-figures': { axis: 'y', min: 2700, max: 2740 },
    };
    const connectorClearances = moduleArrows.map((arrow) => {
      const corridor = connectorCorridors[arrow.id];
      const start = corridor.axis === 'x' ? arrow.x : arrow.y;
      const end = start + (corridor.axis === 'x' ? arrow.width : arrow.height);
      const padding = 3;
      return {
        id: arrow.id,
        axis: corridor.axis,
        corridorMin: corridor.min,
        corridorMax: corridor.max,
        start,
        end: +end.toFixed(2),
        padding,
        clear: start - padding >= corridor.min && end + padding <= corridor.max,
      };
    });
    const stageBadgeRadii = [...root.querySelectorAll('[data-stage-bridge] > circle')]
      .map((node) => +Number.parseFloat(node.getAttribute('r') || '0').toFixed(2));
    const moduleArrowheadStrokeWidth = +Number.parseFloat(
      getComputedStyle(root.querySelector('#moduleArrowhead path')).strokeWidth
    ).toFixed(2);
    const headerVisuals = [...root.querySelectorAll('#masthead [data-cultural-icon], #masthead [data-school-logo]')]
      .map((node) => {
        const box = node.getBoundingClientRect();
        return {
          id: node.getAttribute('data-cultural-icon') || node.getAttribute('data-school-logo'),
          x: +(box.left - rootRect.left).toFixed(2),
          y: +(box.top - rootRect.top).toFixed(2),
          width: +box.width.toFixed(2),
          height: +box.height.toFixed(2),
          centerY: +(box.top - rootRect.top + box.height / 2).toFixed(2),
        };
      })
      .sort((a, b) => a.x - b.x);
    const headerOuterGaps = [
      headerVisuals[1].x - (headerVisuals[0].x + headerVisuals[0].width),
      headerVisuals[2].x - (headerVisuals[1].x + headerVisuals[1].width),
      headerVisuals[4].x - (headerVisuals[3].x + headerVisuals[3].width),
      headerVisuals[5].x - (headerVisuals[4].x + headerVisuals[4].width),
    ].map((value) => +value.toFixed(2));
    const titleRule = root.querySelector('[data-title-rule="continuous"]');
    const connectorLayerIsTopmost = root.lastElementChild?.id === 'layout_a_connectors';
    return {
      canvas: { width: rootRect.width, height: rootRect.height },
      sectionCount: root.querySelectorAll('[data-section-title]').length,
      sectionIds: [...root.querySelectorAll('[data-section-title]')].map((node) => node.getAttribute('data-section-title')),
      photoCount: photoIds.length,
      uniquePhotoCount: new Set(photoIds).size,
      reusedModuleCount: reusedModuleIds.length,
      reusedModuleIds,
      derivedChartCount: root.querySelectorAll('[data-derived-chart]').length,
      reviewedFigureCount: root.querySelectorAll('[data-reviewed-figure]').length,
      layoutArrowCount: root.querySelectorAll('[data-layout-arrow]').length,
      numberedModuleConnectorCount: root.querySelectorAll('[data-stage-bridge]').length,
      moduleArrows,
      connectorClearances,
      stageBadgeRadii,
      moduleArrowheadStrokeWidth,
      culturalIconCount: root.querySelectorAll('[data-cultural-icon]').length,
      schoolLogoCount: root.querySelectorAll('[data-school-logo]').length,
      headerVisuals,
      headerOuterGaps,
      titleRuleCount: root.querySelectorAll('[data-title-rule="continuous"]').length,
      titleRuleLength: titleRule ? +titleRule.getTotalLength().toFixed(2) : 0,
      connectorLayerIsTopmost,
      githubQrCount: root.querySelectorAll('[data-github-qr]').length,
      referenceCount: root.querySelectorAll('[data-reference-item]').length,
      footerPhotoCount: root.querySelectorAll('[data-footer-photo]').length,
      directPhotoSourceCount: directPhotoEntries.length,
      uniqueDirectPhotoSourceCount: directPhotoSourceGroups.size,
      repeatedDirectPhotoSources,
      imageBlockCount: imageBlocks.length,
      imageBlockOverlaps,
      embeddedImageCount: root.querySelectorAll('image').length,
      pathCount: root.querySelectorAll('path').length,
      placeholderCount: root.querySelectorAll('[data-placeholder]').length,
      factCounts,
      textCount: textBoxes.length,
      clipping,
    };
  });
  await page.screenshot({ path: previewOut, fullPage: true, animations: 'disabled' });
  await page.pdf({
    path: pdfOut,
    width: `${pageWidthMm}mm`,
    height: `${pageHeightMm}mm`,
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    preferCSSPageSize: true,
  });
  const grayscale = await page.addStyleTag({ content: 'body > svg { filter: grayscale(1) !important; }' });
  await page.screenshot({ path: grayscaleOut, fullPage: true, animations: 'disabled' });
  await grayscale.evaluate((node) => node.remove());
  const reviewPage = await browser.newPage({ viewport: { width: 1984, height: 1440 }, deviceScaleFactor: 1 });
  await reviewPage.goto(pathToFileURL(htmlOut).href, { waitUntil: 'load' });
  await reviewPage.evaluate(() => document.fonts.ready);
  await reviewPage.addStyleTag({
    content: 'html, body { width: 1984px !important; height: 1440px !important; overflow: hidden !important; } body > svg { width: 1984px !important; height: 1440px !important; }',
  });
  await reviewPage.screenshot({ path: reviewPreviewOut, fullPage: true, animations: 'disabled' });
  const reviewGrayStyle = await reviewPage.addStyleTag({ content: 'body > svg { filter: grayscale(1) !important; }' });
  await reviewPage.screenshot({ path: reviewGrayscaleOut, fullPage: true, animations: 'disabled' });
  await reviewGrayStyle.evaluate((node) => node.remove());
  await reviewPage.close();
} finally {
  await browser.close();
}

const externalReferences = [...masterSvg.matchAll(/\b(?:href|xlink:href)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((value) => !value.startsWith('#') && !value.startsWith('data:'));
const cjkMatches = masterSvg.match(/[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/g) || [];
const metricAuditSpec = [
  { id: 'trade-final-total', module: 'tao_market', needle: '2.71' },
  { id: 'trade-export-share', module: 'tao_market', needle: '79.5%' },
  { id: 'rcep-panel-scope', module: 'qin_rcep', needle: '110 country-year observations across 11 partners.' },
  { id: 'consumer-start', module: 'wang_consumer', needle: '26%' },
  { id: 'consumer-end', module: 'wang_consumer', needle: '37%' },
  { id: 'consumer-change', module: 'wang_consumer', needle: '+11 pp' },
  { id: 'global-scope', module: 'song_global', needle: '43 economies cover about three quarters of global GDP and exports' },
  { id: 'global-sales-start', module: 'song_global', needle: 'ALMOST US$25T' },
  { id: 'global-sales-end', module: 'song_global', needle: 'US$27T' },
  { id: 'global-sales-change', module: 'song_global', needle: '+10%' },
  { id: 'global-retail-share', module: 'song_global', needle: '25-30%' },
  { id: 'global-platform-growth', module: 'song_global', needle: '+55%' },
];
const metricAudit = metricAuditSpec.map((item) => ({
  ...item,
  count: reusedModuleRaw[item.module].split(item.needle).length - 1,
}));

const report = {
  generatedAt: new Date().toISOString(),
  output: {
    svg: path.basename(svgOut),
    pdf: path.basename(pdfOut),
    preview: path.basename(previewOut),
    reviewPreview: path.basename(reviewPreviewOut),
    grayscale: path.basename(grayscaleOut),
    reviewGrayscale: path.basename(reviewGrayscaleOut),
    manifest: path.basename(manifestOut),
    viewBox: `0 0 ${W} ${H}`,
    printPageMm: { width: pageWidthMm, height: pageHeightMm },
  },
  checks: {
    exactCanvas: diagnostics.canvas.width === W && diagnostics.canvas.height === H,
    widthLockedAt4960: diagnostics.canvas.width === 4960,
    layoutAFourStageReadingPath: diagnostics.sectionCount === 4,
    fourNumberedModuleConnectors: diagnostics.layoutArrowCount === 4 && diagnostics.numberedModuleConnectorCount === 4,
    fourUniformThirtyUnitModuleArrows: diagnostics.moduleArrows.length === 4 && diagnostics.moduleArrows.every((arrow) => arrow.length === 30),
    consistentModuleArrowGeometry: new Set(diagnostics.moduleArrows.map((arrow) => arrow.strokeWidth)).size === 1 && diagnostics.moduleArrows.filter((arrow) => arrow.orientation === 'horizontal').length === 2 && diagnostics.moduleArrows.filter((arrow) => arrow.orientation === 'vertical').length === 2,
    arrowheadNearlyMatchesBodyWidth: diagnostics.moduleArrows.every((arrow) => arrow.strokeWidth > diagnostics.moduleArrowheadStrokeWidth && arrow.strokeWidth - diagnostics.moduleArrowheadStrokeWidth <= 1),
    connectorLayerAbovePosterContent: diagnostics.connectorLayerIsTopmost,
    allModuleArrowsInsideClearCorridors: diagnostics.connectorClearances.length === 4 && diagnostics.connectorClearances.every((item) => item.clear),
    uniformStageBadgeSize: diagnostics.stageBadgeRadii.length === 4 && new Set(diagnostics.stageBadgeRadii).size === 1 && diagnostics.stageBadgeRadii[0] === 13,
    fourCompletedTeamModulesReused: diagnostics.reusedModuleCount === 4,
    threeDerivedChartsFromArchivedData: diagnostics.derivedChartCount === 3,
    threeReviewedAdvancedFiguresIntegrated: diagnostics.reviewedFigureCount === 3,
    eightDistinctRealStoryPhotos: diagnostics.photoCount === 8 && diagnostics.uniquePhotoCount === 8,
    approximatelyFifteenVisibleRealPhotos: diagnostics.photoCount + diagnostics.footerPhotoCount + 4 === 15,
    noRepeatedDirectPhotoSources: diagnostics.directPhotoSourceCount === diagnostics.uniqueDirectPhotoSourceCount && diagnostics.repeatedDirectPhotoSources.length === 0,
    noRepeatedVisiblePhotoFiles: repeatedVisiblePhotoFiles.length === 0,
    noDirectPhotoRepeatedInsideReusedModules: directPhotoVsModuleMatches.length === 0 && directPhotoVsModuleOriginMatches.length === 0,
    noRepeatedImagesInsideReusedModules: repeatedReusedModuleImageFiles.length === 0 && repeatedReusedModuleOriginPhotoFiles.length === 0,
    noImageBlockOverlap: diagnostics.imageBlockOverlaps.length === 0,
    fourCulturalHeaderIcons: diagnostics.culturalIconCount === 4,
    twoVectorSchoolLogos: diagnostics.schoolLogoCount === 2,
    alignedEvenlySpacedHeaderVisuals: diagnostics.headerVisuals.length === 6 && Math.max(...diagnostics.headerVisuals.map((item) => item.centerY)) - Math.min(...diagnostics.headerVisuals.map((item) => item.centerY)) <= 2 && Math.max(...diagnostics.headerVisuals.map((item) => item.height)) - Math.min(...diagnostics.headerVisuals.map((item) => item.height)) <= 3 && Math.max(...diagnostics.headerOuterGaps) - Math.min(...diagnostics.headerOuterGaps) <= 2,
    mastheadVisualRowRaised: diagnostics.headerVisuals.length === 6 && Math.max(...diagnostics.headerVisuals.map((item) => item.centerY)) <= 275,
    continuousTitleRule: diagnostics.titleRuleCount === 1 && diagnostics.titleRuleLength === 1540,
    sourceModuleMetricsIntact: metricAudit.every((item) => item.count === 1),
    noDuplicateOuterMetricCards: Object.keys(diagnostics.factCounts).length === 0,
    githubQrEmbedded: diagnostics.githubQrCount === 1,
    expandedReferenceList: diagnostics.referenceCount === 7,
    threeFooterPhotoThumbnails: diagnostics.footerPhotoCount === 3,
    noPlaceholders: diagnostics.placeholderCount === 0,
    noExternalSvgDependencies: externalReferences.length === 0,
    noTextClipping: diagnostics.clipping.length === 0,
    englishOnlySvgText: cjkMatches.length === 0,
    grayscaleArtifactGenerated: true,
  },
  diagnostics: {
    ...diagnostics,
    externalReferences,
    metricAudit,
    visiblePhotoHashEntries,
    repeatedVisiblePhotoFiles,
    reusedModuleEmbeddedImageCount: reusedModuleEmbeddedImageHashes.length,
    directPhotoVsModuleMatches,
    repeatedReusedModuleImageFiles,
    reusedModulePhotoOriginHashEntries,
    directPhotoVsModuleOriginMatches,
    repeatedReusedModuleOriginPhotoFiles,
  },
};

const manifest = {
  generatedAt: report.generatedAt,
  posterIdentity: {
    title: 'THE CHINA E-COMMERCE EFFECT',
    subtitle: 'FROM ONLINE DEMAND TO REGIONAL AND INDUSTRY EFFECTS',
    teamName: 'SILKLINK FOUR',
    authors: ['Tian Qin', 'Jiacheng Tao', 'Yikai Wang', 'Peitong Song'],
  },
  layoutVariant: 'A · Serpentine Evidence Flow',
  canvas: {
    width: W,
    height: H,
    physicalSizeMm: { width: pageWidthMm, height: pageHeightMm },
    widthDecision: '4960-unit width preserved; height is content-driven',
  },
  narrative: [
    'Question & Method',
    'Trade Scale',
    'Regional & Global Effects',
    'Synthesis',
  ],
  connectorPolicy: 'Four numbered slate-blue module connectors use the same 30-unit length, 6-unit body stroke, 5.2-unit arrowhead stroke and 13-unit stage badge; only position and direction vary. The connector layer is rendered above all poster content so no arrowhead can be covered. Small photo-sequence chevrons float centrally in the gutters and do not touch image edges.',
  mastheadPolicy: 'Six vector header visuals share a common raised optical centreline and visual height, with approximately 100-unit intra-cluster gaps; the title rule is one continuous 1540-unit line.',
  dataPolicy: 'The four completed team modules remain intact. Three separately reviewed summary figures are calculated directly from archived CSVs; intentional headline repetition in the compact 2024 summary is used to support synthesis, not to create unsupported claims.',
  photoPolicy: 'Every directly placed body and footer photograph has a unique source image. Footer thumbnails use three distinct team process photographs; known image duplicates with the reused industry module were replaced.',
  culturalIdentity: ['Wuhan · Yellow Crane Tower', 'Wuhan · hot dry noodles', 'Manchester · industrial mill', 'Manchester · worker bee'],
  reusedModules: Object.entries(reusedModulePaths).map(([id, source]) => ({ id, source: path.relative(weekDir, source).replaceAll('\\', '/') })),
  metricAudit,
  derivedCharts: [
    { id: 'reviewed-trade-mix', source: path.relative(weekDir, tradeCsvPath).replaceAll('\\', '/'), transform: '2024 export/import mix and verified headline statistics' },
    { id: 'reviewed-growth-waterfall', source: path.relative(weekDir, tradeCsvPath).replaceAll('\\', '/'), transform: '2018–2024 total change decomposed into export and import contributions' },
    { id: 'reviewed-rcep-opportunity', source: path.relative(weekDir, rcepCsvPath).replaceAll('\\', '/'), transform: '2022 level plotted against change since 2013, grouped by documented evidence category' },
  ],
  photos: [
    { id: 'online-payment-story-a', source: path.relative(weekDir, photoPaths.online_payment).replaceAll('\\', '/') },
    { id: 'warehouse-team-story-a', source: path.relative(weekDir, photoPaths.warehouse_team).replaceAll('\\', '/') },
    { id: 'last-mile-step-story-a', source: path.relative(weekDir, photoPaths.delivery_step_new).replaceAll('\\', '/') },
    { id: 'warehouse-worker-story-a', source: path.relative(weekDir, photoPaths.warehouse_worker).replaceAll('\\', '/') },
    { id: 'checkout-story-a', source: path.relative(weekDir, photoPaths.checkout).replaceAll('\\', '/') },
    { id: 'parcel-sorting-story-a', source: path.relative(weekDir, photoPaths.parcel_sorting).replaceAll('\\', '/') },
    { id: 'warehouse-scale-story-a', source: path.relative(weekDir, photoPaths.warehouse_packages_new).replaceAll('\\', '/') },
    { id: 'last-mile-context-story-a', source: path.relative(weekDir, photoPaths.last_mile_courier_new).replaceAll('\\', '/') },
  ],
  footerPhotos: [
    { id: 'footer-team-process-1', source: path.relative(weekDir, photoPaths.team_process_1).replaceAll('\\', '/') },
    { id: 'footer-team-process-3', source: path.relative(weekDir, photoPaths.team_process_3).replaceAll('\\', '/') },
    { id: 'footer-team-process-5', source: path.relative(weekDir, photoPaths.team_process_5).replaceAll('\\', '/') },
  ],
  externalPhotoProvenance: [
    { sourcePage: 'https://www.pexels.com/photo/male-employee-through-a-shelf-6170414/', localFile: path.relative(weekDir, photoPaths.warehouse_packages_new).replaceAll('\\', '/'), creator: 'Tima Miroshnichenko', licence: 'Pexels free to use' },
    { sourcePage: 'https://www.pexels.com/photo/delivery-man-going-out-from-a-van-6169135/', localFile: path.relative(weekDir, photoPaths.last_mile_courier_new).replaceAll('\\', '/'), creator: 'Tima Miroshnichenko', licence: 'Pexels free to use' },
    { sourcePage: 'https://www.pexels.com/photo/a-man-making-a-delivery-6868178/', localFile: path.relative(weekDir, photoPaths.delivery_step_new).replaceAll('\\', '/'), creator: 'Kindel Media', licence: 'Pexels free to use' },
  ],
  visibleRealPhotoEstimate: 15,
  sources: [
    path.relative(weekDir, tradeCsvPath).replaceAll('\\', '/'),
    path.relative(weekDir, rcepCsvPath).replaceAll('\\', '/'),
    path.relative(weekDir, consumerCsvPath).replaceAll('\\', '/'),
  ],
  references: [
    'Ministry of Commerce of the PRC (2025), Report on China’s Development of Digital Trade 2025.',
    'Zhang & Abdullah (2026), Humanities and Social Sciences Communications 13:941.',
    'International Post Corporation (2023), Cross-Border E-commerce Shopper Survey.',
    'UNCTAD (2024), Business e-commerce sales and the role of online platforms.',
    'General Administration of Customs of China (2020–2024), annual cross-border e-commerce releases.',
    'HKTDC (2024), Digital Trade Transformation, p. 8.',
    'UNCTADstat, E-commerce: Domestic and international sales — annual dataset.',
  ],
  github: {
    url: githubUrl,
    qr: path.relative(weekDir, githubQrPath).replaceAll('\\', '/'),
  },
};

await fs.writeFile(reportOut, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
await fs.writeFile(manifestOut, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
