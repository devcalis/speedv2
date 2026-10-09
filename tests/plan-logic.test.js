// node tests/plan-logic.test.js
const assert = require('node:assert');
const { recommend } = require('../assets/js/plan-logic.js');

assert.equal(recommend({ people: 2 }).key, 'f500');
assert.equal(recommend({ people: 2, uses: ['4k', 'office'] }).key, 'f700');
assert.equal(recommend({ people: 4, uses: ['4k'] }).key, 'f700');
assert.equal(recommend({ people: 4, uses: ['4k', 'office'] }).key, 'f800');
assert.equal(recommend({ people: 5, uses: ['4k', 'office', 'devices'] }).key, 'f1000');
assert.equal(recommend({ people: 4, uses: ['games'] }).key, 'g750');
assert.equal(recommend({ people: 5, uses: ['games'] }).key, 'g1000');
assert.equal(recommend({ people: 2, tv: true }).key, 'c500');
assert.equal(recommend({ people: 4, tv: true }).key, 'c700');
assert.equal(recommend({ people: 2, uses: ['games'], tv: true }).key, 'c1000');
assert.ok(recommend({ people: 4 }).price && recommend({ people: 4 }).why);

console.log('plan-logic ok');
