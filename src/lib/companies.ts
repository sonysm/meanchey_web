import { Company } from "@/types/company";

const API_BASE_URL = process.env.MEANCHEY_API_BASE_URL;
const API_DEFAULT_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
};

export const COMPANIES_PAGE_SIZE = 15;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const postApi = async (
  path: string,
  body: Record<string, unknown>,
  cacheTag: string,
) => {
  if (!API_BASE_URL) {
    return null;
  }

  const url = new URL(path, API_BASE_URL);
  const response = await fetch(url.toString(), {
    method: "POST",
    next: { revalidate: 60, tags: [cacheTag] },
    headers: API_DEFAULT_HEADERS,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as unknown;
};

const mapApiCompany = (item: Record<string, unknown>): Company => {
  const id = String(item.id ?? item._id ?? "");
  const name = String(item.name ?? item.company_name ?? item.title ?? "Unknown");

  return {
    id,
    userId: item.user_id ? String(item.user_id) : undefined,
    name,
    nameKh:
      typeof item.nameKh === "string"
        ? item.nameKh
        : typeof item.name_kh === "string"
          ? item.name_kh
          : undefined,
    logo:
      typeof item.logo === "string" && item.logo
        ? item.logo
        : typeof item.logo_url === "string" && item.logo_url
          ? item.logo_url
          : undefined,
    description:
      typeof item.description === "string" ? item.description : undefined,
    website:
      typeof item.website === "string"
        ? item.website
        : typeof item.web === "string"
          ? item.web
          : undefined,
    phone:
      typeof item.phone === "string"
        ? item.phone
        : typeof item.tel === "string"
          ? item.tel
          : undefined,
    email: typeof item.email === "string" ? item.email : undefined,
    address:
      typeof item.address === "string"
        ? item.address
        : typeof item.location === "string"
          ? item.location
          : undefined,
    createdAt: String(
      item.createdAt ?? item.created_at ?? new Date().toISOString(),
    ),
    updatedAt: String(
      item.updatedAt ?? item.updated_at ?? new Date().toISOString(),
    ),
  };
};

const extractCompanyArray = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) {
    return payload.filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    );
  }

  if (typeof payload !== "object" || payload === null) {
    return [];
  }

  const root = payload as Record<string, unknown>;
  const dataRoot =
    typeof root.data === "object" && root.data !== null
      ? (root.data as Record<string, unknown>)
      : undefined;

  const candidates = [
    dataRoot?.list,
    dataRoot?.items,
    dataRoot?.companies,
    dataRoot?.results,
    root.data,
    root.items,
    root.companies,
    root.results,
    root.list,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(
        (item): item is Record<string, unknown> =>
          typeof item === "object" && item !== null,
      );
    }
  }

  return [];
};

/**
 * Extract totalResults from the API response.
 * The API returns: { data: { totalResults: N, list: [...] } }
 */
const extractTotal = (payload: unknown): number => {
  if (!isRecord(payload)) return 0;
  const data = isRecord(payload.data) ? payload.data : payload;
  const raw = data.totalResults ?? data.total_results ?? data.totalRecord ?? data.total;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** Sort companies newest-first by createdAt. */
const sortByNewest = (companies: Company[]): Company[] =>
  [...companies].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

export type CompanyPage = {
  data: Company[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

/**
 * Fetch paginated companies list using /com/jlist.
 *
 * WHY /com/jlist instead of /com/list:
 *   - /com/list filters out companies with no active job posts (SQL WHERE count > 0)
 *     so many companies are silently excluded.
 *   - /com/jlist returns ALL companies regardless of job posts and
 *     also returns the correct totalResults count.
 *
 * The API natively supports limit + offset so we delegate pagination to it.
 */
export const getCompanies = async (
  page = 1,
  pageSize = COMPANIES_PAGE_SIZE,
): Promise<CompanyPage> => {
  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * pageSize;

  if (!API_BASE_URL) {
    return emptyPage(safePage, pageSize);
  }

  try {
    const payload = await postApi(
      "/com/jlist",
      { limit: pageSize, offset },
      "companies:list",
    );
    if (!payload) {
      return emptyPage(safePage, pageSize);
    }

    const data = sortByNewest(extractCompanyArray(payload).map(mapApiCompany));
    const total = extractTotal(payload);
    const totalPages = total > 0 ? Math.ceil(total / pageSize) : safePage + (data.length === pageSize ? 1 : 0);
    const hasNext = total > 0 ? safePage < totalPages : data.length === pageSize;
    const hasPrev = safePage > 1;

    return {
      data,
      total,
      page: safePage,
      pageSize,
      totalPages,
      hasNext,
      hasPrev,
    };
  } catch {
    return emptyPage(safePage, pageSize);
  }
};

/**
 * Search companies by text via /com/search, paginated, sorted newest-first.
 *
 * The search endpoint supports limit + offset natively and returns totalResults.
 * Note: /com/search uses a different DB connection and filters by country_code.
 */
export const searchCompanies = async (
  text: string,
  page = 1,
  pageSize = COMPANIES_PAGE_SIZE,
): Promise<CompanyPage> => {
  const trimmed = text.trim();
  if (!trimmed) {
    return getCompanies(page, pageSize);
  }

  if (!API_BASE_URL) {
    return emptyPage(page, pageSize);
  }

  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * pageSize;

  try {
    const payload = await postApi(
      "/com/search",
      { text: trimmed, limit: pageSize, offset },
      "companies:search",
    );
    if (!payload) {
      return emptyPage(safePage, pageSize);
    }

    const data = sortByNewest(extractCompanyArray(payload).map(mapApiCompany));
    const total = extractTotal(payload);
    const totalPages = total > 0 ? Math.ceil(total / pageSize) : safePage + (data.length === pageSize ? 1 : 0);
    const hasNext = total > 0 ? safePage < totalPages : data.length === pageSize;
    const hasPrev = safePage > 1;

    return {
      data,
      total,
      page: safePage,
      pageSize,
      totalPages,
      hasNext,
      hasPrev,
    };
  } catch {
    return emptyPage(safePage, pageSize);
  }
};

const emptyPage = (page: number, pageSize: number): CompanyPage => ({
  data: [],
  total: 0,
  page,
  pageSize,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
});

/**
 * Delete a company (soft-delete).
 * Requires the user's login token.
 */
export const deleteCompany = async (id: string, loginToken: string): Promise<boolean> => {
  if (!API_BASE_URL) return false;

  try {
    const payload = await postApi(
      "/com-del",
      { id, login_token: loginToken },
      "companies:delete"
    );
    // Based on standard meanchey-api response, error_code 0 is success
    const result = payload as { error_code?: number };
    return result?.error_code === 0;
  } catch {
    return false;
  }
};

/**
 * Fetch a single company by ID.
 * /com/get endpoint natively returns the company detail.
 */
export const getCompanyById = async (id: string): Promise<Company | null> => {
  if (!API_BASE_URL) return null;

  try {
    const payload = await postApi(
      "/com/get",
      { id },
      `company:${id}`
    );
    if (!payload) return null;

    // Based on standard API structure, data might be nested
    const root = payload as any;
    const data = root.data || root;
    if (!data || Object.keys(data).length === 0) return null;

    return mapApiCompany(data);
  } catch {
    return null;
  }
};
