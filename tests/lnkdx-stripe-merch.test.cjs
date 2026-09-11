const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "functions/index.js"), "utf8");

function extractFunction(input, name) {
  const start = input.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Missing function ${name}`);
  const signatureEnd = input.indexOf(") {", start);
  const bodyStart = signatureEnd >= 0 ? signatureEnd + 2 : input.indexOf("{", start);
  let depth = 0;
  for (let i = bodyStart; i < input.length; i += 1) {
    if (input[i] === "{") depth += 1;
    if (input[i] === "}") depth -= 1;
    if (depth === 0) return input.slice(start, i + 1);
  }
  throw new Error(`Unclosed function ${name}`);
}

const context = {
  URL,
  Buffer,
  crypto,
  LNKDX_FOUNDING_LIMIT: 100,
  LNKDX_FOUNDING_PRICE_CENTS: 4900,
  LNKDX_STANDARD_PRICE_CENTS: 7900,
  LNKDX_MIXED_FOUNDING_PRICE_CENTS: 2450,
  LNKDX_MIXED_STANDARD_PRICE_CENTS: 3950
};
vm.createContext(context);
for (const name of [
  "normalizeLnkdxParkSlug",
  "normalizeLnkdxLinkedInUrl",
  "lnkdxParkClass",
  "lnkdxPriceFromCounts",
  "verifyLnkdxStripeSignature"
]) {
  vm.runInContext(`${extractFunction(source, name)};this.${name}=${name};`, context);
}

assert.equal(context.normalizeLnkdxParkSlug(" a1 "), "A1");
assert.equal(context.normalizeLnkdxParkSlug("ABC"), "");
assert.equal(context.normalizeLnkdxLinkedInUrl("https://linkedin.com/in/rcwx?trk=test"), "https://www.linkedin.com/in/rcwx/");
assert.equal(context.normalizeLnkdxLinkedInUrl("https://example.com/in/rcwx"), "");
assert.equal(context.lnkdxParkClass("AB"), "premium");
assert.equal(context.lnkdxParkClass("11"), "premium");
assert.equal(context.lnkdxParkClass("A1"), "mixed");
assert.equal(context.lnkdxParkClass("1A"), "mixed");
assert.equal(context.lnkdxPriceFromCounts({ foundingPaidCount: 0, foundingHeldCount: 0 }, "AB").amountCents, 4900);
assert.equal(context.lnkdxPriceFromCounts({ foundingPaidCount: 0, foundingHeldCount: 0 }, "A1").amountCents, 2450);
assert.equal(context.lnkdxPriceFromCounts({ foundingPaidCount: 100, foundingHeldCount: 0 }, "AB").amountCents, 7900);
assert.equal(context.lnkdxPriceFromCounts({ foundingPaidCount: 99, foundingHeldCount: 1 }, "A1").amountCents, 3950);

const payload = JSON.stringify({ id: "evt_test", type: "checkout.session.completed" });
const secret = "whsec_test_secret";
const timestamp = 1_800_000_000;
const signature = crypto.createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
assert.equal(context.verifyLnkdxStripeSignature(Buffer.from(payload), `t=${timestamp},v1=${signature}`, secret, timestamp), true);
assert.equal(context.verifyLnkdxStripeSignature(Buffer.from(payload), `t=${timestamp},v1=${"0".repeat(64)}`, secret, timestamp), false);
assert.equal(context.verifyLnkdxStripeSignature(Buffer.from(payload), `t=${timestamp - 301},v1=${signature}`, secret, timestamp), false);

const merch = JSON.parse(fs.readFileSync(path.join(root, "merch/butch-shirts.json"), "utf8"));
const byId = Object.fromEntries(merch.products.map(product => [product.id, product]));
assert.equal(byId["butch-birthday-donkey"].asin, "B0H968Y4DP");
assert.equal(byId["butch-movie-star-dog"].asin, "B0H98Q41TW");
assert.equal(byId["butch-mirror-pig"].asin, "B0H96JQMF9");
assert.equal(byId["butch-museum-shop"].status, "live");
assert.equal(merch.products.every(product => product.status === "live" && product.rightsStatus === "approved"), true);

const lnkdxHtml = fs.readFileSync(path.join(root, "sites/lnkdx/index.html"), "utf8");
for (const required of ["$49/year", "$24.50/year", "/api/park-availability", "/api/park-checkout", "/api/park-finalize", "/terms", "/privacy"]) {
  assert.ok(lnkdxHtml.includes(required), `LNKDX page missing ${required}`);
}
assert.ok(!lnkdxHtml.includes("The public claiming system is coming soon."), "LNKDX unclaimed Park copy should not say claiming is coming soon");

console.log("LNKDX Stripe and Butch merch tests passed");
