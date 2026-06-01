import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

const root = join(process.cwd(), "apps/web/src/assets/generated");

const palette = {
  canvas: "#0B0D11",
  text: "#F5F4ED",
  muted: "#7D7B6F",
  line: "#2A2D35",
  gold: "#F5C524",
  green: "#28C76F",
  red: "#E84B2A",
  purple: "#7B5BD7",
  cyan: "#5BD7E0",
  white: "#F5F4ED",
  pink: "#FF6BAA",
  orange: "#F28A2E",
  silver: "#9AA4B2",
  brown: "#8B5A3C",
};

const made = [];
const skipped = [];
const failedPng = [];

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function writeNew(path, content) {
  ensureDir(dirname(path));
  if (existsSync(path)) {
    skipped.push(path);
    return false;
  }
  writeFileSync(path, content);
  made.push(path);
  return true;
}

function defs() {
  return `
    <defs>
      <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000000" flood-opacity=".35"/>
      </filter>
      <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#FFE06A"/>
        <stop offset="1" stop-color="${palette.gold}"/>
      </linearGradient>
      <linearGradient id="purpleGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#9A82F0"/>
        <stop offset="1" stop-color="${palette.purple}"/>
      </linearGradient>
      <linearGradient id="cyanGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#8BF1F7"/>
        <stop offset="1" stop-color="${palette.cyan}"/>
      </linearGradient>
    </defs>`;
}

function svg(width, height, body, options = {}) {
  const bg = options.bg === false ? "" : `<rect width="${width}" height="${height}" rx="${options.radius ?? 28}" fill="${options.bg ?? palette.canvas}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  ${defs()}
  ${bg}
  ${body}
</svg>
`;
}

function text(x, y, value, size = 20, color = palette.text, weight = 800, anchor = "middle") {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Inter, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${value}</text>`;
}

function coin(cx, cy, r = 18) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#goldGrad)" stroke="#9F7510" stroke-width="3"/>${text(cx, cy + r * 0.35, "$", r * 1.15, "#4A3506", 900)}`;
}

function phone(x, y, w, h, content) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w * 0.14}" fill="#171B24" stroke="#303745" stroke-width="5" filter="url(#softShadow)"/>
  <rect x="${x + w * 0.09}" y="${y + h * 0.1}" width="${w * 0.82}" height="${h * 0.8}" rx="${w * 0.08}" fill="#0F1218"/>
  ${content}`;
}

function avatar(cx, cy, skin = "#DDA776", hair = "#302018", shirt = palette.purple, accessory = "") {
  return `<circle cx="${cx}" cy="${cy - 34}" r="36" fill="${skin}" stroke="#221A16" stroke-width="4"/>
  <path d="M${cx - 34} ${cy - 42}c12-34 58-31 70-3-16-11-47-15-70 3Z" fill="${hair}"/>
  <circle cx="${cx - 12}" cy="${cy - 34}" r="4" fill="#1B1412"/>
  <circle cx="${cx + 12}" cy="${cy - 34}" r="4" fill="#1B1412"/>
  <path d="M${cx - 13} ${cy - 17}q13 12 27 0" stroke="#6B3426" stroke-width="4" stroke-linecap="round"/>
  <path d="M${cx - 56} ${cy + 60}c10-55 102-55 112 0Z" fill="${shirt}" stroke="#242833" stroke-width="4"/>
  ${accessory}`;
}

function iconShell(body, size = 128) {
  return svg(size, size, body, { bg: false });
}

function saveSvgAsset(dir, name, width, height, body, options = {}) {
  writeNew(join(root, dir, `${name}.svg`), svg(width, height, body, options));
}

function savePngAsset(dir, name, width, height, body, options = {}) {
  const outDir = join(root, dir);
  const svgPath = join(outDir, `${name}.svg`);
  const pngPath = join(outDir, `${name}.png`);
  const wroteSvg = writeNew(svgPath, svg(width, height, body, options));
  if (!existsSync(pngPath)) {
    const result = spawnSync("sips", ["-s", "format", "png", svgPath, "--out", pngPath], { encoding: "utf8" });
    if (result.status === 0) {
      made.push(pngPath);
    } else {
      failedPng.push(pngPath);
      if (!wroteSvg) skipped.push(pngPath);
    }
  } else {
    skipped.push(pngPath);
  }
}

function onboarding() {
  savePngAsset("onboarding", "welcome", 512, 512, `
    <circle cx="270" cy="238" r="142" fill="#151923"/>
    ${phone(286, 120, 126, 218, `<polyline points="315,278 338,238 361,260 386,194" stroke="${palette.green}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>${coin(346, 306, 18)}`)}
    ${avatar(180, 292, "#DDA776", "#2B2031", palette.purple, `<path d="M123 240q-52-50 13-78" stroke="${palette.gold}" stroke-width="22" stroke-linecap="round"/><circle cx="113" cy="155" r="18" fill="${palette.gold}"/>`)}
  `);
  savePngAsset("onboarding", "swipe-demo", 512, 512, `
    ${phone(176, 70, 160, 292, `<rect x="205" y="139" width="102" height="142" rx="22" fill="#202532" stroke="${palette.gold}" stroke-width="5"/>${text(256, 226, "$", 58, palette.gold, 900)}`)}
    <path d="M256 418V286" stroke="${palette.green}" stroke-width="16" stroke-linecap="round"/>
    <path d="M212 326l44-48 44 48" stroke="${palette.green}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M168 383c43 19 91 22 144 4" stroke="${palette.cyan}" stroke-width="8" stroke-linecap="round" opacity=".55"/>
  `);
  savePngAsset("onboarding", "dashboard-demo", 512, 512, `
    ${phone(142, 62, 228, 350, `
      <rect x="176" y="126" width="160" height="52" rx="16" fill="#1C212B"/>
      <circle cx="214" cy="258" r="45" fill="${palette.gold}"/><path d="M214 258L214 213A45 45 0 0 1 257 271Z" fill="${palette.green}"/>
      <rect x="282" y="232" width="22" height="70" rx="8" fill="${palette.green}"/><rect x="312" y="196" width="22" height="106" rx="8" fill="${palette.cyan}"/>
      ${text(256, 161, "$12.4K", 30, palette.text, 900)}
    `)}
    ${coin(382, 112, 25)}${coin(123, 393, 20)}
  `);
  savePngAsset("onboarding", "trading-demo", 512, 512, `
    ${avatar(168, 306, "#DFA66F", "#2F2117", palette.green)}
    ${avatar(344, 306, "#B98158", "#211B18", palette.purple)}
    <rect x="210" y="202" width="92" height="116" rx="14" fill="${palette.text}" stroke="${palette.gold}" stroke-width="5"/>
    <path d="M229 238h54M229 264h42M229 290h30" stroke="#333847" stroke-width="7" stroke-linecap="round"/>
    <path d="M209 315c35-36 58-36 94 0" stroke="${palette.gold}" stroke-width="18" stroke-linecap="round"/>
    ${coin(114, 130, 20)}${coin(395, 156, 18)}
  `);
  savePngAsset("onboarding", "ready", 512, 512, `
    <path d="M256 65c55 51 76 114 61 192l-61 61-61-61c-15-78 6-141 61-192Z" fill="url(#cyanGrad)" stroke="#1B6D73" stroke-width="6"/>
    <circle cx="256" cy="168" r="31" fill="#0F1218" stroke="${palette.text}" stroke-width="6"/>
    <path d="M218 316l-48 72 70-31M294 316l48 72-70-31" fill="${palette.purple}" stroke="#33245E" stroke-width="5"/>
    <path d="M256 344c-23 40-24 73 0 101 24-28 23-61 0-101Z" fill="${palette.gold}"/>
    ${coin(127, 143, 17)}${coin(394, 101, 16)}${coin(400, 367, 19)}
  `);
}

function dashboardIcons() {
  const icons = {
    "icon-cash": `${coin(54, 75, 24)}${coin(72, 63, 24)}${coin(87, 78, 24)}`,
    "icon-income": `<path d="M28 86l33-38 20 21 23-33" stroke="${palette.green}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/><path d="M81 36h23v23" stroke="${palette.green}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>${text(40, 108, "$", 32, palette.green)}`,
    "icon-expenses": `<path d="M28 42l33 38 20-21 23 33" stroke="${palette.red}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/><path d="M81 92h23V69" stroke="${palette.red}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>${text(40, 35, "$", 32, palette.red)}`,
    "icon-assets": `<path d="M24 105h80V50L64 23 24 50Z" fill="${palette.gold}" stroke="#8B670E" stroke-width="7"/><path d="M45 105V76h38v29M43 55h12M73 55h12" stroke="#4B3708" stroke-width="7" stroke-linecap="round"/>`,
    "icon-debt": `<path d="M48 80l-11 11a23 23 0 0 1-32-32l16-16a23 23 0 0 1 32 0" stroke="${palette.red}" stroke-width="12" stroke-linecap="round"/><path d="M80 48l11-11a23 23 0 0 1 32 32l-16 16a23 23 0 0 1-32 0" stroke="${palette.red}" stroke-width="12" stroke-linecap="round"/>${text(64, 76, "$", 29, palette.red)}`,
    "icon-business": `<rect x="22" y="42" width="84" height="58" rx="12" fill="${palette.purple}" stroke="#3B2A69" stroke-width="7"/><path d="M48 42V29h32v13M40 80l14-13 13 8 22-24" stroke="${palette.text}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
    "icon-crypto": `<circle cx="64" cy="64" r="42" fill="${palette.cyan}" stroke="#216A70" stroke-width="7"/>${text(64, 78, "B", 43, "#073236")}<path d="M37 34l-12-12M91 34l12-12M37 94l-12 12M91 94l12 12" stroke="${palette.cyan}" stroke-width="6" stroke-linecap="round"/>`,
    "icon-stocks": `<path d="M22 91h84" stroke="${palette.line}" stroke-width="7"/><path d="M31 82l19-21 20 12 30-36" stroke="${palette.green}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><circle cx="50" cy="61" r="7" fill="${palette.green}"/><circle cx="100" cy="37" r="7" fill="${palette.green}"/>`,
    "icon-savings": `<ellipse cx="64" cy="69" rx="45" ry="32" fill="${palette.gold}" stroke="#8B670E" stroke-width="7"/><circle cx="96" cy="60" r="5" fill="#4B3708"/><path d="M43 38c7-16 29-16 36 0M60 49h26" stroke="#4B3708" stroke-width="7" stroke-linecap="round"/>`,
    "icon-insurance": `<path d="M64 18l39 16v31c0 26-15 45-39 54-24-9-39-28-39-54V34Z" fill="${palette.green}" stroke="#136A3B" stroke-width="7"/><path d="M43 66l15 16 31-35" stroke="${palette.text}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`,
    "icon-stress": `<path d="M45 101c-19-8-27-28-17-45-9-25 21-44 40-27 22-9 45 11 36 35 15 16 4 38-17 42" stroke="${palette.red}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M70 34L53 65h20L59 99" fill="none" stroke="${palette.gold}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`,
    "icon-trust": `<path d="M64 19l13 28 31 4-23 22 6 31-27-15-27 15 6-31-23-22 31-4Z" fill="${palette.gold}" stroke="#8B670E" stroke-width="7" stroke-linejoin="round"/>`,
  };
  for (const [name, body] of Object.entries(icons)) {
    writeNew(join(root, "dashboard", `${name}.svg`), iconShell(body));
  }
}

function market() {
  const items = [
    ["asset-office", palette.gold, "OFFICE", `<rect x="61" y="70" width="134" height="116" rx="12" fill="#242A35" stroke="${palette.gold}" stroke-width="5"/><g fill="${palette.gold}"><rect x="82" y="91" width="20" height="18" rx="4"/><rect x="118" y="91" width="20" height="18" rx="4"/><rect x="154" y="91" width="20" height="18" rx="4"/><rect x="82" y="128" width="20" height="18" rx="4"/><rect x="118" y="128" width="20" height="18" rx="4"/><rect x="154" y="128" width="20" height="18" rx="4"/></g>`],
    ["asset-coffee", palette.brown, "COFFEE", `<rect x="54" y="91" width="148" height="87" rx="12" fill="#31231C" stroke="${palette.gold}" stroke-width="5"/><path d="M57 91h142l-17-30H75Z" fill="${palette.brown}"/><circle cx="128" cy="132" r="25" fill="${palette.gold}"/><path d="M116 135h18c16 0 18-20 2-20" stroke="#4A2B1F" stroke-width="7" fill="none"/>`],
    ["asset-logistics", palette.cyan, "LOGISTICS", `<rect x="47" y="119" width="109" height="45" rx="9" fill="${palette.cyan}"/><rect x="156" y="133" width="45" height="31" rx="8" fill="#1E7A80"/><circle cx="78" cy="174" r="14" fill="#11151D" stroke="${palette.text}" stroke-width="5"/><circle cx="170" cy="174" r="14" fill="#11151D" stroke="${palette.text}" stroke-width="5"/><path d="M37 102h63M28 130h48" stroke="${palette.cyan}" stroke-width="7" stroke-linecap="round"/>`],
    ["asset-storage", palette.silver, "STORAGE", `<g stroke="${palette.silver}" stroke-width="5"><rect x="40" y="82" width="54" height="95" rx="8" fill="#26303D"/><rect x="101" y="82" width="54" height="95" rx="8" fill="#26303D"/><rect x="162" y="82" width="54" height="95" rx="8" fill="#26303D"/></g><path d="M48 112h38M109 112h38M170 112h38" stroke="${palette.gold}" stroke-width="5"/>`],
    ["asset-ai-startup", palette.purple, "AI STARTUP", `<rect x="64" y="129" width="128" height="67" rx="9" fill="#222733" stroke="${palette.cyan}" stroke-width="5"/><path d="M96 128l16-50h58l-14 50" fill="#181D27" stroke="${palette.purple}" stroke-width="5"/><circle cx="140" cy="103" r="25" fill="${palette.purple}"/><path d="M124 103h32M140 87v32" stroke="${palette.cyan}" stroke-width="6"/>`],
    ["asset-nft", palette.purple, "NFT", `<rect x="74" y="58" width="108" height="132" rx="16" fill="#202531" stroke="${palette.gold}" stroke-width="6"/><rect x="93" y="79" width="70" height="70" rx="10" fill="${palette.purple}"/><circle cx="116" cy="114" r="11" fill="${palette.gold}"/><path d="M102 144l27-31 31 31" fill="${palette.cyan}"/>`],
    ["asset-laundromat", palette.cyan, "LAUNDRY", `<rect x="41" y="67" width="174" height="130" rx="18" fill="#202631" stroke="${palette.cyan}" stroke-width="5"/><circle cx="86" cy="130" r="30" fill="#F4F6FA" stroke="${palette.cyan}" stroke-width="7"/><circle cx="128" cy="130" r="30" fill="#F4F6FA" stroke="${palette.cyan}" stroke-width="7"/><circle cx="170" cy="130" r="30" fill="#F4F6FA" stroke="${palette.cyan}" stroke-width="7"/>`],
    ["asset-crypto-mining", palette.cyan, "MINING", `<rect x="64" y="52" width="128" height="150" rx="14" fill="#1E2430" stroke="${palette.cyan}" stroke-width="5"/><circle cx="104" cy="94" r="23" fill="#11151D" stroke="${palette.cyan}" stroke-width="5"/><circle cx="152" cy="94" r="23" fill="#11151D" stroke="${palette.cyan}" stroke-width="5"/><path d="M84 145h88M84 168h88" stroke="${palette.gold}" stroke-width="8" stroke-linecap="round"/>`],
  ];
  for (const [name, color, label, art] of items) {
    savePngAsset("market", name, 256, 256, `${art}`);
  }
}

function labor() {
  const workers = [
    ["worker-welder", "WELDER", palette.orange, `<path d="M91 70h74v43H91Z" fill="#394150" stroke="${palette.gold}" stroke-width="5"/><path d="M160 75l25-18" stroke="${palette.orange}" stroke-width="8" stroke-linecap="round"/>`],
    ["worker-coder", "CODER", palette.purple, `<rect x="79" y="161" width="98" height="45" rx="8" fill="#151923" stroke="${palette.cyan}" stroke-width="5"/><path d="M86 92c0-31 84-31 84 0" stroke="${palette.cyan}" stroke-width="10" stroke-linecap="round"/>`],
    ["worker-chef", "CHEF", palette.gold, `<path d="M87 72c-8-28 30-39 41-17 14-21 52-8 41 17Z" fill="${palette.text}" stroke="#ADB3BE" stroke-width="4"/><path d="M177 153l30 35" stroke="${palette.gold}" stroke-width="8" stroke-linecap="round"/>`],
    ["worker-lawyer", "LAWYER", palette.purple, `<rect x="159" y="115" width="45" height="58" rx="6" fill="${palette.text}" stroke="${palette.gold}" stroke-width="4"/><path d="M99 113h58" stroke="#14161C" stroke-width="5"/>`],
    ["worker-accountant", "ACCOUNTANT", palette.green, `<rect x="158" y="118" width="48" height="62" rx="8" fill="#151923" stroke="${palette.green}" stroke-width="5"/><path d="M169 137h25M169 153h25M169 169h25" stroke="${palette.gold}" stroke-width="4"/>`],
    ["worker-marketer", "MARKETER", palette.pink, `<path d="M168 118l36-18v62l-36-18Z" fill="${palette.pink}" stroke="#77274E" stroke-width="5"/><path d="M80 68l-19-18M190 63l19-19" stroke="${palette.cyan}" stroke-width="6" stroke-linecap="round"/>`],
    ["worker-designer", "DESIGNER", palette.cyan, `<rect x="158" y="121" width="52" height="52" rx="10" fill="#151923" stroke="${palette.cyan}" stroke-width="5"/><path d="M174 156l34-43" stroke="${palette.gold}" stroke-width="7" stroke-linecap="round"/>`],
    ["worker-mechanic", "MECHANIC", palette.orange, `<path d="M177 114l27-27M195 96l13-13" stroke="${palette.silver}" stroke-width="9" stroke-linecap="round"/><path d="M101 181h54" stroke="${palette.orange}" stroke-width="7"/>`],
    ["worker-creator", "CREATOR", palette.red, `<rect x="158" y="116" width="56" height="42" rx="9" fill="${palette.red}"/><circle cx="186" cy="137" r="12" fill="${palette.text}"/><path d="M73 67h28" stroke="${palette.gold}" stroke-width="7"/>`],
    ["worker-sales", "SALES", palette.green, `<path d="M166 135c27-24 43-23 61-3" stroke="${palette.green}" stroke-width="12" stroke-linecap="round"/><path d="M80 63l22-11 25 18 31-38" stroke="${palette.green}" stroke-width="6" fill="none"/>`],
    ["worker-analyst", "ANALYST", palette.cyan, `<rect x="156" y="94" width="61" height="45" rx="8" fill="#151923" stroke="${palette.cyan}" stroke-width="5"/><path d="M166 126l15-15 12 8 16-20" stroke="${palette.green}" stroke-width="5" fill="none"/>`],
    ["worker-assistant", "ASSISTANT", palette.gold, `<rect x="159" y="108" width="48" height="68" rx="8" fill="${palette.text}" stroke="${palette.gold}" stroke-width="5"/><path d="M171 132h24M171 150h18" stroke="#333847" stroke-width="5" stroke-linecap="round"/>`],
  ];
  for (const [name, label, color, prop] of workers) {
    savePngAsset("labor", name, 256, 256, `${avatar(116, 139, "#DDA776", "#2B2018", color)}${prop}`);
  }
}

function pets() {
  const items = [
    ["pet-dog", "DOG", palette.gold, `<ellipse cx="128" cy="146" rx="57" ry="45" fill="#D9A447"/><circle cx="128" cy="95" r="42" fill="#E3B55E"/><path d="M92 93l-24 21M164 93l24 21" stroke="#8C5E22" stroke-width="20" stroke-linecap="round"/>`],
    ["pet-cat", "CAT", palette.orange, `<circle cx="128" cy="106" r="43" fill="${palette.orange}"/><path d="M94 82l9-36 27 27 27-27 9 36" fill="${palette.orange}"/><ellipse cx="128" cy="156" rx="49" ry="42" fill="#D9712A"/>`],
    ["pet-gecko", "GECKO", palette.green, `<path d="M67 143c49-86 108-71 118-6 5 35-54 47-82 20" stroke="${palette.green}" stroke-width="29" stroke-linecap="round" fill="none"/><circle cx="157" cy="93" r="30" fill="${palette.green}"/><circle cx="167" cy="85" r="7" fill="#11151D"/>`],
    ["pet-fish", "FISH", palette.cyan, `<circle cx="128" cy="132" r="67" fill="#162634" stroke="${palette.cyan}" stroke-width="6"/><ellipse cx="125" cy="132" rx="49" ry="29" fill="${palette.orange}"/><path d="M168 132l34-28v56Z" fill="${palette.cyan}"/><circle cx="104" cy="124" r="5" fill="#11151D"/>`],
    ["pet-parrot", "PARROT", palette.red, `<path d="M118 66c52 4 72 45 48 93-25 35-75 18-76-28-17-11-14-50 28-65Z" fill="${palette.red}"/><path d="M139 121l55 28-64 14" fill="${palette.cyan}"/><path d="M90 190h76" stroke="${palette.gold}" stroke-width="8"/>`],
    ["pet-hamster", "HAMSTER", palette.gold, `<ellipse cx="128" cy="137" rx="58" ry="53" fill="#C89252"/><circle cx="95" cy="91" r="21" fill="#C89252"/><circle cx="161" cy="91" r="21" fill="#C89252"/><circle cx="112" cy="133" r="8" fill="#11151D"/><circle cx="144" cy="133" r="8" fill="#11151D"/>`],
    ["pet-turtle", "TURTLE", palette.green, `<ellipse cx="128" cy="143" rx="62" ry="45" fill="${palette.green}" stroke="#145D38" stroke-width="6"/><path d="M91 143c18-37 56-37 74 0-20 20-54 20-74 0Z" fill="#6DDC8D"/><circle cx="196" cy="137" r="20" fill="${palette.green}"/>`],
    ["pet-rabbit", "RABBIT", palette.pink, `<ellipse cx="128" cy="147" rx="51" ry="45" fill="${palette.text}"/><path d="M101 89L88 31M151 89l15-58" stroke="${palette.text}" stroke-width="23" stroke-linecap="round"/><circle cx="113" cy="135" r="6" fill="#11151D"/><circle cx="143" cy="135" r="6" fill="#11151D"/>`],
  ];
  for (const [name, label, color, art] of items) {
    savePngAsset("pets", name, 256, 256, `${art}`);
  }
}

function clothingAndAccessories() {
  const outfits = [
    ["outfit-hustler", "HUSTLER", palette.purple, `<path d="M78 52h100l28 145H50Z" fill="${palette.purple}" stroke="#2E2559" stroke-width="6"/><path d="M103 55l25 48 25-48" fill="${palette.text}"/><path d="M66 197h124" stroke="${palette.gold}" stroke-width="8"/>`],
    ["outfit-trader", "TRADER", palette.green, `<path d="M83 50h90l24 148H59Z" fill="#262C37" stroke="${palette.green}" stroke-width="6"/><path d="M103 50h50v84h-50Z" fill="${palette.text}"/><path d="M94 61v116M162 61v116" stroke="${palette.gold}" stroke-width="6"/>`],
    ["outfit-operator", "OPERATOR", palette.cyan, `<path d="M75 52h106l24 145H51Z" fill="${palette.cyan}" stroke="#1A6970" stroke-width="6"/><path d="M64 140h128" stroke="#1A6970" stroke-width="10"/><rect x="137" y="134" width="38" height="35" rx="6" fill="${palette.gold}"/>`],
    ["outfit-nomad", "NOMAD", palette.purple, `<path d="M73 50h110l17 148H56Z" fill="#343044" stroke="${palette.purple}" stroke-width="6"/><path d="M96 67c10-34 54-34 64 0" stroke="${palette.cyan}" stroke-width="12"/><path d="M58 90h-23v75h23" stroke="${palette.gold}" stroke-width="13"/>`],
    ["outfit-creator", "CREATOR", palette.pink, `<path d="M75 52h106l20 145H55Z" fill="${palette.pink}" stroke="#802E59" stroke-width="6"/><circle cx="103" cy="105" r="11" fill="${palette.gold}"/><circle cx="132" cy="90" r="9" fill="${palette.cyan}"/><circle cx="153" cy="121" r="10" fill="${palette.green}"/>`],
    ["outfit-office", "OFFICE", palette.silver, `<path d="M76 50h104l23 148H53Z" fill="#2E3440" stroke="${palette.silver}" stroke-width="6"/><path d="M104 51h48l-24 55Z" fill="${palette.text}"/><path d="M128 82l17 67-17 27-17-27Z" fill="${palette.red}"/>`],
  ];
  for (const [name, label, color, art] of outfits) {
    savePngAsset("clothing", name, 256, 256, `${art}`, { bg: false });
  }

  const accessories = {
    "acc-glasses": `<circle cx="46" cy="64" r="21" stroke="${palette.text}" stroke-width="8"/><circle cx="82" cy="64" r="21" stroke="${palette.text}" stroke-width="8"/><path d="M67 64h-6" stroke="${palette.text}" stroke-width="8" stroke-linecap="round"/>`,
    "acc-watch": `<rect x="49" y="14" width="30" height="100" rx="14" fill="${palette.brown}"/><circle cx="64" cy="64" r="31" fill="${palette.gold}" stroke="#8B670E" stroke-width="7"/><path d="M64 45v22l16 10" stroke="#4B3708" stroke-width="7" stroke-linecap="round"/>`,
    "acc-briefcase": `<rect x="25" y="43" width="78" height="58" rx="10" fill="${palette.brown}" stroke="#452B1C" stroke-width="7"/><path d="M49 43V31h30v12M25 68h78" stroke="${palette.gold}" stroke-width="6"/>`,
    "acc-backpack": `<path d="M38 42c4-29 48-29 52 0l10 64H28Z" fill="${palette.cyan}" stroke="#1A6970" stroke-width="7"/><path d="M51 84h26M39 51h50" stroke="#0B3A3F" stroke-width="6" stroke-linecap="round"/>`,
  };
  for (const [name, body] of Object.entries(accessories)) {
    writeNew(join(root, "accessories", `${name}.svg`), iconShell(body));
  }
}

function aiHosts() {
  const hosts = [
    ["host-judge", "JUDGE", palette.purple, `<path d="M74 183h108l-16-67H90Z" fill="#1C1B22"/><path d="M172 119l39-21" stroke="${palette.gold}" stroke-width="9"/><rect x="199" y="91" width="31" height="15" rx="5" fill="${palette.gold}"/>`],
    ["host-provocateur", "PROVOKER", palette.red, `<path d="M91 84c22-30 54-30 75 0" stroke="${palette.red}" stroke-width="8"/><path d="M171 128l42-13" stroke="${palette.red}" stroke-width="9"/><circle cx="210" cy="114" r="9" fill="${palette.red}"/>`],
    ["host-joker", "JOKER", palette.gold, `<path d="M91 178h74l-37-68Z" fill="${palette.gold}"/><circle cx="68" cy="78" r="9" fill="${palette.cyan}"/><circle cx="197" cy="89" r="9" fill="${palette.red}"/><circle cx="192" cy="166" r="8" fill="${palette.green}"/>`],
    ["host-coach", "COACH", palette.green, `<rect x="164" y="108" width="49" height="66" rx="8" fill="${palette.text}" stroke="${palette.green}" stroke-width="5"/><path d="M178 130h21M178 149h17" stroke="#333847" stroke-width="5"/><circle cx="76" cy="75" r="18" fill="${palette.gold}"/>`],
    ["host-broker", "BROKER", palette.cyan, `<path d="M84 181h88l-19-64h-50Z" fill="${palette.gold}"/><path d="M169 93l21-24 20 16" stroke="${palette.green}" stroke-width="7" fill="none"/><path d="M179 148l25 18" stroke="${palette.cyan}" stroke-width="11" stroke-linecap="round"/>`],
  ];
  for (const [name, label, color, prop] of hosts) {
    savePngAsset("ai-host", name, 256, 256, `${avatar(116, 128, "#DDA776", "#231B20", color)}${prop}`);
  }
}

function daily() {
  const variants = [
    ["day-1", "DAY 1", 0.52, "SMALL CHEST"],
    ["day-2", "DAY 2", 0.62, "MORE COINS"],
    ["day-3", "DAY 3", 0.72, "GIFT BOX"],
    ["day-4", "DAY 4", 0.82, "CASH STACK"],
    ["day-5", "DAY 5", 0.92, "TROPHY"],
    ["day-6", "DAY 6", 1.0, "DIAMOND"],
    ["day-7", "DAY 7", 1.15, "HUGE CHEST"],
  ];
  for (const [name, day, scale, label] of variants) {
    const s = scale;
    savePngAsset("daily", name, 256, 384, `
      <rect x="18" y="18" width="220" height="348" rx="24" fill="#121722" stroke="${palette.gold}" stroke-width="5"/>
      ${text(128, 70, day, 30, palette.gold, 900)}
      <g transform="translate(${128 - 55 * s} ${162 - 42 * s}) scale(${s})">
        <rect x="0" y="28" width="110" height="76" rx="12" fill="${palette.brown}" stroke="${palette.gold}" stroke-width="6"/>
        <path d="M8 28c18-34 75-34 94 0" fill="${palette.gold}" stroke="#8B670E" stroke-width="6"/>
        <path d="M0 59h110" stroke="${palette.gold}" stroke-width="7"/>
      </g>
      ${coin(72, 272, 17)}${coin(124, 254, 20)}${coin(181, 279, 17)}
      <path d="M62 113l18 8M194 116l-18 9M128 111v-25" stroke="${palette.cyan}" stroke-width="7" stroke-linecap="round"/>
    `, { radius: 28 });
  }
}

function tabAndUi() {
  const tabs = {
    "tab-table": `<rect x="12" y="25" width="40" height="25" rx="8" fill="${palette.gold}" stroke="#8B670E" stroke-width="4"/><rect x="20" y="14" width="16" height="22" rx="4" fill="#1B202B" stroke="${palette.gold}" stroke-width="3"/><rect x="30" y="19" width="16" height="22" rx="4" fill="#1B202B" stroke="${palette.gold}" stroke-width="3"/>`,
    "tab-portfolio": `<rect x="10" y="22" width="44" height="30" rx="7" fill="${palette.purple}" stroke="#3B2A69" stroke-width="4"/><path d="M23 22v-7h18v7M20 42l8-7 7 4 10-12" stroke="${palette.text}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    "tab-shop": `<path d="M17 24h30l4 29H13Z" fill="${palette.cyan}" stroke="#1A6970" stroke-width="4"/><path d="M23 24c0-14 18-14 18 0" stroke="${palette.text}" stroke-width="4"/><path d="M32 34l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1Z" fill="${palette.gold}"/>`,
  };
  for (const [name, body] of Object.entries(tabs)) {
    writeNew(join(root, "ui", `${name}.svg`), svg(64, 64, body, { bg: false }));
  }

  saveSvgAsset("ui", "bottom-sheet-handle", 40, 4, `<rect width="40" height="4" rx="2" fill="${palette.muted}"/>`, { bg: false });
  saveSvgAsset("ui", "toast-background", 320, 76, `<rect x="2" y="2" width="316" height="72" rx="18" fill="${palette.canvas}" fill-opacity=".9" stroke="${palette.line}" stroke-width="2" filter="url(#softShadow)"/>`, { bg: false });
  saveSvgAsset("ui", "swipe-arrow-up", 64, 64, `<path d="M32 52V14" stroke="${palette.green}" stroke-width="9" stroke-linecap="round"/><path d="M16 30l16-16 16 16" stroke="${palette.green}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 50h16M36 50h16" stroke="${palette.green}" stroke-width="5" stroke-linecap="round" opacity=".5"/>`, { bg: false });
  saveSvgAsset("ui", "swipe-arrow-down", 64, 64, `<path d="M32 12v38" stroke="${palette.red}" stroke-width="9" stroke-linecap="round"/><path d="M16 34l16 16 16-16" stroke="${palette.red}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 14h16M36 14h16" stroke="${palette.red}" stroke-width="5" stroke-linecap="round" opacity=".5"/>`, { bg: false });
  saveSvgAsset("ui", "lock-icon", 64, 64, `<rect x="13" y="28" width="38" height="27" rx="8" fill="${palette.muted}"/><path d="M22 28V19c0-14 20-14 20 0v9" stroke="${palette.muted}" stroke-width="7" stroke-linecap="round"/><circle cx="32" cy="41" r="4" fill="${palette.canvas}"/>`, { bg: false });
  saveSvgAsset("ui", "stars-icon", 64, 64, `<path d="M32 8l7 15 17 2-12 12 3 17-15-8-15 8 3-17L8 25l17-2Z" fill="${palette.gold}" stroke="#8B670E" stroke-width="4" stroke-linejoin="round"/>`, { bg: false });
}

onboarding();
dashboardIcons();
market();
labor();
pets();
clothingAndAccessories();
aiHosts();
daily();
tabAndUi();

console.log(JSON.stringify({
  created: made.length,
  skipped: skipped.length,
  failedPng: failedPng.length,
  createdPaths: made,
  skippedPaths: skipped,
  failedPngPaths: failedPng,
}, null, 2));
