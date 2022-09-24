/* eslint-disable dot-notation */
import { HostNameRule } from './rule';
import { test, expect } from '@jest/globals';

test('HostNameRule.matchHostname', () => {
    expect(HostNameRule['matchHostname'](['d'], ['c', 'd'])).toBe(true);
    expect(HostNameRule['matchHostname'](['d'], ['a', 'b', 'c', 'd'])).toBe(true);
    expect(HostNameRule['matchHostname'](['c', 'd'], ['a', 'b', 'c', 'd'])).toBe(true);
    expect(HostNameRule['matchHostname'](['d'], ['d'])).toBe(true);
    expect(HostNameRule['matchHostname'](['a'], ['d'])).toBe(false);
    expect(HostNameRule['matchHostname'](['a', 'd'], ['b', 'd'])).toBe(false);
    expect(HostNameRule['matchHostname'](['c', 'd'], ['d'])).toBe(false);
});

test('HostNameRule.matchPath', () => {
    expect(HostNameRule['matchPath'](['d'], ['d', 'c'])).toBe(true);
    expect(HostNameRule['matchPath'](['d'], ['d', 'c', 'b', 'a'])).toBe(true);
    expect(HostNameRule['matchPath'](['d', 'c'], ['d', 'c', 'b', 'a'])).toBe(true);
    expect(HostNameRule['matchPath'](['d'], ['d'])).toBe(true);
    expect(HostNameRule['matchPath'](['a'], ['d'])).toBe(false);
    expect(HostNameRule['matchPath'](['d', 'a'], ['d', 'b'])).toBe(false);
    expect(HostNameRule['matchPath'](['d', 'c'], ['d'])).toBe(false);

    expect(HostNameRule['matchPath'](['*'], ['a'])).toBe(true);
    expect(HostNameRule['matchPath'](['*'], ['a', 'b'])).toBe(true);
    expect(HostNameRule['matchPath'](['a', '*'], ['a'])).toBe(false);
    expect(HostNameRule['matchPath'](['a', '*'], ['a', 'b'])).toBe(true);
});
