#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  validateUsername,
  getUsernamePrice,
} from "../functions/wombat-usernames.js";

assert.deepEqual(validateUsername(" Tiffany.Hill "), {
  ok: true,
  username: "tiffany-hill",
});

const th = getUsernamePrice("TH");
assert.equal(th.username, "th");
assert.equal(th.priceCents, 0);
assert.equal(th.claimableByPublic, false);
assert.equal(th.reservation.reservedFor, "Tiffany Hill");

assert.equal(getUsernamePrice("teacher").priceCents, 0);
assert.equal(getUsernamePrice("teach").priceCents, 500);
assert.equal(getUsernamePrice("math").priceCents, 1500);
assert.equal(getUsernamePrice("abc").priceCents, 4900);
assert.equal(getUsernamePrice("rw").priceCents, 14900);
assert.equal(getUsernamePrice("x").claimableByPublic, false);

console.log("LinkWombat username policy tests passed.");
