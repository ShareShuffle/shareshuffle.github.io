const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const root = require("node:path").resolve(__dirname, "..");
const window = { location: { hostname: "shareshuffle.com" } };
window.window = window;
vm.runInNewContext(fs.readFileSync(`${root}/assets/link-check.js`, "utf8"), { window, URL });

const productUrl = "https://www.amazon.com/adidas-Court-Sneakers-Shoes-Casual/dp/B0ABC12345/ref=sw_img_d_ci_mcx_mr_huc_d_3?ref_=abc&qid=123";
const result = window.ShuffleLinkCheck.analyze(productUrl, { pageHost: "shareshuffle.com" });
assert.notEqual(result.health, "unsafe", "ordinary public Amazon product URLs must never default to unsafe");
assert.equal(result.health, "cleanable");
assert.equal(result.productId, "B0ABC12345");
assert.equal(new URL(result.suggestedUrl).searchParams.get("tag"), "shareshuffle-20");
assert.equal(new URL(result.suggestedUrl).searchParams.has("qid"), false);

const privateResult = window.ShuffleLinkCheck.analyze("https://www.amazon.com/gp/cart/view.html", { pageHost: "shareshuffle.com" });
assert.equal(privateResult.health, "unsafe", "private cart URLs must remain blocked");

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Missing function ${name}`);
  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  for (let i = bodyStart; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`Unclosed function ${name}`);
}

const appSource = fs.readFileSync(`${root}/app/index.html`, "utf8");
const titleContext = { URL };
vm.createContext(titleContext);
for (const name of ["neutralizeText", "cleanTitle", "titleFromProductUrl"]) {
  vm.runInContext(`${extractFunction(appSource, name)};this.${name}=${name};`, titleContext);
}
assert.equal(titleContext.titleFromProductUrl(productUrl), "Adidas Court Sneakers Shoes Casual");
assert.doesNotMatch(titleContext.titleFromProductUrl(productUrl), /^ref\b/i);

const functionsSource = fs.readFileSync(`${root}/functions/index.js`, "utf8");
const serverTitleContext = { URL };
vm.createContext(serverTitleContext);
for (const name of ["isBadAutoTitle", "cleanAutoTitle", "titleFromAmazonUrl", "titleFromRetailUrl"]) {
  vm.runInContext(`${extractFunction(functionsSource, name)};this.${name}=${name};`, serverTitleContext);
}
assert.equal(serverTitleContext.titleFromAmazonUrl(productUrl), "Adidas Court Sneakers Shoes Casual");
assert.equal(serverTitleContext.titleFromRetailUrl(productUrl), "Adidas Court Sneakers Shoes Casual");
assert.equal(serverTitleContext.cleanAutoTitle("Ref=sw_img_d_ci_mcx_mr_huc_d_3"), "");

console.log("link-check-title tests passed");
