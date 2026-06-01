# Character V2 Native Alpha Pipeline

Date: 2026-06-01

Purpose: bring the new PNG references into the DYOR character system in one coherent visual style, while preserving the reference detail level and producing true PNG alpha outputs without chroma-key extraction or fake transparency.

## Existing Asset Contract

Current character assets live under:

- `apps/web/src/assets/generated/characters/<character>/portraits/`
- `apps/web/src/assets/generated/characters/<character>/turnaround/`
- `apps/web/src/assets/generated/characters/<character>/emotions/`
- `apps/web/src/assets/generated/characters/<character>/parts/`
- `apps/web/src/assets/generated/characters/<character>/manifest.json`

The older full model-sheet flow used source-green sheets and alpha extraction. Do not use that for this V2 pass. Generate each deliverable PNG directly with a model-native transparent background.

## New Character Names

| Character id | Display name | Source file | Intended role |
| --- | --- | --- | --- |
| `burnout_clerk` | Burnout Clerk | `imag6e.png` | tired office worker, bureaucracy and salary stress |
| `deal_maven` | Deal Maven | `imag8e.png` | confident negotiator, phone-first deal maker |
| `whale_broker` | Whale Broker | `image*.png` | polished high-status broker, fictional-market shark |
| `street_hustler` | Street Hustler | `imag*.png` | compact street-style hustler; keep young-adult, not child |
| `fixer_consultant` | Fixer Consultant | `im*.png` | stylish coffee-and-contract operator |

## Base Prompt

Use this as the shared prompt body for each reference edit. Append the character brief and requested output block.

```text
Use case: style-transfer
Asset type: DYOR game character PNG asset with true transparent alpha background.
Primary request: Convert the provided reference character into the unified DYOR character style while preserving the character identity, hair, outfit idea, pose attitude, and reference detail level.

Visual style: 2.5D toy-comic, collectible vinyl toy meets editorial cartoon, matte clay/plastic texture, hand-sculpted forms, expressive face, bold readable silhouette, soft rim shadows, dark-UI compatible. Keep a richer sculpted detail level close to the references; do not simplify into flat vector art.

Game proportions: compact mobile-game body, slightly larger head and hands, strong readable shoes and props, but not baby-like and not chibi. Bust portraits should stay very close to the source framing and expression. Full-body sprites may be adjusted to match current DYOR character proportions.

Palette: deep black-blue UI compatibility, warm yellow #F5A524, red-orange #E84B2A, soft purple #A78BFA, mint green #28C76F, cyan #5BD7E0. Clothing can keep the reference color identity, but remove real logos and replace crypto/brand text with fictional DYOR-world marks such as NEON, DRIFT, VOLT, or simple abstract icons.

Transparency: output must be a clean PNG with true transparent background. No background, no floor, no cast shadow, no contact shadow, no glow halo behind the character, no chroma-key color, no fake checkerboard, no matte rectangle. Keep the character fully opaque with clean antialiased alpha edges.

Accessory compatibility: leave clear readable anchor areas for glasses, hat/headphones, chain/neckwear, watch/bracelet, held coffee/phone/contract, backpack/shoulder bag, and pet placement beside the feet. Do not permanently merge optional accessories that should later become interchangeable unless they are part of the character identity in the source.

Negative prompt: avoid Monopoly mascot, Mario style, Disney/Pixar clone, generic Memoji/Bitmoji/Roblox avatar, anime style, realistic 3D human, casino slot art, glossy gradients, real brand logos, real politicians, copyrighted characters, real investment advice, real stock/crypto symbols, unreadable tiny props, flat corporate SaaS illustration.
```

## Character Briefs

```text
Character brief: Burnout Clerk. Tired adult office worker with messy dark hair, heavy eyelids, loose yellow tie, white shirt, lanyard badge, coffee mug, stack of papers/folders. Keep the exhausted-but-funny expression. Make the silhouette compatible with the current DYOR office character but with more textured hair and clothing detail.
```

```text
Character brief: Deal Maven. Confident adult negotiator with purple suit, voluminous curly purple hair, gold glasses, phone, gold earrings/watch/chain accents. Keep the confident half-smile and premium toy-comic detail. Use fictional deal-broker energy, not luxury brand or real finance advisor.
```

```text
Character brief: Whale Broker. Polished adult broker with blond swept hair, sunglasses, dark pinstripe suit, red tie, phone and document folder. Preserve the high-status smirk and model-sheet clarity. Remove real-world references; make the character a fictional DYOR-world market shark, not a real person.
```

```text
Character brief: Street Hustler. Young-adult street-style hustler with cap, hoodie, shorts, sunglasses, phone, chain, purple/gold accents. Keep the compact confident silhouette, but make the character clearly an adult DYOR player avatar, not a child. Replace any real crypto text or brand marks with fictional DYOR marks.
```

```text
Character brief: Fixer Consultant. Stylish adult consultant with blonde swept hair, black blazer, white shirt, skirt, gold accessories, coffee cup, shoulder bag. Keep the polished friendly expression and fashion detail. Make the silhouette strong enough for mobile profile cards and game avatar chips.
```

## Requested Output Blocks

Use one block per generated PNG.

```text
Requested output: profile_bust.
Composition: waist-up portrait card asset, same camera angle and attitude as the reference, centered, generous padding, transparent background, no text. Output size 1024x1536.
```

```text
Requested output: front.
Composition: full-body front view, standing neutral pose, hands and props readable, centered, transparent background, no text. Output size 1024x1536.
```

```text
Requested output: three_quarter.
Composition: full-body three-quarter front view, same character design as front view, centered, transparent background, no text. Output size 1024x1536.
```

```text
Requested output: side.
Composition: full-body clean side view, same character design and proportions, centered, transparent background, no text. Output size 1024x1536.
```

```text
Requested output: back_three_quarter.
Composition: full-body back three-quarter view, same clothing, hair, accessories and proportions, centered, transparent background, no text. Output size 1024x1536.
```

## Native Alpha CLI

This path is intentionally not the built-in imagegen transparent workflow. It uses the fallback CLI with `gpt-image-1.5` because `gpt-image-2` does not support `background=transparent`.

Run only after confirming API usage:

```bash
export IMAGE_GEN="${CODEX_HOME:-$HOME/.codex}/skills/.system/imagegen/scripts/image_gen.py"

python3 "$IMAGE_GEN" edit \
  --model gpt-image-1.5 \
  --image apps/web/src/assets/generated/characters/burnout_clerk/references/source-reference.png \
  --prompt-file apps/web/src/assets/generated/characters/burnout_clerk/prompts/profile_bust.md \
  --background transparent \
  --output-format png \
  --input-fidelity high \
  --quality high \
  --no-augment \
  --size 1024x1536 \
  --out apps/web/src/assets/generated/characters/burnout_clerk/portraits/burnout_clerk_profile_bust.png
```

For each character and output, reuse the same base prompt plus the matching character brief and requested output block. Save results into that character's own folder. Do not overwrite existing outputs; use `-v2` filenames for retries.

First-pass portrait commands:

```bash
export IMAGE_GEN="${CODEX_HOME:-$HOME/.codex}/skills/.system/imagegen/scripts/image_gen.py"

python3 "$IMAGE_GEN" edit --model gpt-image-1.5 --image apps/web/src/assets/generated/characters/burnout_clerk/references/source-reference.png --prompt-file apps/web/src/assets/generated/characters/burnout_clerk/prompts/profile_bust.md --background transparent --output-format png --input-fidelity high --quality high --no-augment --size 1024x1536 --out apps/web/src/assets/generated/characters/burnout_clerk/portraits/burnout_clerk_profile_bust.png

python3 "$IMAGE_GEN" edit --model gpt-image-1.5 --image apps/web/src/assets/generated/characters/deal_maven/references/source-reference.png --prompt-file apps/web/src/assets/generated/characters/deal_maven/prompts/profile_bust.md --background transparent --output-format png --input-fidelity high --quality high --no-augment --size 1024x1536 --out apps/web/src/assets/generated/characters/deal_maven/portraits/deal_maven_profile_bust.png

python3 "$IMAGE_GEN" edit --model gpt-image-1.5 --image apps/web/src/assets/generated/characters/whale_broker/references/source-reference.png --prompt-file apps/web/src/assets/generated/characters/whale_broker/prompts/profile_bust.md --background transparent --output-format png --input-fidelity high --quality high --no-augment --size 1024x1536 --out apps/web/src/assets/generated/characters/whale_broker/portraits/whale_broker_profile_bust.png

python3 "$IMAGE_GEN" edit --model gpt-image-1.5 --image apps/web/src/assets/generated/characters/street_hustler/references/source-reference.png --prompt-file apps/web/src/assets/generated/characters/street_hustler/prompts/profile_bust.md --background transparent --output-format png --input-fidelity high --quality high --no-augment --size 1024x1536 --out apps/web/src/assets/generated/characters/street_hustler/portraits/street_hustler_profile_bust.png

python3 "$IMAGE_GEN" edit --model gpt-image-1.5 --image apps/web/src/assets/generated/characters/fixer_consultant/references/source-reference.png --prompt-file apps/web/src/assets/generated/characters/fixer_consultant/prompts/profile_bust.md --background transparent --output-format png --input-fidelity high --quality high --no-augment --size 1024x1536 --out apps/web/src/assets/generated/characters/fixer_consultant/portraits/fixer_consultant_profile_bust.png
```

## First Pass Order

1. Generate `profile_bust` for all five characters.
2. Pick the closest unified style.
3. Generate `front`, `three_quarter`, `side`, and `back_three_quarter`.
4. Only after the proportions are approved, generate emotion states and rig parts.

## QA Checklist

- PNG has real alpha channel and transparent corners.
- No background, floor, halo, green/magenta/blue key color, or checkerboard.
- Character reads at 120px avatar size.
- Detail level remains sculpted and close to references.
- No real logos, real crypto tickers, real politicians, or investment-advice text.
- Accessory anchors remain usable for glasses, hat/headphones, neck, wrists, hands, backpack, and pets.
