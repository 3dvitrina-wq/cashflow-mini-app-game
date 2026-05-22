# Job Absurdity and Reaction Communication

## Design Goal

Make job search, resignation, office absurdity, and reaction-based communication funny enough to become a social hook. Work should be a phase players can suffer through, optimize, rage-quit, or escape when passive income becomes stable.

## Job Search Comedy

Job search can be a mini-deck with rejection reasons, interview events, and absurd requirements.

Rejection reasons:

- "We need 7 years of experience in a tool released last Tuesday."
- "Your CV is strong, but the algorithm preferred a PDF with more sadness."
- "The position is remote, but only from the office."
- "We loved you, but hired the CEO's nephew."
- "Your passport triggered the paperwork department."
- "We need someone junior with senior confidence and intern salary expectations."
- "You are overqualified, which means you might leave."
- "You are underqualified, which means you might stay."
- "The test task became our Q3 roadmap."
- "We paused hiring after your third interview."
- "The recruiter has left the company. So has the position."
- "You used the word salary too early."

Use fictional countries/origin tags for sensitive migration friction. The target is bureaucracy and labor-market absurdity, not real nationality hate.

## Employment Difficulty

Employment difficulty can depend on:

- macro profile;
- migration status;
- language barrier;
- credential recognition;
- reputation;
- stress;
- skill tags;
- AI portfolio/tools;
- network/community.

Remote work can bypass some local friction but adds platform/payment risk.

## Passive Income Escape

Employment should matter until passive cashflow is stable.

Suggested rule:

- Job is a survival baseline.
- Quitting too early increases crisis risk.
- Quitting after passive income threshold unlocks freedom bonuses.
- Staying too long can increase burnout and opportunity cost.

Job can be replaced by:

- low-risk business;
- creator income;
- rental income;
- automation/mini-app income;
- fund/operator income;
- family/team support.

## Resignation Events

When player quits, make it a moment.

Options:

- polite resignation;
- dramatic email;
- "reply all" disaster;
- exit interview truth bomb;
- darts on boss portrait;
- deleting work chat;
- taking the office plant;
- accidentally quitting before bonus;
- making a LinkedIn post nobody asked for;
- sending one final meme instead of a letter.

Effects:

- reputation change;
- stress relief;
- legal risk;
- lost bonus;
- network bonus;
- future employer penalty;
- AI host roast.

## Reaction-Only Mode

Room mode: no free text. Players communicate through structured actions, stickers, GIFs, and reaction buttons.

Allowed:

- system actions: offer, accept, decline, counter, help, rent room, challenge;
- curated reaction packs;
- stickers/GIFs;
- short preset phrases;
- AI-host prompts.

Why:

- less toxicity;
- more comedy;
- faster mobile play;
- easier moderation;
- strong Telegram-native identity.

## Reaction Packs

Examples:

- Job Search Pain.
- Tax Office Arrived.
- Futures Candle Betrayal.
- Divorce Court.
- Cardboard Box Era.
- Boss Fight: Manager Edition.
- Crypto Winter Face.
- Lawyer Enters The Chat.
- Passive Income Finally Works.

Each reaction has:

- id;
- emotion;
- trigger suggestions;
- locale tags;
- safe/unsafe rating;
- asset source/license;
- optional monetization pack id.

## Telegram GIF / Sticker Feasibility

Bot layer:

- Bot API supports `sendAnimation` for GIF or silent MPEG-4 animation.
- Bot API supports `sendSticker` for static, animated, and video stickers.
- Reusing Telegram `file_id` is recommended once asset is uploaded/known.

Mini App layer:

- Mini Apps cannot silently send arbitrary chat messages by themselves.
- For chat sharing, use bot messages, inline mode, or user-confirmed flows.
- Mini App can present reaction choices and submit game intent to backend.
- Backend/bot can publish game-approved reactions to the room where permitted.

## Copyright / Asset Policy

Movie/actor GIFs are emotionally strong but legally risky.

Safer path:

- original game sticker/GIF packs;
- licensed meme packs;
- creator partnerships;
- user-submitted packs with moderation and rights confirmation;
- abstract animated avatars that reference emotions, not copyrighted scenes.

Do not build core product around unlicensed movie/actor clips.

## Monetization

Strong:

- reaction packs;
- host roast packs;
- resignation packs;
- country/regime joke packs;
- avatar emotion packs;
- animated card reactions.

Avoid:

- paid reactions that affect rules;
- paid harassment packs;
- unlicensed film/actor packs;
- reactions that target protected traits.

## MVP Recommendation

MVP:

- job search event deck;
- employment friction fields;
- passive income quit threshold;
- 6-8 resignation event cards;
- reaction-only room mode as experimental;
- original sticker/GIF placeholder IDs.

Later:

- licensed GIF partnerships;
- user-generated reaction packs;
- AI-selected reaction suggestions;
- locale-specific job rejection jokes.

