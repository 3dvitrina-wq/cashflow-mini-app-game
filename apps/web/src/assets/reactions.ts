// Shared reaction set — used by both the in-match table and the lobby so the
// "vocabulary" of reactions stays identical everywhere.
import reactionArrow from './generated/reaction-arrow.png';
import reactionCat from './generated/reaction-cat.png';
import reactionFrog from './generated/reaction-frog.png';
import reactionLol from './generated/reaction-lol.png';
import reactionPanda from './generated/reaction-panda.png';
import reactionWtf from './generated/reaction-wtf.png';

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
