#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(process.argv[2] || __dirname);
const firebasePath = path.join(root, "firebase.json");
const rcPath = path.join(root, ".firebaserc");

const readJson = (file, fallback) => {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
};

const writeJson = (file, value) => {
  const temporary = `${file}.patch25.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temporary, file);
};

if (!fs.existsSync(firebasePath)) {
  console.error(`firebase.json was not found at ${firebasePath}`);
  process.exit(1);
}

const firebase = readJson(firebasePath, {});
const hosting = Array.isArray(firebase.hosting)
  ? firebase.hosting
  : firebase.hosting
    ? [firebase.hosting]
    : [];

const dnwHosting = {
  target: "dnwilkinson",
  public: "sites/dnwilkinson",
  ignore: ["firebase.json", "**/.*", "**/node_modules/**"],
  cleanUrls: true,
  trailingSlash: false,
  headers: [
    {
      source: "**/*.@(jpg|jpeg|png|webp|svg|ico|woff|woff2)",
      headers: [{ key: "Cache-Control", value: "public,max-age=604800,immutable" }]
    },
    {
      source: "**/*.@(html|js|css|xml|txt|json|webmanifest)",
      headers: [{ key: "Cache-Control", value: "public,max-age=300,must-revalidate" }]
    },
    {
      source: "**",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ],
  redirects: [{ source: "/index.html", destination: "/", type: 301 }]
};

const existingIndex = hosting.findIndex((entry) => entry && entry.target === "dnwilkinson");
if (existingIndex >= 0) {
  hosting[existingIndex] = { ...hosting[existingIndex], ...dnwHosting };
} else {
  hosting.push(dnwHosting);
}
firebase.hosting = hosting;
writeJson(firebasePath, firebase);

const firebaserc = readJson(rcPath, { projects: {}, targets: {}, etags: {} });
firebaserc.projects = firebaserc.projects || {};
firebaserc.projects.default = firebaserc.projects.default || "shareshuffle-c7f96";
firebaserc.targets = firebaserc.targets || {};
firebaserc.targets["shareshuffle-c7f96"] = firebaserc.targets["shareshuffle-c7f96"] || {};
firebaserc.targets["shareshuffle-c7f96"].hosting = firebaserc.targets["shareshuffle-c7f96"].hosting || {};
firebaserc.targets["shareshuffle-c7f96"].hosting.dnwilkinson = ["dnwilkinson"];
firebaserc.etags = firebaserc.etags || {};
writeJson(rcPath, firebaserc);

console.log("Firebase configuration now includes hosting:dnwilkinson without replacing other targets.");
