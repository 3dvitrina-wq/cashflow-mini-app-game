import { describe, expect, it } from 'vitest';
import {
  applyCommand,
  createRoom,
  expireSharedIntentWindow,
  joinRoom,
  startRoom,
} from './rooms';

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
