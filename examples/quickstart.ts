/**
 * Run with: COMPANYDATA_API_KEY=... npx tsx examples/quickstart.ts
 * Get a key at https://app.companydata.com/signup-api
 */
import { KvkClient } from "../src/index";

const kvk = new KvkClient({
  auth: { type: "apiKey", apiKey: process.env.COMPANYDATA_API_KEY! }
});

// 1. Look up one business by its KVK number.
const company = await kvk.getByKvkNumber("69599084");
console.log("By KVK number:", company);

// 2. Search Dutch businesses with filters.
const page = await kvk.search({
  cityName: "Amsterdam",
  hasEmail: true,
  hasWebsite: true,
  page: 1,
  pageSize: 25
});
console.log("Search results:", page.data);

// 3. Pull a large set in scroll mode.
let batch = await kvk.exportWithScroll({ provinceName: "Noord-Holland", pageSize: 1000 });
let total = 0;
while (batch.data.length > 0) {
  total += batch.data.length;
  if (!batch.scrollId) break;
  batch = await kvk.exportWithScroll({ scrollId: batch.scrollId, pageSize: 1000 });
}
console.log("Exported records:", total);
