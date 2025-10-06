import { normalizeToE164Candidate, formatInternationalFlexible, normalizeForLookup } from './phoneUtils';

function fmt(input) {
  const cand = normalizeToE164Candidate(input);
  return formatInternationalFlexible(cand);
}

describe('phoneUtils normalization and formatting', () => {
  test('+1-012-345-1765 formats reasonably', () => {
    expect(fmt('+1-012-345-1765')).toBe('+1 (012) 345-1765');
    expect(normalizeForLookup('+1-012-345-1765')).toBe('+10123451765');
  });

  test('+18-012-345-1765 → +180 (123) 451-765', () => {
    expect(fmt('+18-012-345-1765')).toBe('+180 (123) 451-765');
    expect(normalizeForLookup('+18-012-345-1765')).toBe('+180123451765');
  });

  test('+180-012-345-1765 → +180 (012) 345-1765', () => {
    expect(fmt('+180-012-345-1765')).toBe('+180 (012) 345-1765');
    expect(normalizeForLookup('+180-012-345-1765')).toBe('+1800123451765');
  });

  test('1 (800) walgreens → +1 (800) 925-4733', () => {
    expect(fmt('1 (800) walgreens')).toBe('+1 (800) 925-4733');
    expect(normalizeForLookup('1 (800) walgreens')).toBe('+18009254733');
  });

  test('1 (827) 848-3689 formats as +1', () => {
    expect(fmt('1 (827) 848-3689')).toBe('+1 (827) 848-3689');
    expect(normalizeForLookup('1 (827) 848-3689')).toBe('+18278483689');
  });

  test('+16403453967 stays E.164', () => {
    expect(fmt('+16403453967')).toBe('+1 (640) 345-3967');
    expect(normalizeForLookup('+16403453967')).toBe('+16403453967');
  });

  test('+1-676-437-2969 is NANP', () => {
    expect(fmt('+1-676-437-2969')).toBe('+1 (676) 437-2969');
    expect(normalizeForLookup('+1-676-437-2969')).toBe('+16764372969');
  });

  test('+1 650 547 3239 is NANP', () => {
    expect(fmt('+1 650 547 3239')).toBe('+1 (650) 547-3239');
    expect(normalizeForLookup('+1 650 547 3239')).toBe('+16505473239');
  });

  test('658-457-3769 plain US', () => {
    expect(fmt('658-457-3769')).toBe('(658) 457-3769');
    expect(normalizeForLookup('658-457-3769')).toBe('+16584573769');
  });

  test('10-digit US number gets +1 prefix', () => {
    expect(normalizeForLookup('5551234567')).toBe('+15551234567');
    expect(normalizeForLookup('(555) 123-4567')).toBe('+15551234567');
  });

  // International mapped formats
  test('+44 2071234567 UK grouping', () => {
    expect(fmt('+44 2071234567')).toMatch(/^\+44\s\d{2}\s\d{4}\s\d{3,4}$/);
  });

  test('+49 15123456789 DE grouping', () => {
    expect(fmt('+49 15123456789')).toMatch(/^\+49\s\d{3}\s\d{3,4}\s\d{3,4}/);
  });

  test('+91 9876543210 IN grouping', () => {
    expect(fmt('+91 9876543210')).toBe('+91 98765 43210');
  });

  test('+61 412345678 AU grouping', () => {
    expect(fmt('+61 412345678')).toBe('+61 4 1234 5678');
  });
});


