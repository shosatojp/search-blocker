/* eslint-disable dot-notation */
import { Rule } from './rule';
import { test, expect } from '@jest/globals';

test('', () => {
    expect(Rule['matchHostname']('d', 'c.d')).toBe(true);
    expect(Rule['matchHostname']('d', 'a.b.c.d')).toBe(true);
    expect(Rule['matchHostname']('c.d', 'a.b.c.d')).toBe(true);
    expect(Rule['matchHostname']('d', 'd')).toBe(true);
    expect(Rule['matchHostname']('a', 'd')).toBe(false);
    expect(Rule['matchHostname']('a.d', 'b.d')).toBe(false);
    expect(Rule['matchHostname']('c.d', 'd')).toBe(false);
});
