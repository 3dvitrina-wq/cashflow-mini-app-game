// Shared reaction set — used by both the in-match table and the lobby so the
// "vocabulary" of reactions stays identical everywhere.
import reactionArrow from './generated/reaction-arrow.webp';
import reactionCat from './generated/reaction-cat.webp';
import reactionFrog from './generated/reaction-frog.webp';
import reactionLol from './generated/reaction-lol.webp';
import reactionPanda from './generated/reaction-panda.webp';
import reactionWtf from './generated/reaction-wtf.webp';

export interface ReactionDef {
  label: string;
  image: string;
  className: string;
}

export const REACTIONS: ReactionDef[] = [
  { label: 'WTF', image: reactionWtf, className: 'reaction-burst' },
  { label: 'NEXT', image: reactionArrow, className: 'reaction-arrow' },
  { label: 'HMM', image: reactionFrog, className: 'reaction-frog' },
  { label: 'LOL', image: reactionCat, className: 'reaction-pet' },
  { label: 'NOPE', image: reactionPanda, className: 'reaction-sad' },
  { label: 'OK', image: reactionLol, className: 'reaction-laugh' },
];

export const BOT_REACTION_LABELS = ['HMM', 'NEXT', 'WTF', 'OK', 'LOL'] as const;
