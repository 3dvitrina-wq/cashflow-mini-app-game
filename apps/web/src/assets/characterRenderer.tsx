import React from 'react';
import type { Outfit, CharacterMood } from '../store/types';
import avatarAnton from './generated/avatar-anton.png';
import avatarLena from './generated/avatar-lena.png';
import avatarMax from './generated/avatar-max.png';
import avatarMira from './generated/avatar-mira.png';
import avatarSasha from './generated/avatar-sasha.png';
import avatarYou from './generated/avatar-you.png';

// Drawn emotion set for the "trader" character (8 states + cut rig parts live
// under generated/characters/trader/). One flat drawing per state is ENOUGH:
// state-switching is just picking the right PNG; motion (breathe / shake) is
// CSS on top; full limb/blink rigging later reuses the parts/ folder.
import traderStable from './generated/characters/trader/emotions/trader_stable.png';
import traderOverworked from './generated/characters/trader/emotions/trader_overworked.png';
import traderOverleveraged from './generated/characters/trader/emotions/trader_overleveraged.png';
import traderTaxPanic from './generated/characters/trader/emotions/trader_tax_panic.png';
import traderFuturesLiq from './generated/characters/trader/emotions/trader_futures_liq.png';
import traderPassiveCalm from './generated/characters/trader/emotions/trader_passive_calm.png';
import traderCardboard from './generated/characters/trader/emotions/trader_cardboard.png';
import traderNomad from './generated/characters/trader/emotions/trader_nomad.png';
import hustlerStable from './generated/characters/hustler/emotions/hustler_stable.png';
import hustlerOverworked from './generated/characters/hustler/emotions/hustler_overworked.png';
import hustlerOverleveraged from './generated/characters/hustler/emotions/hustler_overleveraged.png';
import hustlerTaxPanic from './generated/characters/hustler/emotions/hustler_tax_panic.png';
import hustlerStreetHustle from './generated/characters/hustler/emotions/hustler_street_hustle.png';
import hustlerPassiveCalm from './generated/characters/hustler/emotions/hustler_passive_calm.png';
import hustlerCardboard from './generated/characters/hustler/emotions/hustler_cardboard.png';
import hustlerNomad from './generated/characters/hustler/emotions/hustler_nomad.png';
import operatorStable from './generated/characters/operator/emotions/operator_stable.png';
import operatorOverworked from './generated/characters/operator/emotions/operator_overworked.png';
import operatorOverleveraged from './generated/characters/operator/emotions/operator_overleveraged.png';
import operatorTaxPanic from './generated/characters/operator/emotions/operator_tax_panic.png';
import operatorFuturesLiq from './generated/characters/operator/emotions/operator_server_fire.png';
import operatorPassiveCalm from './generated/characters/operator/emotions/operator_passive_calm.png';
import operatorCardboard from './generated/characters/operator/emotions/operator_cardboard.png';
import operatorNomad from './generated/characters/operator/emotions/operator_nomad.png';
import nomadStable from './generated/characters/nomad/emotions/nomad_stable.png';
import nomadOverworked from './generated/characters/nomad/emotions/nomad_overworked.png';
import nomadOverleveraged from './generated/characters/nomad/emotions/nomad_overleveraged.png';
import nomadTaxPanic from './generated/characters/nomad/emotions/nomad_tax_panic.png';
import nomadFuturesLiq from './generated/characters/nomad/emotions/nomad_futures_liq.png';
import nomadPassiveCalm from './generated/characters/nomad/emotions/nomad_passive_calm.png';
import nomadCardboard from './generated/characters/nomad/emotions/nomad_cardboard.png';
import nomadNomad from './generated/characters/nomad/emotions/nomad_nomad.png';
import creatorStable from './generated/characters/creator/emotions/creator_stable.png';
import creatorOverworked from './generated/characters/creator/emotions/creator_overworked.png';
import creatorOverleveraged from './generated/characters/creator/emotions/creator_overleveraged.png';
import creatorTaxPanic from './generated/characters/creator/emotions/creator_tax_panic.png';
import creatorFuturesLiq from './generated/characters/creator/emotions/creator_futures_liq.png';
import creatorPassiveCalm from './generated/characters/creator/emotions/creator_passive_calm.png';
import creatorCardboard from './generated/characters/creator/emotions/creator_cardboard.png';
import creatorNomad from './generated/characters/creator/emotions/creator_nomad.png';
import officeStable from './generated/characters/office/emotions/office_stable.png';
import officeOverworked from './generated/characters/office/emotions/office_overworked.png';
import officeOverleveraged from './generated/characters/office/emotions/office_overleveraged.png';
import officeTaxPanic from './generated/characters/office/emotions/office_tax_panic.png';
import officeFuturesLiq from './generated/characters/office/emotions/office_futures_liq.png';
import officePassiveCalm from './generated/characters/office/emotions/office_passive_calm.png';
import officeCardboard from './generated/characters/office/emotions/office_cardboard.png';
import officeNomad from './generated/characters/office/emotions/office_nomad.png';

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

export function resolveAvatarImage(name: string | undefined, outfit: Outfit): string {
  const key = (name || '').replace(/^@/, '').toLowerCase();
  return PNG_BY_NAME[key] || PNG_BY_OUTFIT[outfit] || avatarYou;
}

/** Picks the drawn emotion for the mood if the outfit has a set, else legacy PNG. */
export function resolveCharacterImage(name: string | undefined, outfit: Outfit, mood: CharacterMood): string {
  const set = EMOTION_SETS[outfit];
  if (set) {
    const key = MOOD_TO_EMOTION[mood];
    return set[key] || set.stable;
  }
  return resolveAvatarImage(name, outfit);
}

export function hasEmotionSet(outfit: Outfit): boolean {
  return Boolean(EMOTION_SETS[outfit]);
}

// ── Current renderer: drawn emotion PNG + CSS "alive" layer ──────────────────
// State changes by swapping the emotion PNG; idle breathe + stress shake make it
// feel animated without any pre-rendered animation files.
export const StaticImageRenderer: AvatarRenderer = ({ outfit, mood, name, stress, className }) => {
  const cls = [className, 'cav-alive', stress >= 7 ? 'cav-shake' : ''].filter(Boolean).join(' ');
  return (
    <img
      src={resolveCharacterImage(name, outfit, mood)}
      alt={`${name || outfit} ${mood}`}
      className={cls}
      draggable={false}
      data-mood={mood}
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
