# Changelog

## 0.2.0

- `search` and `export` now return a flat `KvkPage` (`records`, `totalCount`, `page`, `totalPages`, `pageSize`) instead of the raw API envelope.
- `exportWithScroll` now returns a `KvkScrollBatch` with `scrollId` and `hasMoreRecords` read from the API's `meta` block (the raw envelope has no top-level `scrollId`, so the 0.1.0 loop example never advanced).
- New `iterate()` async generator that streams a whole result set across scroll batches, with an optional `maxRecords` cap.
- `getByKvkNumber` normalises its input (`normalizeKvkId`) and accepts a `scope` of extra filters.
- README rewritten with live-verified examples, a sample record, recipes and known limitations. `examples/quickstart.ts` doubles as a live smoke test (`npm run test:live`).

## 0.1.0

- Initial release. `KvkClient` wrapper over `@companydata/companydata-sdk`, pinned to the Netherlands.
- `search`, lookup helper, `export`, `exportWithScroll`, and a `raw` escape hatch to the master client.
