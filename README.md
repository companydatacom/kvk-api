# KVK API (Dutch Handelsregister) by CompanyData

[![npm](https://img.shields.io/npm/v/@companydata/kvk-api.svg)](https://www.npmjs.com/package/@companydata/kvk-api)

A small, typed TypeScript wrapper for looking up **Dutch company data from the KVK Handelsregister**: company names, full street addresses, contacts, directors and more, through one REST call.

This package is a thin convenience layer over the master [`@companydata/companydata-sdk`](https://github.com/companydatacom/companydata-sdk). It is the same API and the same key, with the country pinned to the Netherlands and a few KVK-specific helpers on top, so you can write `kvk.getByKvkNumber("69599084")` instead of assembling query parameters by hand.

> One schema, one key. Every CompanyData register wrapper returns records in the same shape, so moving from the Dutch KVK to the German Handelsregister or the UK Companies House is a one-line change.

## What is the KVK API?

KVK (Kamer van Koophandel) runs the Dutch **Handelsregister**, the official register of every business in the Netherlands. Its own API at [developers.kvk.nl](https://developers.kvk.nl) is good for looking up one company at a time and confirming it is registered.

What the official KVK API does **not** give you: no phone number, no email address, and no directors. It is also priced and rate-limited per lookup, which makes bulk or segmented use awkward.

**CompanyData adds the missing fields.** You get 3.8M Dutch businesses with full addresses, phone, email, website, directors and firmographics, filterable and exportable in bulk through one live REST API. Full comparison and a live lookup: [companydata.com/kvk-api](https://companydata.com/kvk-api/).

## Installation

```bash
npm install @companydata/kvk-api
```

Get an API key at [app.companydata.com/signup-api](https://app.companydata.com/signup-api). Your first calls are free.

## Quickstart

```ts
import { KvkClient } from "@companydata/kvk-api";

const kvk = new KvkClient({
  auth: { type: "apiKey", apiKey: process.env.COMPANYDATA_API_KEY! }
});

// Look up one business by its KVK number (KVK-nummer).
const company = await kvk.getByKvkNumber("69599084");

// Search with filters (country is always NL here).
const page = await kvk.search({
  cityName: "Amsterdam",
  hasEmail: true,
  page: 1,
  pageSize: 25
});
console.log(page.data);
```

## Methods

| Method | Does |
| --- | --- |
| `kvk.search(params)` | Search Dutch businesses with filters. |
| `kvk.getByKvkNumber(kvkNumber)` | Fetch one business by its 8-digit KVK number, or `null`. |
| `kvk.export(params)` | Export a page of results (standard pagination). |
| `kvk.exportWithScroll(params)` | Export large sets page by page in scroll mode. |
| `kvk.raw` | The underlying master SDK client, for anything not wrapped here. |

`params` is the master SDK's filter set (`cityName`, `provinceName`, `postalCode`, `nationalId`, `hasEmail`, `hasPhone`, `hasWebsite`, employee and sales ranges, and more) with `countryCode` removed, because it is always `"NL"` in this package. For cross-border queries, use the master SDK directly.

## Four ways to integrate

Pick whichever fits how you build. All four hit the same data behind the same key.

1. **This register SDK** (`@companydata/kvk-api`) — Dutch lookups with KVK-specific helpers. You are here.
2. **Master SDK** ([`@companydata/companydata-sdk`](https://github.com/companydatacom/companydata-sdk)) — all 200+ countries in one typed client, keyed by `countryCode`.
3. **MCP server** — connect an AI agent (Claude, Cursor, and others) to `https://companydata.com/mcp/` with your key in the `x-api-key` header. See [companydata-mcp-server](https://github.com/companydatacom/companydata-mcp-server).
4. **Raw REST** — call `GET https://companydata.com/api/company/search?countryCode=NL&...` directly. Contract: [companydata.com/openapi.json](https://companydata.com/openapi.json).

## Error handling

```ts
import { ApiError } from "@companydata/kvk-api";

try {
  await kvk.getByKvkNumber("69599084");
} catch (err) {
  if (err instanceof ApiError) {
    console.error(err.status, err.message);
  }
}
```

## Related register wrappers

Same pattern, one per official register: Germany (`handelsregister-api`), United Kingdom (`companies-house-api`), France (`sirene-api`), Belgium (`kbo-api`), and more. See the [CompanyData GitHub org](https://github.com/companydatacom) for the full list.

## License

MIT. Built and maintained by [CompanyData.com](https://companydata.com).
