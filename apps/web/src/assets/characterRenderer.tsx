import React from 'react';
import type { Outfit, CharacterMood } from '../store/types';
import { resolveGeneratedCharacter } from './generatedCharacterCatalog';
import avatarAnton from './generated/avatar-anton.webp';
import avatarLena from './generated/avatar-lena.webp';
import avatarMax from './generated/avatar-max.webp';
import avatarMira from './generated/avatar-mira.webp';
import avatarSasha from './generated/avatar-sasha.webp';
import avatarYou from './generated/avatar-you.webp';

// Drawn emotion set for the "trader" character (8 states + cut rig parts live
// under generated/characters/trader/). One flat drawing per state is ENOUGH:
// state-switching is just picking the right PNG; motion (breathe / shake) is
// CSS on top; full limb/blink rigging later reuses the parts/ folder.
import traderStable from './generated/characters/trader/emotions/trader_stable.webp';
import traderOverworked from './generated/characters/trader/emotions/trader_overworked.webp';
import traderOverleveraged from './generated/characters/trader/emotions/trader_overleveraged.webp';
import traderTaxPanic from './generated/characters/trader/emotions/trader_tax_panic.webp';
import traderFuturesLiq from './generated/characters/trader/emotions/trader_futures_liq.webp';
import traderPassiveCalm from './generated/characters/trader/emotions/trader_passive_calm.webp';
import traderCardboard from './generated/characters/trader/emotions/trader_cardboard.webp';
import traderNomad from './generated/characters/trader/emotions/trader_nomad.webp';
import hustlerStable from './generated/characters/hustler/emotions/hustler_stable.webp';
import hustlerOverworked from './generated/characters/hustler/emotions/hustler_overworked.webp';
import hustlerOverleveraged from './generated/characters/hustler/emotions/hustler_overleveraged.webp';
import hustlerTaxPanic from './generated/characters/hustler/emotions/hustler_tax_panic.webp';
import hustlerStreetHustle from './generated/characters/hustler/emotions/hustler_street_hustle.webp';
import hustlerPassiveCalm from './generated/characters/hustler/emotions/hustler_passive_calm.webp';
import hustlerCardboard from './generated/characters/hustler/emotions/hustler_cardboard.webp';
import hustlerNomad from './generated/characters/hustler/emotions/hustler_nomad.webp';
import operatorStable from './generated/characters/operator/emotions/operator_stable.webp';
import operatorOverworked from './generated/characters/operator/emotions/operator_overworked.webp';
import operatorOverleveraged from './generated/characters/operator/emotions/operator_overleveraged.webp';
import operatorTaxPanic from './generated/characters/operator/emotions/operator_tax_panic.webp';
import operatorFuturesLiq from './generated/characters/operator/emotions/operator_server_fire.webp';
import operatorPassiveCalm from './generated/characters/operator/emotions/operator_passive_calm.webp';
import operatorCardboard from './generated/characters/operator/emotions/operator_cardboard.webp';
import operatorNomad from './generated/characters/operator/emotions/operator_nomad.webp';
import nomadStable from './generated/characters/nomad/emotions/nomad_stable.webp';
import nomadOverworked from './generated/characters/nomad/emotions/nomad_overworked.webp';
import nomadOverleveraged from './generated/characters/nomad/emotions/nomad_overleveraged.webp';
import nomadTaxPanic from './generated/characters/nomad/emotions/nomad_tax_panic.webp';
import nomadFuturesLiq from './generated/characters/nomad/emotions/nomad_futures_liq.webp';
import nomadPassiveCalm from './generated/characters/nomad/emotions/nomad_passive_calm.webp';
import nomadCardboard from './generated/characters/nomad/emotions/nomad_cardboard.webp';
import nomadNomad from './generated/characters/nomad/emotions/nomad_nomad.webp';
import creatorStable from './generated/characters/creator/emotions/creator_stable.webp';
import creatorOverworked from './generated/characters/creator/emotions/creator_overworked.webp';
import creatorOverleveraged from './generated/characters/creator/emotions/creator_overleveraged.webp';
import creatorTaxPanic from './generated/characters/creator/emotions/creator_tax_panic.webp';
import creatorFuturesLiq from './generated/characters/creator/emotions/creator_futures_liq.webp';
import creatorPassiveCalm from './generated/characters/creator/emotions/creator_passive_calm.webp';
import creatorCardboard from './generated/characters/creator/emotions/creator_cardboard.webp';
import creatorNomad from './generated/characters/creator/emotions/creator_nomad.webp';
import officeStable from './generated/characters/office/emotions/office_stable.webp';
import officeOverworked from './generated/characters/office/emotions/office_overworked.webp';
import officeOverleveraged from './generated/characters/office/emotions/office_overleveraged.webp';
import officeTaxPanic from './generated/characters/office/emotions/office_tax_panic.webp';
import officeFuturesLiq from './generated/characters/office/emotions/office_futures_liq.webp';
import officePassiveCalm from './generated/characters/office/emotions/office_passive_calm.webp';
import officeCardboard from './generated/characters/office/emotions/office_cardboard.webp';
import officeNomad from './generated/characters/office/emotions/office_nomad.webp';

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH FOR HOW A CHARACTER IS DRAWN.
//
// Every avatar renders through <CharacterAvatar/>, which calls the
// ACTIVE_AVATAR_RENDERER below. The current renderer is emotion-aware: a
// character that has a drawn emotion set (trader) shows the right state PNG and
// gets a CSS "alive" layer; characters without a set fall back to the legacy
// single PNG. Swap ACTIVE_AVATAR_RENDERER to a Rive/layered renderer (driven by
// the SAME props + the parts/ folder) to get full rigged animation. No call
// site changes.
// ─────────────────────────────────────────────────────────────────────────────

export interface AvatarRenderState {
  outfit: Outfit;
  mood: CharacterMood;
  /** 0-10. Drives the stress shake and is the continuous input for Rive later. */
  stress: number;
  active: boolean;
  size: number;
  name?: string;
  characterId?: string;
  /** Applied to the root element so screens can keep their own CSS chrome. */
  className?: string;
}

export type AvatarRenderer = React.FC<AvatarRenderState>;

export interface MoodVisual {
  ring: string;
  badge: string;
  /** State name in player.riv / the drawn emotion key. */
  riveState: string;
}

export const MOOD_META: Record<CharacterMood, MoodVisual> = {
  stable: { ring: '#28C76F', badge: ':)', riveState: 'stable' },
  happy: { ring: '#34D399', badge: ':D', riveState: 'stable' },
  stressed: { ring: '#F5A524', badge: '!!', riveState: 'overworked' },
  overworked: { ring: '#F5A524', badge: 'x_x', riveState: 'overworked' },
  tax_panic: { ring: '#E84B2A', badge: 'TAX', riveState: 'tax_panic' },
  overleveraged: { ring: '#E84B2A', badge: 'LEV', riveState: 'overleveraged' },
  cardboard: { ring: '#7D7B6F', badge: 'BOX', riveState: 'cardboard' },
  passive_calm: { ring: '#34D399', badge: 'CALM', riveState: 'passive_calm' },
  nomad: { ring: '#5BD7E0', badge: 'NOMAD', riveState: 'nomad' },
  chaos: { ring: '#D7445B', badge: 'MASK', riveState: 'futures_liq' },
};

// ── Drawn emotion sets, keyed by outfit. Add more as art lands. ──────────────
type EmotionSet = Record<string, string>;

const EMOTION_SETS: Partial<Record<Outfit, EmotionSet>> = {
  hustler: {
    stable: hustlerStable,
    overworked: hustlerOverworked,
    overleveraged: hustlerOverleveraged,
    tax_panic: hustlerTaxPanic,
    futures_liq: hustlerStreetHustle,
    street_hustle: hustlerStreetHustle,
    passive_calm: hustlerPassiveCalm,
    cardboard: hustlerCardboard,
    nomad: hustlerNomad,
  },
  trader: {
    stable: traderStable,
    overworked: traderOverworked,
    overleveraged: traderOverleveraged,
    tax_panic: traderTaxPanic,
    futures_liq: traderFuturesLiq,
    passive_calm: traderPassiveCalm,
    cardboard: traderCardboard,
    nomad: traderNomad,
  },
  operator: {
    stable: operatorStable,
    overworked: operatorOverworked,
    overleveraged: operatorOverleveraged,
    tax_panic: operatorTaxPanic,
    futures_liq: operatorFuturesLiq,
    passive_calm: operatorPassiveCalm,
    cardboard: operatorCardboard,
    nomad: operatorNomad,
  },
  nomad: {
    stable: nomadStable,
    overworked: nomadOverworked,
    overleveraged: nomadOverleveraged,
    tax_panic: nomadTaxPanic,
    futures_liq: nomadFuturesLiq,
    passive_calm: nomadPassiveCalm,
    cardboard: nomadCardboard,
    nomad: nomadNomad,
  },
  creator: {
    stable: creatorStable,
    overworked: creatorOverworked,
    overleveraged: creatorOverleveraged,
    tax_panic: creatorTaxPanic,
    futures_liq: creatorFuturesLiq,
    passive_calm: creatorPassiveCalm,
    cardboard: creatorCardboard,
    nomad: creatorNomad,
  },
  office: {
    stable: officeStable,
    overworked: officeOverworked,
    overleveraged: officeOverleveraged,
    tax_panic: officeTaxPanic,
    futures_liq: officeFuturesLiq,
    passive_calm: officePassiveCalm,
    cardboard: officeCardboard,
    nomad: officeNomad,
  },
};

// ── Per-character emotion sets (V2 generated characters) ─────────────────────
// Each generated character ships its OWN full phase set under
// generated/characters/<id>/emotions/<id>_<phase>.png. We load them all eagerly
// via Vite glob and key by characterId, so the editor swiper AND in-game avatars
// show that specific character's phases instead of borrowing the engine outfit's
// art. Filename prefix must equal the folder id (regex backreference enforces it,
// which also handles ids with underscores like `burnout_clerk`).
const CHARACTER_EMOTION_GLOB = import.meta.glob(
  './generated/characters/*/emotions/*.webp',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>;

const CHARACTER_EMOTION_SETS: Record<string, EmotionSet> = {};
for (const [path, url] of Object.entries(CHARACTER_EMOTION_GLOB)) {
  const match = path.match(/characters\/([^/]+)\/emotions\/\1_(.+)\.webp$/);
  if (!match) continue;
  const [, id, key] = match;
  (CHARACTER_EMOTION_SETS[id] ??= {})[key] = url;
}

// mood (9) -> available drawn emotion key for a set
const MOOD_TO_EMOTION: Record<CharacterMood, string> = {
  stable: 'stable',
  happy: 'stable',
  stressed: 'overworked',
  overworked: 'overworked',
  tax_panic: 'tax_panic',
  overleveraged: 'overleveraged',
  cardboard: 'cardboard',
  passive_calm: 'passive_calm',
  nomad: 'nomad',
  chaos: 'futures_liq',
};

// ── Legacy single-PNG fallback (characters without a drawn emotion set) ──────
const PNG_BY_NAME: Record<string, string> = {
  anton: avatarAnton,
  lena: avatarLena,
  max: avatarMax,
  mira: avatarMira,
  sasha: avatarSasha,
  you: avatarYou,
};

const PNG_BY_OUTFIT: Record<Outfit, string> = {
  hustler: avatarYou,
  trader: avatarMira,
  operator: avatarMax,
  nomad: avatarLena,
  creator: avatarSasha,
  office: avatarAnton,
};

export function resolveAvatarImage(name: string | undefined, outfit: Outfit, characterId?: string): string {
  const generated = resolveGeneratedCharacter(characterId) ?? resolveGeneratedCharacter(name);
  if (generated) return generated.profile;

  const key = (name || '').replace(/^@/, '').toLowerCase();
  return PNG_BY_NAME[key] || PNG_BY_OUTFIT[outfit] || avatarYou;
}

/** Picks the drawn emotion for the mood if the outfit has a set, else legacy PNG. */
export function resolveCharacterImage(name: string | undefined, outfit: Outfit, mood: CharacterMood, characterId?: string): string {
  const generated = resolveGeneratedCharacter(characterId) ?? resolveGeneratedCharacter(name);
  if (generated) {
    const charSet = CHARACTER_EMOTION_SETS[generated.id];
    if (charSet) {
      const key = MOOD_TO_EMOTION[mood];
      return charSet[key] || charSet.stable || generated.stable;
    }
    return generated.stable;
  }

  const set = EMOTION_SETS[outfit];
  if (set) {
    const key = MOOD_TO_EMOTION[mood];
    return set[key] || set.stable;
  }
  return resolveAvatarImage(name, outfit, characterId);
}

export function hasEmotionSet(outfit: Outfit): boolean {
  return Boolean(EMOTION_SETS[outfit]);
}

// ── Emotion state helpers (used by CharacterEditorScreen state swiper) ───────

const EMOTION_LABELS_RU: Record<string, string> = {
  stable: 'Стабильно',
  overworked: 'Переработка',
  overleveraged: 'Перелевередж',
  tax_panic: 'Налог!',
  work_crisis: 'Аврал',
  futures_liq: 'Ликвидация',
  street_hustle: 'Хастл',
  passive_calm: 'Пассив',
  cardboard: 'Банкрот',
  nomad: 'Номад',
  server_fire: 'Сервер горит',
};

// Display order for the editor swiper: calm -> escalating stress -> recovery.
const PHASE_ORDER = [
  'stable',
  'overworked',
  'overleveraged',
  'tax_panic',
  'work_crisis',
  'futures_liq',
  'cardboard',
  'passive_calm',
  'nomad',
];

export interface EmotionState {
  key: string;
  label: string;
  src: string;
}

/**
 * States for the editor swiper. Prefers the character's OWN emotion set
 * (generated/characters/<id>/emotions); falls back to the engine outfit's set
 * for the 6 legacy outfits. Ordered by PHASE_ORDER, only includes existing art.
 */
export function getCharacterEmotionStates(characterId?: string, outfit?: Outfit): EmotionState[] {
  const set =
    (characterId ? CHARACTER_EMOTION_SETS[characterId] : undefined) ??
    (outfit ? EMOTION_SETS[outfit] : undefined);
  if (!set) return [];
  const ordered = PHASE_ORDER.filter((key) => set[key]);
  const extras = Object.keys(set).filter((key) => !PHASE_ORDER.includes(key));
  return [...ordered, ...extras].map((key) => ({
    key,
    label: EMOTION_LABELS_RU[key] ?? key,
    src: set[key],
  }));
}

// ── Current renderer: drawn emotion PNG + CSS "alive" layer ──────────────────
// State changes by swapping the emotion PNG; idle breathe + stress shake make it
// feel animated without any pre-rendered animation files.
export const StaticImageRenderer: AvatarRenderer = ({ outfit, mood, name, characterId, stress, className }) => {
  const cls = [className, 'cav-alive', stress >= 7 ? 'cav-shake' : ''].filter(Boolean).join(' ');
  return (
    <img
      src={resolveCharacterImage(name, outfit, mood, characterId)}
      alt={`${name || outfit} ${mood}`}
      className={cls}
      draggable={false}
      data-mood={mood}
      data-character-id={characterId}
    />
  );
};

// ── Future renderer: full rig from parts/ via Rive (or layered SVG/CSS) ───────
// Drive MOOD_META[mood].riveState into the `state` input and stress*10 into the
// `stress` input; fire triggers on events. Uses the SAME parts the artist cut.
export const RiveAvatarRenderer: AvatarRenderer = (s) => {
  // import { useRive } from '@rive-app/react-canvas';
  // const { RiveComponent } = useRive({ src: 'trader.riv', stateMachines: 'State', autoplay: true });
  // stateInput.value = MOOD_META[s.mood].riveState; stressInput.value = s.stress * 10;
  // return <RiveComponent className={s.className} style={{ width: s.size, height: s.size }} />;
  return <StaticImageRenderer {...s} />;
};

// THE SEAM: change this one line to upgrade every avatar in the app at once.
export const ACTIVE_AVATAR_RENDERER: AvatarRenderer = StaticImageRenderer;
