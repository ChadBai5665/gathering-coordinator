import { describe, expect, it } from 'vitest';
import { pickWinnerNomination } from './vote-calculator.service.js';
import type { Nomination, VoteRecord } from '@ontheway/shared';

function nom(partial: Partial<Nomination> & Pick<Nomination, 'id' | 'name'>): Nomination {
  return {
    id: partial.id,
    gathering_id: partial.gathering_id ?? 'g1',
    nominated_by: partial.nominated_by ?? 'p1',
    amap_id: partial.amap_id ?? 'amap',
    name: partial.name,
    type: partial.type ?? null,
    address: partial.address ?? null,
    location: partial.location ?? { lng: 116.4, lat: 39.9 },
    rating: partial.rating ?? null,
    cost: partial.cost ?? null,
    source: partial.source ?? 'manual',
    reason: partial.reason ?? null,
    score: partial.score ?? 0,
    travel_infos: partial.travel_infos ?? [],
    is_confirmed: partial.is_confirmed ?? false,
    created_at: partial.created_at ?? new Date().toISOString(),
  };
}

function rec(voteId: string, userId: string, nominationId: string): VoteRecord {
  return {
    id: `${voteId}:${userId}`,
    vote_id: voteId,
    user_id: userId,
    nomination_id: nominationId,
    created_at: new Date().toISOString(),
  };
}

describe('pickWinnerNomination', () => {
  it('picks the nomination with highest vote count', () => {
    const n1 = nom({ id: 'n1', name: 'A', score: 10 });
    const n2 = nom({ id: 'n2', name: 'B', score: 99 });
    const records = [
      rec('v1', 'u1', 'n1'),
      rec('v1', 'u2', 'n1'),
      rec('v1', 'u3', 'n2'),
    ];

    const winner = pickWinnerNomination([n1, n2], records);
    expect(winner?.id).toBe('n1');
  });

  it('breaks ties by higher score', () => {
    const n1 = nom({ id: 'n1', name: 'A', score: 10, created_at: '2026-01-01T00:00:00.000Z' });
    const n2 = nom({ id: 'n2', name: 'B', score: 20, created_at: '2026-01-01T00:00:01.000Z' });
    const records = [
      rec('v1', 'u1', 'n1'),
      rec('v1', 'u2', 'n2'),
    ];

    const winner = pickWinnerNomination([n1, n2], records);
    expect(winner?.id).toBe('n2');
  });

  it('breaks ties by earliest created_at when score ties', () => {
    const n1 = nom({ id: 'n1', name: 'A', score: 10, created_at: '2026-01-01T00:00:00.000Z' });
    const n2 = nom({ id: 'n2', name: 'B', score: 10, created_at: '2026-01-01T00:00:10.000Z' });
    const records = [
      rec('v1', 'u1', 'n1'),
      rec('v1', 'u2', 'n2'),
    ];

    const winner = pickWinnerNomination([n1, n2], records);
    expect(winner?.id).toBe('n1');
  });
});

