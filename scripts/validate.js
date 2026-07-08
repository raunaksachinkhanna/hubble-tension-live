#!/usr/bin/env node
// Validates data/measurements.json against the project schema.
// Plain Node, no dependencies. Run with: node scripts/validate.js

const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "data", "measurements.json");
const REQUIRED_FIELDS = [
  "id",
  "value",
  "uncertainty_plus",
  "uncertainty_minus",
  "method",
  "technique",
  "family",
  "collaboration",
  "year",
  "arxiv",
  "notes",
];
const ALLOWED_FAMILIES = ["early_universe", "late_universe"];
const ARXIV_PATTERN = /^\d{4}\.\d{4,5}(v\d+)?$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function fail(errors) {
  console.error(`Validation failed with ${errors.length} error(s):`);
  for (const err of errors) console.error(`  - ${err}`);
  process.exit(1);
}

let raw;
try {
  raw = fs.readFileSync(DATA_PATH, "utf8");
} catch (err) {
  fail([`Could not read ${DATA_PATH}: ${err.message}`]);
}

let data;
try {
  data = JSON.parse(raw);
} catch (err) {
  fail([`${DATA_PATH} is not valid JSON: ${err.message}`]);
}

const errors = [];

if (typeof data.last_updated !== "string" || !ISO_DATE_PATTERN.test(data.last_updated)) {
  errors.push(`top-level "last_updated" must be an ISO date string (YYYY-MM-DD)`);
}

if (!Array.isArray(data.measurements)) {
  fail([`top-level "measurements" must be an array`, ...errors]);
}

data.measurements.forEach((entry, index) => {
  const label = entry && entry.id ? entry.id : `entry at index ${index}`;

  for (const field of REQUIRED_FIELDS) {
    if (!(field in entry)) {
      errors.push(`${label}: missing required field "${field}"`);
    }
  }

  if ("uncertainty_plus" in entry) {
    if (typeof entry.uncertainty_plus !== "number" || !(entry.uncertainty_plus > 0)) {
      errors.push(`${label}: "uncertainty_plus" must be a positive number`);
    }
  }

  if ("uncertainty_minus" in entry) {
    if (typeof entry.uncertainty_minus !== "number" || !(entry.uncertainty_minus > 0)) {
      errors.push(`${label}: "uncertainty_minus" must be a positive number`);
    }
  }

  if ("value" in entry && typeof entry.value !== "number") {
    errors.push(`${label}: "value" must be a number`);
  }

  if ("year" in entry && typeof entry.year !== "number") {
    errors.push(`${label}: "year" must be a number`);
  }

  if ("family" in entry && !ALLOWED_FAMILIES.includes(entry.family)) {
    errors.push(
      `${label}: "family" must be one of ${ALLOWED_FAMILIES.join(", ")} (got "${entry.family}")`
    );
  }

  if ("arxiv" in entry && !ARXIV_PATTERN.test(entry.arxiv)) {
    errors.push(`${label}: "arxiv" does not match an arXiv ID pattern (got "${entry.arxiv}")`);
  }
});

if (errors.length > 0) {
  fail(errors);
}

console.log(`OK: ${data.measurements.length} measurement(s) validated.`);
