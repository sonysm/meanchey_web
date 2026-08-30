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
    root.data,
    dataRoot?.list,
    dataRoot?.items,
    dataRoot?.companies,
    dataRoot?.results,
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
 * Fetch paginated companies list, sorted newest-first.
 * Fetches (pageSize + 1) items to cheaply detect the next page.
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
    // Fetch one extra to know if there's a next page
    const payload = await postApi(
      "/com/list",
      { limit: pageSize + 1, offset },
      "companies:list",
    );
    if (!payload) {
      return emptyPage(safePage, pageSize);
    }

    const allItems = sortByNewest(
      extractCompanyArray(payload).map(mapApiCompany),
    );
    const hasNext = allItems.length > pageSize;
    const data = hasNext ? allItems.slice(0, pageSize) : allItems;

    // We don't have a real total from the API; estimate from what we know.
    // If there's a next page, total is at least (offset + pageSize + 1).
    const knownMin = offset + data.length + (hasNext ? 1 : 0);
    const totalPages = hasNext ? safePage + 1 : safePage;

    return {
      data,
      total: knownMin,
      page: safePage,
      pageSize,
      totalPages,
      hasNext,
      hasPrev: safePage > 1,
    };
  } catch {
    return emptyPage(safePage, pageSize);
  }
};

/**
 * Search companies by text, paginated, sorted newest-first.
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
    // Search doesn't support offset in all backends; fetch extra and slice.
    const payload = await postApi(
      "/com/search",
      { text: trimmed, limit: pageSize * safePage + 1 },
      "companies:search",
    );
    if (!payload) {
      return emptyPage(safePage, pageSize);
    }

    const allItems = sortByNewest(
      extractCompanyArray(payload).map(mapApiCompany),
    );
    const pageItems = allItems.slice(offset, offset + pageSize);
    const hasNext = allItems.length > offset + pageSize;
    const knownMin = allItems.length;
    const totalPages = Math.max(safePage, Math.ceil(allItems.length / pageSize));

    return {
      data: pageItems,
      total: knownMin,
      page: safePage,
      pageSize,
      totalPages,
      hasNext,
      hasPrev: safePage > 1,
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
