#!/usr/bin/env node
"use strict";
const { decode } = require("../result-code.js");
try {
  const result = decode(process.argv[2]);
  console.log(JSON.stringify(result, null, 2));
} catch {
  console.error("Nieprawidłowy kod: format, suma kontrolna lub dane wyniku.");
  process.exitCode = 1;
}
