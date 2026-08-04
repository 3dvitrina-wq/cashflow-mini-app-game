import { describe, expect, it } from 'vitest';
import {
  applyCommand,
  createRoom,
  expireSharedIntentWindow,
  joinRoom,
  setTutorialPaused,
  startRoom,
} from './rooms';
import * as roomApi from './rooms';

describe('shared room intent deadline', () => {
  it('passes every missing human and advances without waiting for another turn', () => {
    const room = createRoom(true);
    joinRoom(room.code, { playerId: 'p1', name: 'A', outfit: 'trader', ws: null });
    joinRoom(room.code, { playerId: 'p2', name: 'B', outfit: 'office', ws: null });
    const started = startRoom(room.code, { cardMode: 'shared' })!;
    expect(started.engineState?.phase).toBe('intent_window');

    const submitted = applyCommand(room.code, { type: 'pass', playerId: 'p1' });
    expect(submitted.rejected).toBe(false);
    expect(submitted.room?.engineState?.round).toBe(1);

    const expired = expireSharedIntentWindow(room.code)!;
    expect(expired.engineState?.round).toBe(2);
    expect(expired.engineState?.phase).toBe('intent_window');
    expect(expired.engineState?.eventLog.some(
      (event) => event.type === 'command_accepted'
        && event.playerId === 'p2'
        && event.message === 'intent:pass',
    )).toBe(true);
  });
});

describe('first-run tutorial pause', () => {
  it('freezes commands until every learning player resumes', () => {
    const room = createRoom(true);
    joinRoom(room.code, { playerId: 'p1', name: 'A', outfit: 'trader', ws: null });
    joinRoom(room.code, { playerId: 'p2', name: 'B', outfit: 'office', ws: null });
    startRoom(room.code, { cardMode: 'shared' });

    setTutorialPaused(room.code, 'p1', true);
    setTutorialPaused(room.code, 'p2', true);
    expect(applyCommand(room.code, { type: 'pass', playerId: 'p1' }).error).toContain('tutorial');

    setTutorialPaused(room.code, 'p1', false);
    expect(applyCommand(room.code, { type: 'pass', playerId: 'p1' }).error).toContain('tutorial');

    setTutorialPaused(room.code, 'p2', false);
    expect(applyCommand(room.code, { type: 'pass', playerId: 'p1' }).rejected).toBe(false);
  });
});

describe('explicit match exit semantics', () => {
  it('keeps room leave distinct from surrender during a live match', () => {
    const room = createRoom(true);
    joinRoom(room.code, { playerId: 'p1', name: 'A', outfit: 'trader', ws: null });
    joinRoom(room.code, { playerId: 'p2', name: 'B', outfit: 'office', ws: null });
    const started = startRoom(room.code, { cardMode: 'shared' })!;

    const leaveRoom = (roomApi as unknown as {
      leaveRoom: (code: string, playerId: string) => typeof room | null;
    }).leaveRoom;
    const left = leaveRoom(room.code, 'p1')!;
    const member = left.members.find((candidate) => candidate.playerId === 'p1')!;
    const player = left.engineState?.players.find((candidate) => candidate.id === 'p1')!;

    expect(started.status).toBe('playing');
    expect(member.connected).toBe(false);
    expect(member.botControlled).toBe(true);
    expect(member.resumeToken).toBeUndefined();
    expect(player.alive).toBe(true);
    expect(player.recapTags).not.toContain('surrendered');
  });

  it('routes surrender through the authoritative room engine', () => {
    const room = createRoom(true);
    joinRoom(room.code, { playerId: 'p1', name: 'A', outfit: 'trader', ws: null });
    joinRoom(room.code, { playerId: 'p2', name: 'B', outfit: 'office', ws: null });
    startRoom(room.code, { cardMode: 'shared' });

    const result = applyCommand(room.code, { type: 'surrender', playerId: 'p1' } as never);
    const player = result.room?.engineState?.players.find((candidate) => candidate.id === 'p1');

    expect(result.rejected).toBe(false);
    expect(player?.alive).toBe(false);
    expect(player?.recapTags).toContain('surrendered');
  });
});

describe('server-authoritative business offers', () => {
  it('rejects unavailable and off-round asset ids at the room boundary', () => {
    const room = createRoom(true);
    joinRoom(room.code, { playerId: 'p1', name: 'A', outfit: 'trader', ws: null });
    joinRoom(room.code, { playerId: 'p2', name: 'B', outfit: 'office', ws: null });
    const started = startRoom(room.code, { cardMode: 'shared' })!;
    const state = started.engineState!;
    const owner = state.players.find((player) => player.id === 'p1')!;
    owner.cash = 100_000;
    owner.businessSlotsMax = 20;
    const offered = state.businessMarket.offerIds[0]!;
    const unavailable = (['micro-coffee', 'micro-kiosk', 'micro-studio', 'office', 'coffee'] as const)
      .find((assetId) => !state.businessMarket.offerIds.includes(assetId))!;

    expect(applyCommand(room.code, { type: 'buy_asset', playerId: 'p1', assetId: unavailable }).rejected).toBe(true);

    started.engineState!.round = 2;
    expect(applyCommand(room.code, { type: 'buy_asset', playerId: 'p1', assetId: offered }).rejected).toBe(true);
    expect(started.engineState!.players.find((player) => player.id === 'p1')?.assets).toHaveLength(0);
  });
});
