import { Company } from "@/types/company";

const API_BASE_URL = process.env.MEANCHEY_API_BASE_URL;
const API_DEFAULT_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
};

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

/** Fetch all companies, sorted newest-first. */
export const getCompanies = async (
  limit = 100,
  offset = 0,
): Promise<Company[]> => {
  if (!API_BASE_URL) {
    return [];
  }

  try {
    const payload = await postApi(
      "/company/list",
      { limit, offset },
      "companies:list",
    );
    if (!payload) {
      return [];
    }
    return sortByNewest(extractCompanyArray(payload).map(mapApiCompany));
  } catch {
    return [];
  }
};

/** Search companies by text via /com/search, sorted newest-first. */
export const searchCompanies = async (text: string): Promise<Company[]> => {
  if (!API_BASE_URL) {
    return [];
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return getCompanies();
  }

  try {
    const payload = await postApi(
      "/com/search",
      { text: trimmed },
      "companies:search",
    );
    if (!payload) {
      return [];
    }
    return sortByNewest(extractCompanyArray(payload).map(mapApiCompany));
  } catch {
    return [];
  }
};
