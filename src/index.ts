/**
 * @companydata/kvk-api
 *
 * A thin, typed convenience wrapper around the CompanyData API for the Dutch
 * Handelsregister (KVK). It is not a separate API: it is the same
 * `@companydata/companydata-sdk` client with the country pinned to the
 * Netherlands and a few KVK-specific helpers on top, so you can write
 * `kvk.getByKvkNumber("69599084")` instead of remembering query parameters.
 *
 * One schema, one key across every CompanyData register. Swap this package for
 * another register wrapper (for example `@companydata/handelsregister-api`) and
 * the shape of what you get back does not change.
 */

import {
  ApiClient,
  type ApiClientConfig,
  type CompanyExportParams,
  type CompanyExportScrollResponse,
  type CompanyExportStandardResponse,
  type CompanySearchParams,
  type CompanySearchResponse,
  type RequestOptions
} from "@companydata/companydata-sdk";

/** ISO country code this wrapper is pinned to. */
export const COUNTRY_CODE = "NL" as const;

/**
 * Parameters accepted by this wrapper. Identical to the master SDK's, minus
 * `countryCode`, which is always "NL" and cannot be overridden here. Use the
 * master SDK directly if you need cross-border queries.
 */
export type KvkSearchParams = Omit<CompanySearchParams, "countryCode">;
export type KvkExportParams = Omit<CompanyExportParams, "countryCode">;

export interface KvkClientConfig extends Omit<ApiClientConfig, never> {}

/**
 * Client for Dutch company data from the KVK Handelsregister.
 *
 * ```ts
 * const kvk = new KvkClient({ auth: { type: "apiKey", apiKey: process.env.COMPANYDATA_API_KEY! } });
 * const company = await kvk.getByKvkNumber("69599084");
 * const page = await kvk.search({ cityName: "Amsterdam", hasEmail: true });
 * ```
 */
export class KvkClient {
  private readonly api: ApiClient;

  constructor(config: KvkClientConfig) {
    this.api = new ApiClient(config);
  }

  /** Search Dutch businesses. `countryCode` is fixed to "NL". */
  search(params: KvkSearchParams = {}, options?: RequestOptions): Promise<CompanySearchResponse> {
    return this.api.company.search({ ...params, countryCode: COUNTRY_CODE }, options);
  }

  /**
   * Look up a single business by its KVK number (KVK-nummer), the 8-digit
   * identifier from the Handelsregister. Returns the first matching record, or
   * `null` if none is found.
   */
  async getByKvkNumber(kvkNumber: string, options?: RequestOptions): Promise<Record<string, unknown> | null> {
    const clean = kvkNumber.replace(/\s+/g, "");
    const response = await this.api.company.search(
      { nationalId: clean, countryCode: COUNTRY_CODE, pageSize: 1 },
      options
    );
    const records = Array.isArray(response.data)
      ? response.data
      : (response.data?.records ?? []);
    return records[0] ?? null;
  }

  /** Export a page of Dutch businesses (standard pagination). */
  export(params: KvkExportParams = {}, options?: RequestOptions): Promise<CompanyExportStandardResponse> {
    return this.api.company.export({ ...params, countryCode: COUNTRY_CODE }, options);
  }

  /** Export in scroll mode, for pulling large result sets page by page. */
  exportWithScroll(
    params: Omit<KvkExportParams, "useScroll"> = {},
    options?: RequestOptions
  ): Promise<CompanyExportScrollResponse> {
    return this.api.company.exportWithScroll({ ...params, countryCode: COUNTRY_CODE }, options);
  }

  /** Escape hatch: the underlying master SDK client, for anything not wrapped here. */
  get raw(): ApiClient {
    return this.api;
  }
}

/** Convenience factory, if you prefer a function to `new`. */
export function createKvkClient(config: KvkClientConfig): KvkClient {
  return new KvkClient(config);
}

export { ApiError } from "@companydata/companydata-sdk";
export type {
  ApiClientConfig,
  CompanyExportScrollResponse,
  CompanyExportStandardResponse,
  CompanyRecord,
  CompanySearchResponse,
  RequestOptions
} from "@companydata/companydata-sdk";
