#!/usr/bin/env node
const assert = require("assert");
const policy = require("../functions/wombat-usernames");

assert.deepStrictEqual(policy.validateUsername(" Tiffany.Hill "), {
  ok: true,
  username: "tiffany-hill",
});

const th = policy.getUsernamePrice("TH");
assert.equal(th.username, "th");
assert.equal(th.priceCents, 0);
assert.equal(th.claimableByPublic, false);
assert.equal(th.reservation.reservedFor, "Tiffany Hill");

assert.equal(policy.getUsernamePrice("teacher").priceCents, 0);
assert.equal(policy.getUsernamePrice("teach").priceCents, 500);
assert.equal(policy.getUsernamePrice("math").priceCents, 1500);
assert.equal(policy.getUsernamePrice("abc").priceCents, 4900);
assert.equal(policy.getUsernamePrice("rw").priceCents, 14900);
assert.equal(policy.getUsernamePrice("x").claimableByPublic, false);

console.log("LinkWombat username policy tests passed.");
