# KVK API (Dutch Handelsregister) by CompanyData

[![npm](https://img.shields.io/npm/v/@companydata/kvk-api.svg)](https://www.npmjs.com/package/@companydata/kvk-api)

A small, typed TypeScript wrapper for looking up **Dutch company data from the KVK Handelsregister**: company names, full street addresses, phone, email, website, size and revenue, through one REST call.

This package is a thin convenience layer over the master [`@companydata/companydata-sdk`](https://github.com/companydatacom/companydata-sdk). It is the same API and the same key, with the country pinned to the Netherlands and a register-specific helper on top, so you can write `client.getByKvkNumber("30204462")` instead of assembling query parameters by hand.

> One schema, one key. Every CompanyData register wrapper returns records in the same shape, so moving from KVK to another country's register is a one-line change.

## At a glance

| | |
| --- | --- |
| Country | 🇳🇱 Netherlands (`countryCode: "NL"`) |
| Register | KVK Handelsregister |
| Businesses in CompanyData | 3.86M |
| With phone number | 1.13M |
| With email address | 1.86M |
| Lookup key | KVK number (8 digits, leading zeros kept) |
| Verified example | Mollie B.V., `30204462` |
| Live demo and comparison | [companydata.com/kvk-api](https://companydata.com/kvk-api/) |
| Official register | [developers.kvk.nl](https://developers.kvk.nl) |

Counts are from the live API on 2026-10-12 and grow over time.

## What is the KVK API?

KVK (Kamer van Koophandel) runs the Dutch **Handelsregister**, the official register of every business in the Netherlands. Its own API at [developers.kvk.nl](https://developers.kvk.nl) is good for looking up one company at a time and confirming it is registered.

What the official KVK API does **not** give you: no phone number, no email address, and no directors. It is also priced and rate-limited per lookup, which makes bulk or segmented use awkward.

**CompanyData adds the missing fields.** 3.86M Dutch businesses with full addresses, phone, email, website, directors and firmographics, filterable and exportable in bulk through one live REST API. Comparison and a live lookup: [companydata.com/kvk-api](https://companydata.com/kvk-api/).

## Installation

```bash
npm install @companydata/kvk-api
```

Get an API key at [app.companydata.com/signup-api](https://app.companydata.com/signup-api). Your first calls are free.

## Quickstart

```ts
import { KvkClient } from "@companydata/kvk-api";

const client = new KvkClient({
  auth: { type: "apiKey", apiKey: process.env.COMPANYDATA_API_KEY! }
});

// Look up one business by its KVK number.
const company = await client.getByKvkNumber("30204462"); // Mollie B.V.

// Search with filters (country is always NL here).
const page = await client.search({
  cityName: "AMSTERDAM",
  hasEmail: true,
  hasWebsite: true,
  page: 1,
  pageSize: 25
});
console.log(page.totalCount, page.records[0]?.["Company Name"]);
```

> **City and province names are UPPER CASE.** Filter on `cityName: "AMSTERDAM"`, not `"Amsterdam"` (which returns 0). The same goes for `provinceName: "NOORD-HOLLAND"`. List exact names per country with `GET /api/cities`. Full field and filter reference: [companydata.com/api-docs/request-company](https://companydata.com/api-docs/request-company/).

Run the full example against the live API with your key:

```bash
git clone https://github.com/companydatacom/kvk-api && cd kvk-api && npm install
COMPANYDATA_API_KEY=... npm run test:live
```

## What a record looks like

Every record is a flat object with human-readable keys. This is Mollie B.V. as returned by `getByKvkNumber`:

```json
{
  "Company Name": "Mollie B.V.",
  "Trade Name": null,
  "Company Registration Number": "30204462",
  "Address 1": "Keizersgracht 126",
  "Postal Code": "1015 CW",
  "City": "Amsterdam",
  "State/Province": "Noord-holland",
  "Country": "Netherlands",
  "Phone Number": "+3*****70",
  "Email": "*****@*****",
  "Website": "mollie.*****",
  "Founding Year": 2005,
  "Employees Total": 798,
  "Yearly Revenue in U.S. Dollars": 2195392,
  "Business Category Code 1 - Description": "Computer Related Services, Not Elsewhere Classified",
  "Business Legal Type - Description": "Corporation"
}
```

**Search is a preview, export is the full record.** `search` (and the lookup helper, which uses it) returns about 20 fields with phone, email and website masked as `*****`, and does not spend credits. `export`, `exportWithScroll` and `iterate` return the full record (about 35 fields, unmasked contact details, SIC and national industry codes, legal status, group structure) and spend one credit per company you have not exported before. Which fields are on a record depends on your key's configuration. See the [field reference](https://companydata.com/api-docs/request-company/) and [plans and credits](https://companydata.com/api-docs/authentication/).

## Methods

| Method | Returns | Does |
| --- | --- | --- |
| `client.search(params)` | `KvkPage` | Search Dutch businesses with filters. |
| `client.getByKvkNumber(id, scope?)` | `CompanyRecord \| null` | Fetch one business by KVK number. `scope` adds extra filters when a number is not unique. |
| `client.export(params)` | `KvkPage` | Export one page of results (standard pagination). |
| `client.exportWithScroll(params)` | `KvkScrollBatch` | One scroll batch (max 50 records). Pass `scrollId` back in for the next. |
| `client.iterate(params, { maxRecords })` | `AsyncGenerator<CompanyRecord>` | Streams every matching record across scroll batches. |
| `client.raw` | `ApiClient` | The underlying master SDK client, for anything not wrapped here. |
| `normalizeKvkId(id)` | `string` | The KVK number normalisation the lookup helper applies. |

```ts
interface KvkPage {
  records: CompanyRecord[];   // flat objects, keys like "Company Name", "City", "Email"
  totalCount: number;         // matches across all pages
  page: number;
  totalPages: number;
  pageSize: number;
}

interface KvkScrollBatch {
  records: CompanyRecord[];
  scrollId: string | null;    // pass back in to get the next batch
  hasMoreRecords: boolean;
  pageSize: number;
}
```

`params` is the master SDK's filter set with `countryCode` removed, because it is always `"NL"` here. For cross-border queries, use the master SDK directly.

### Lookup by KVK number

`getByKvkNumber` takes the 8-digit KVK number (KVK-nummer) from the Handelsregister. Spaces and dots are stripped and short numbers are left-padded with zeros, so `"6959 9084"` and `"69599084"` match the same company.

## Recipes

**Find a company by name, pinned to a city**

```ts
const { records, totalCount } = await client.search({
  search: "Mollie",
  cityName: "AMSTERDAM",
  pageSize: 5
});
```

**Build a segment: companies in a province with 50 or more employees**

```ts
const page = await client.search({
  provinceName: "NOORD-HOLLAND",
  employeesTotal: { min: 50 },
  hasPhone: true,
  pageSize: 100
});
```

**Stream a whole segment with scroll export**

```ts
for await (const company of client.iterate(
  { cityName: "AMSTERDAM", hasEmail: true },
  { maxRecords: 5000 }
)) {
  console.log(company["Company Name"], company["Email"]);
}
```

**Drive the scroll loop yourself**

```ts
let batch = await client.exportWithScroll({ cityName: "AMSTERDAM", hasEmail: true, pageSize: 50 });
while (batch.records.length > 0) {
  process(batch.records);
  if (!batch.hasMoreRecords || !batch.scrollId) break;
  batch = await client.exportWithScroll({ cityName: "AMSTERDAM", hasEmail: true, scrollId: batch.scrollId, pageSize: 50 });
}
```

**Anything else: drop to the master client**

```ts
const res = await client.raw.company.search({ countryCode: "DE", cityName: "BERLIN", pageSize: 10 });
```

### Common filters

| Filter | Example | Notes |
| --- | --- | --- |
| `search` | `"Mollie"` | Free text over company and trade names. |
| `nationalId` | `"30204462"` | Registration number. The lookup helper sets this for you. |
| `cityName` | `"AMSTERDAM"` | UPPER CASE. |
| `provinceName` | `"NOORD-HOLLAND"` | Admin-2 name, UPPER CASE (the record's `State/Province`). |
| `postalCode` | `"1015 CW"` | Exact match. |
| `hasEmail`, `hasPhone`, `hasWebsite` | `true` | Contact availability. |
| `employeesTotal`, `annualSales`, `foundingYears` | `{ min: 50, max: 500 }` | Range filters. |
| `sic4Digits` | `"7372"` | 4-digit SIC industry code. |

Full list: [companydata.com/api-docs/request-company](https://companydata.com/api-docs/request-company/).

## Four ways to integrate

Pick whichever fits how you build. All four hit the same data behind the same key.

1. **This register SDK** (`@companydata/kvk-api`): Dutch lookups with a KVK-specific helper. You are here.
2. **Master SDK** ([`@companydata/companydata-sdk`](https://github.com/companydatacom/companydata-sdk)): all 200+ countries in one typed client, keyed by `countryCode`.
3. **MCP server**: connect an AI agent (Claude, Cursor and others) to `https://companydata.com/mcp/` with your key in the `x-api-key` header. See [companydata-mcp-server](https://github.com/companydatacom/companydata-mcp-server).
4. **Raw REST**: call `GET https://app.companydata.com/api/company/search?countryCode=NL&cityName=AMSTERDAM` with an `x-api-key` header. Contract: [companydata.com/openapi.json](https://companydata.com/openapi.json).

```bash
curl -H "x-api-key: $COMPANYDATA_API_KEY" \
  "https://app.companydata.com/api/company/search?countryCode=NL&nationalId=30204462&pageSize=1"
```

## Error handling

Failed requests throw `ApiError` with the HTTP status. The client retries transient failures (429 and 5xx) with backoff before giving up.

```ts
import { ApiError } from "@companydata/kvk-api";

try {
  await client.search({ cityName: "AMSTERDAM" });
} catch (err) {
  if (err instanceof ApiError) {
    // 401: bad or missing key, 429: rate limited,
    // "Export credit limit exceeded" (code credits_limit_exceeded): export credits used up
    console.error(err.status, err.message);
  }
}
```

A scroll batch that is larger than your remaining credits is rejected as a whole, so keep `pageSize` small when a key is close to its limit.

## All register wrappers

Same pattern, one per official register. Every wrapper returns the same record shape.

| Country | Register | Package | Lookup helper |
| --- | --- | --- | --- |
| 🇳🇱 Netherlands | KVK | [`@companydata/kvk-api`](https://github.com/companydatacom/kvk-api) | `getByKvkNumber` |
| 🇩🇪 Germany | Handelsregister | [`@companydata/handelsregister-api`](https://github.com/companydatacom/handelsregister-api) | `getByRegistrationNumber` |
| 🇬🇧 United Kingdom | Companies House | [`@companydata/companies-house-api`](https://github.com/companydatacom/companies-house-api) | `getByCompanyNumber` |
| 🇫🇷 France | Sirene | [`@companydata/sirene-api`](https://github.com/companydatacom/sirene-api) | `getBySiret` |
| 🇧🇪 Belgium | KBO/BCE | [`@companydata/kbo-api`](https://github.com/companydatacom/kbo-api) | `getByEnterpriseNumber` |
| 🇵🇱 Poland | KRS | [`@companydata/krs-api`](https://github.com/companydatacom/krs-api) | `getByNip` |
| 🇸🇪 Sweden | Bolagsverket | [`@companydata/bolagsverket-api`](https://github.com/companydatacom/bolagsverket-api) | `getByOrgNumber` |
| 🇨🇭 Switzerland | Zefix | [`@companydata/zefix-api`](https://github.com/companydatacom/zefix-api) | `getByUid` |
| 🇨🇿 Czech Republic | ARES | [`@companydata/ares-api`](https://github.com/companydatacom/ares-api) | `getByIco` |
| 🇩🇰 Denmark | CVR | [`@companydata/cvr-api`](https://github.com/companydatacom/cvr-api) | `getByCvr` |
| 🇧🇷 Brazil | CNPJ | [`@companydata/cnpj-api`](https://github.com/companydatacom/cnpj-api) | `getByCnpj` |
| 🇦🇺 Australia | ABR | [`@companydata/abn-lookup-api`](https://github.com/companydatacom/abn-lookup-api) | `getByAbn` |
| 🇺🇸 United States | SEC EDGAR | [`@companydata/sec-edgar-api`](https://github.com/companydatacom/sec-edgar-api) | `getByRegistrationNumber` |

Plus the master SDK for every other country: [`@companydata/companydata-sdk`](https://github.com/companydatacom/companydata-sdk).

## License

MIT. Built and maintained by [CompanyData.com](https://companydata.com).
