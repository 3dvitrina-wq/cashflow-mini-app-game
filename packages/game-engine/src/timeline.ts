// ─────────────────────────────────────────────────────────────────────────────
// Timeline service. Rounds → months → seasons → years.
// Drives timeline.advance events for the Life Timeline UI ribbon.
// Pure, deterministic.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Season,
  TimelineCursor,
} from '../../shared/src/index';

const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];
const SEASON_LABELS: Record<Season, string> = {
  spring: '🌱 Spring',
  summer: '☀️ Summer',
  autumn: '🍂 Autumn',
  winter: '❄️ Winter',
};

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Starting point: Year 1, Month 1, Spring. */
export function createTimeline(): TimelineCursor {
  return {
    year: 1,
    month: 1,
    season: 'spring',
    label: '🌱 Year 1 · Jan · Spring',
  };
}

/** Advance one round = one month. Returns new cursor. */
export function advanceTimeline(cursor: TimelineCursor): TimelineCursor {
  let month = cursor.month + 1;
  let year = cursor.year;

  if (month > 12) {
    month = 1;
    year += 1;
  }

  // Season: months 1-3 = winter (start of year), 4-6 = spring, 7-9 = summer, 10-12 = autumn
  // Actually let's do: 1-3 = spring, 4-6 = summer, 7-9 = autumn, 10-12 = winter
  const seasonIndex = Math.floor((month - 1) / 3) % 4;
  const season = SEASONS[seasonIndex];

  return {
    year,
    month,
    season,
    label: `${SEASON_LABELS[season]} · Year ${year} · ${MONTH_NAMES[month - 1]}`,
  };
}

/** Get season for a given month (1-12). */
export function monthToSeason(month: number): Season {
  const idx = Math.floor(((month - 1) % 12) / 3) % 4;
  return SEASONS[idx];
}

/** Format a timeline cursor for display. */
export function formatTimeline(cursor: TimelineCursor): string {
  return cursor.label;
}
