# Phase: Lobby Social Hook (character select, meta-progression, visit, reactions)

## Goal
Turn the lobby into a social hub: pick a persistent character (gated by ownership / XP),
visit other players' profiles (achievements, mansion, pet, stats), reflect host cosmetics
as "their home", show a lobby pet with a micro in-match bonus, and exchange reactions.

## Decisions (confirmed with user)
- Character = persistent identity chosen by player; **profession is randomized per match** (+ free reroll).
- Pet bought outside the game = lobby decoration **+ minor in-match bonus** ("незначительно").
- Visit = **both layers**: host lobby reflects host cosmetics/home + tap any avatar opens profile sheet.
- Scope = full vision in one pass.
- Monetization stays cosmetic/identity (no pay-to-win); profession randomness keeps PvP fair.

## Data model (apps/web/src/store/persistence.ts -> PlayerData)
Add: `xp`, `unlockedCharacters: string[]`, `lobbyPetId: string|null`,
`achievements: string[]`, `matchesPlayed`, `matchesWon`, `bestPassiveIncome`, `totalEarned`.

## New files
- `apps/web/src/lib/progression.ts` - level curve, addXp, recordMatchResult, achievement eval,
  character unlock requirement + isCharacterUnlocked.
- `apps/web/src/assets/achievementsCatalog.ts` - achievement defs (id, ru/en, icon, xpReward, predicate).
- `apps/web/src/assets/reactions.ts` - shared REACTIONS list (lifted from MainTurnTableScreen).
- `apps/web/src/components/lobby/CharacterSelectSheet.tsx` - gated character picker (owned/XP/coins).
- `apps/web/src/components/lobby/LobbyReactionStack.tsx` - reuse reaction stack in lobby.

## Edits
- LobbyScreen: host row = the human ("you") with selected character; character-select CTA;
  random-profession preview chip + reroll; tap-row -> visit profile; host-home banner;
  lobby pet near host; reaction FAB; online reaction listener + meta in join.
- PlayerStatsScreen: optional `viewerMeta` prop (fallback loadPlayerData); add achievements/level
  section; use viewed player's home/pet when meta provided.
- store/index.ts: random profession for human at start; apply lobby-pet micro bonus; recordMatchResult on finish.
- apps/server/src/index.ts + rooms.ts: extend member payload with meta (level, characterId, housingId, petId, achievements count); relay `reaction` messages.
- packages/shared/src/schemas.ts: type new ws messages if message schemas exist there.

## Unlock policy (8 locked characters)
Half behind level (XP), half behind coins. starterOwned (6) stay free.

## Verification
- `pnpm -C apps/web build` + tsc clean; engine tests still pass; offline lobby flow works;
  online room shows reactions + meta; no pay-to-win on profession.
