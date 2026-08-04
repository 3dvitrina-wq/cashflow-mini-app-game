import { describe, expect, it } from 'vitest';
import { selectLiabilityPage } from './liabilities';

describe('compact Bank liability paging', () => {
  const obligations = [
    { id: 'profession-mortgage', creditor: 'Mortgage Bank' },
    { id: 'profession-education', creditor: 'Student Loan Fund' },
    { id: 'bank-credit', creditor: 'Bank' },
  ];

  it('keeps every profession and Bank obligation reachable without an unbounded list', () => {
    expect(obligations.map((_, index) => selectLiabilityPage(obligations, index).item?.id)).toEqual([
      'profession-mortgage',
      'profession-education',
      'bank-credit',
    ]);
  });

  it('clamps selection when payoff shortens the authoritative list', () => {
    expect(selectLiabilityPage(obligations.slice(0, 2), 2)).toMatchObject({
      item: obligations[1],
      index: 1,
      count: 2,
    });
    expect(selectLiabilityPage([], 4)).toEqual({ item: undefined, index: 0, count: 0 });
  });
});
