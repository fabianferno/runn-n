#!/usr/bin/env node

import { populateDatabase } from "./populate-chennai-data";

console.log("🏃 Chennai Runners Database Population Script");
console.log("=============================================");
console.log("");

populateDatabase()
  .then(() => {
    console.log("🎉 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
