#!/usr/bin/env python3
"""Content-aware model-sheet slicer.

The previous slicer cut each pose out of a FIXED 1/N-width column stripe, so any
figure wider than its cell - or drifting off-center, or with effect art (steam,
papers, sparks) spilling sideways - got clipped on the left/right. This version
finds where each figure ACTUALLY is: it projects the alpha mask onto the X axis
within each row band and splits at density VALLEYS (gaps between figures), not at
arithmetic fractions. Each pose is then cropped to its own alpha bounding box.

Row bands stay fraction-defined (the sheets are laid out in 3 regular rows), but
horizontal boundaries are derived from content. An adaptive search picks split
parameters that yield the expected figure count per row; if no exact match is
found it reconciles by merging the closest clusters (too many) or splitting the
widest at its deepest internal valley (too few).
"""
from __future__ import annotations

import json
import shutil
from dataclasses import dataclass
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
CHAR_ROOT = ROOT / "apps/web/src/assets/generated/characters"


CHARACTERS = {
    "artist": {"ru": "Художник", "work": "art_crisis"},
    "burnout_clerk": {"ru": "Уставший клерк", "work": "work_crisis"},
    "campus_student": {"ru": "Мажор-студент", "work": "study_crisis"},
    "checkout_cashier": {"ru": "Кассирша", "work": "register_crisis"},
    "classroom_teacher": {"ru": "Учительница", "work": "classroom_crisis"},
    "deal_maven": {"ru": "Переговорщица", "work": "deal_crisis"},
    "fixer_consultant": {"ru": "Консультантка", "work": "consulting_crisis"},
    "flight_attendant": {"ru": "Стюардесса", "work": "travel_crisis"},
    "grandma_collector": {"ru": "Бабка", "work": "collection_crisis"},
    "korean_student": {"ru": "Студентка", "work": "study_crisis"},
    "mad_fashion": {"ru": "Мажор", "work": "fashion_crisis"},
    "police_officer": {"ru": "Полицейский", "work": "paperwork_crisis"},
    "rap_queen": {"ru": "Реперша", "work": "stage_crisis"},
    "sky_pilot": {"ru": "Летчик", "work": "flight_crisis"},
}


TOP_KEYS = ["front", "three_quarter", "side", "back_three_quarter", "back"]
EMOTION_KEYS = [
    "stable",
    "overworked",
    "overleveraged",
    "tax_panic",
    "work_crisis",
    "passive_calm",
    "cardboard",
    "nomad",
]
PART_KEYS = [
    "head",
    "torso",
    "left_arm",
    "right_arm",
    "legs",
    "open_hand",
    "fist",
    "eyes_open",
    "eyes_closed",
    "mouth_smile",
    "mouth_teeth",
    "mouth_o",
]

ALPHA_THR = 8


@dataclass(frozen=True)
class RowBand:
    group: str
    keys: list[str]
    top_frac: float
    bottom_frac: float


ROW_BANDS = [
    RowBand("turnaround", TOP_KEYS, 0.0, 0.40),
    RowBand("emotions", EMOTION_KEYS, 0.40, 0.76),
]


def column_counts(alpha: Image.Image, y0: int, y1: int) -> list[int]:
    px = alpha.load()
    width, _ = alpha.size
    return [sum(1 for y in range(y0, y1) if px[x, y] > ALPHA_THR) for x in range(width)]


def split_valleys(counts: list[int], frac: float, min_run: int) -> list[tuple[int, int]]:
    """Group columns into figure ranges, breaking on runs of low-density columns."""
    peak = max(counts) or 1
    threshold = peak * frac
    ranges: list[tuple[int, int]] = []
    start: int | None = None
    last: int | None = None
    gap_run = 0
    for x, count in enumerate(counts):
        if count >= threshold:
            if start is None:
                start = x
            last = x
            gap_run = 0
        elif start is not None:
            gap_run += 1
            if gap_run >= min_run:
                ranges.append((start, last + 1))
                start = None
                last = None
                gap_run = 0
    if start is not None and last is not None:
        ranges.append((start, last + 1))
    return ranges


def merge_to_count(ranges: list[tuple[int, int]], expected: int) -> list[tuple[int, int]]:
    """Too many clusters: merge the pair with the smallest gap until count matches."""
    ranges = sorted(ranges)
    while len(ranges) > expected:
        gaps = [(ranges[i + 1][0] - ranges[i][1], i) for i in range(len(ranges) - 1)]
        _, i = min(gaps)
        merged = (ranges[i][0], ranges[i + 1][1])
        ranges = ranges[:i] + [merged] + ranges[i + 2:]
    return ranges


def split_to_count(ranges: list[tuple[int, int]], counts: list[int], expected: int) -> list[tuple[int, int]]:
    """Too few clusters: split the widest range at its deepest interior valley."""
    ranges = sorted(ranges)
    while len(ranges) < expected:
        widths = [(r - l, idx) for idx, (l, r) in enumerate(ranges)]
        _, idx = max(widths)
        left, right = ranges[idx]
        margin = max(8, (right - left) // 5)
        interior = range(left + margin, right - margin)
        if not interior:
            break  # cannot split further
        valley = min(interior, key=lambda x: counts[x])
        ranges = ranges[:idx] + [(left, valley), (valley, right)] + ranges[idx + 1:]
    return ranges


def figure_ranges(counts: list[int], expected: int) -> list[tuple[int, int]]:
    """Adaptive: find split params yielding `expected` clusters, else reconcile."""
    best: list[tuple[int, int]] | None = None
    for frac in (0.10, 0.12, 0.08, 0.14, 0.06, 0.16, 0.18):
        for min_run in (8, 10, 12, 6, 14):
            ranges = split_valleys(counts, frac, min_run)
            if len(ranges) == expected:
                return sorted(ranges)
            if best is None or abs(len(ranges) - expected) < abs(len(best) - expected):
                best = ranges
    best = best or []
    if len(best) > expected:
        return merge_to_count(best, expected)
    if len(best) < expected:
        return split_to_count(best, counts, expected)
    return sorted(best)


def alpha_bbox(image: Image.Image, pad: int = 6) -> tuple[int, int, int, int] | None:
    bbox = image.getchannel("A").getbbox()
    if not bbox:
        return None
    left, top, right, bottom = bbox
    return (
        max(0, left - pad),
        max(0, top - pad),
        min(image.width, right + pad),
        min(image.height, bottom + pad),
    )


def projection_ranges(alpha: Image.Image, min_pixels: int = 3, merge_gap: int = 16) -> list[tuple[int, int]]:
    px = alpha.load()
    width, height = alpha.size
    active = []
    for x in range(width):
        count = sum(1 for y in range(height) if px[x, y] > ALPHA_THR)
        active.append(count >= min_pixels)
    ranges: list[tuple[int, int]] = []
    start = None
    last = None
    for x, is_active in enumerate(active):
        if is_active and start is None:
            start = x
        if is_active:
            last = x
        if start is not None and last is not None and x - last > merge_gap:
            ranges.append((start, last + 1))
            start = None
            last = None
    if start is not None and last is not None:
        ranges.append((start, last + 1))
    return ranges


def pixel_box(box_frac, width, height):
    left, top, right, bottom = box_frac
    return (
        max(0, int(round(left * width))),
        max(0, int(round(top * height))),
        min(width, int(round(right * width))),
        min(height, int(round(bottom * height))),
    )


def part_crops(image: Image.Image):
    """Parts row: small icons; split by empty-column projection then alpha-trim."""
    width, height = image.size
    raw_box = pixel_box((0.0, 0.705, 1.0, 1.0), width, height)
    row = image.crop(raw_box)
    ranges = projection_ranges(row.getchannel("A"), min_pixels=3, merge_gap=18)
    crops = []
    for left, right in ranges:
        cell = row.crop((left, 0, right, row.height))
        bbox = alpha_bbox(cell)
        if bbox is None:
            continue
        crop = cell.crop(bbox)
        area = sum(1 for a in crop.getchannel("A").tobytes() if a > ALPHA_THR)
        if area < 180 or crop.width < 8 or crop.height < 8:
            continue
        source_box = [
            raw_box[0] + left + bbox[0],
            raw_box[1] + bbox[1],
            raw_box[0] + left + bbox[2],
            raw_box[1] + bbox[3],
        ]
        crops.append((crop, source_box, area))
    crops = sorted(crops, key=lambda item: item[1][0])
    if len(crops) > len(PART_KEYS):
        substantial = sorted(crops, key=lambda item: item[2], reverse=True)[: len(PART_KEYS)]
        crops = sorted(substantial, key=lambda item: item[1][0])
    return [(crop, source_box) for crop, source_box, _ in crops]


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT))


def copy_portrait_refs(character_dir: Path, cid: str) -> list[str]:
    out_dir = character_dir / "portrait_refs"
    out_dir.mkdir(parents=True, exist_ok=True)
    copied: list[str] = []
    portrait = character_dir / "portraits" / f"{cid}_profile_bust.png"
    if portrait.exists():
        dest = out_dir / f"{cid}_profile_bust.png"
        shutil.copy2(portrait, dest)
        copied.append(rel(dest))
    source_ref = character_dir / "references" / "source-reference.png"
    if source_ref.exists():
        dest = out_dir / f"{cid}_source_reference.png"
        shutil.copy2(source_ref, dest)
        copied.append(rel(dest))
    return copied


def load_manifest(path: Path) -> dict:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def write_manifest(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def slice_character(cid: str, ru_name: str, work_key: str) -> dict:
    character_dir = CHAR_ROOT / cid
    sheet = character_dir / f"{cid}-model-sheet-alpha.png"
    if not sheet.exists():
        raise FileNotFoundError(sheet)

    image = Image.open(sheet).convert("RGBA")
    width, height = image.size
    alpha = image.getchannel("A")

    for group in ("turnaround", "emotions", "parts"):
        group_dir = character_dir / group
        group_dir.mkdir(parents=True, exist_ok=True)
        for old in group_dir.glob(f"{cid}_*.png"):
            old.unlink()

    sprite_entries = []
    counts_report = {}

    for band in ROW_BANDS:
        y0 = int(round(band.top_frac * height))
        y1 = int(round(band.bottom_frac * height))
        counts = column_counts(alpha, y0, y1)
        ranges = figure_ranges(counts, len(band.keys))
        counts_report[band.group] = len(ranges)

        out_dir = character_dir / band.group
        for key, (left, right) in zip(band.keys, ranges):
            cell = image.crop((left, y0, right, y1))
            bbox = alpha_bbox(cell)
            if bbox is None:
                continue
            crop = cell.crop(bbox)
            source_box = [left + bbox[0], y0 + bbox[1], left + bbox[2], y0 + bbox[3]]
            out_path = out_dir / f"{cid}_{key}.png"
            crop.save(out_path)
            entry = {
                "group": band.group,
                "key": key,
                "label": key.replace("_", " "),
                "file": rel(out_path),
                "source_box": source_box,
                "size": [crop.width, crop.height],
            }
            sprite_entries.append(entry)

            if band.group == "emotions" and key == "work_crisis":
                alias_path = out_dir / f"{cid}_futures_liq.png"
                crop.save(alias_path)
                alias = dict(entry)
                alias["key"] = "futures_liq"
                alias["label"] = "futures liq / chaos alias"
                alias["file"] = rel(alias_path)
                sprite_entries.append(alias)

    for key, (crop, source_box) in zip(PART_KEYS, part_crops(image)):
        out_dir = character_dir / "parts"
        out_path = out_dir / f"{cid}_{key}.png"
        crop.save(out_path)
        sprite_entries.append({
            "group": "parts",
            "key": key,
            "label": key.replace("_", " "),
            "file": rel(out_path),
            "source_box": source_box,
            "size": [crop.width, crop.height],
        })

    portrait_refs = copy_portrait_refs(character_dir, cid)

    manifest_path = character_dir / "manifest.json"
    manifest = load_manifest(manifest_path)
    manifest.setdefault("id", cid)
    manifest["displayNameRu"] = ru_name
    manifest["status"] = "model_sheet_sliced_alpha_content_aware"
    manifest["alpha_sheet"] = rel(sheet)
    manifest["portraitRefs"] = portrait_refs
    manifest["slicingContract"] = {
        "layout": "wide model sheet, 3 fraction-defined row bands",
        "rows": ["turnaround", "emotions", "parts"],
        "workCrisisKey": work_key,
        "method": "alpha X-projection valley split per row band; tight alpha bbox per figure",
        "coordinateSpace": "source sheet pixels",
    }
    manifest["sprites"] = sprite_entries
    write_manifest(manifest_path, manifest)

    return {"id": cid, "turnaround": counts_report.get("turnaround"),
            "emotions": counts_report.get("emotions"), "sprites": len(sprite_entries)}


def main(argv: list[str]) -> None:
    ids = argv or list(CHARACTERS.keys())
    results = []
    for cid in ids:
        meta = CHARACTERS[cid]
        results.append(slice_character(cid, meta["ru"], meta["work"]))
    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    import sys
    main(sys.argv[1:])
