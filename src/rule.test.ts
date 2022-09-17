import { Rule } from './rule';

console.assert(Rule.matchHostname('d', 'c.d') === true);
console.assert(Rule.matchHostname('d', 'a.b.c.d') === true);
console.assert(Rule.matchHostname('c.d', 'a.b.c.d') === true);
console.assert(Rule.matchHostname('d', 'd') === true);
console.assert(Rule.matchHostname('a', 'd') === false);
console.assert(Rule.matchHostname('a.d', 'b.d') === false);
console.assert(Rule.matchHostname('c.d', 'd') === false);
