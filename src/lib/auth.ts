export const AUTH_COOKIE_NAME = "meanchey-auth";

export type AuthCompany = {
    id: number;
    name: string;
};

export type AuthSession = {
    loginToken: string;
    userTypeId: number;
    isEmployer: boolean;
    displayName?: string;
    email?: string;
    companyId?: number;
    companies?: AuthCompany[];
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null;
};

const firstString = (value: Record<string, unknown>, keys: string[]): string => {
    for (const key of keys) {
        const candidate = value[key];
        if (typeof candidate === "string" && candidate.trim().length > 0) {
            return candidate;
        }
    }

    return "";
};

const firstNumber = (value: Record<string, unknown>, keys: string[]): number => {
    for (const key of keys) {
        const candidate = value[key];
        const parsed =
            typeof candidate === "number"
                ? candidate
                : typeof candidate === "string"
                    ? Number(candidate)
                    : Number.NaN;

        if (Number.isFinite(parsed) && parsed > 0) {
            return parsed;
        }
    }

    return 0;
};

const firstRecordFromArray = (value: unknown): Record<string, unknown> | null => {
    if (!Array.isArray(value) || value.length === 0) {
        return null;
    }

    return isRecord(value[0]) ? value[0] : null;
};

export const parseAuthSession = (value: string | undefined | null): AuthSession | null => {
    if (!value) {
        return null;
    }

    try {
        const parsed = JSON.parse(value) as unknown;
        if (!isRecord(parsed)) {
            return null;
        }

        const loginToken = firstString(parsed, ["loginToken", "login_token", "token"]);
        if (!loginToken) {
            return null;
        }

        const userTypeId = firstNumber(parsed, ["userTypeId", "user_type_id"]);
        const companyId = firstNumber(parsed, ["companyId", "company_id", "cid"]);

        return {
            loginToken,
            userTypeId,
            isEmployer:
                Number(parsed.isEmployer) === 1 || parsed.isEmployer === true || userTypeId === 1,
            displayName: firstString(parsed, ["displayName", "display_name", "name"]),
            email: firstString(parsed, ["email"]),
            companyId: companyId > 0 ? companyId : undefined,
            companies: parseCompanyList(parsed.companies ?? parsed.my_company ?? parsed.myCompany ?? parsed.company),
        };
    } catch {
        return null;
    }
};

export const serializeAuthSession = (session: AuthSession): string => {
    return JSON.stringify(session);
};

export const getAuthSessionFromCookieValue = (
    value: string | undefined | null,
): AuthSession | null => {
    return parseAuthSession(value);
};

export const getFirstRecord = (value: unknown): Record<string, unknown> | null => {
    if (isRecord(value)) {
        if (isRecord(value.data)) {
            return value.data;
        }

        const arrayRecord = firstRecordFromArray(value.data);
        if (arrayRecord) {
            return arrayRecord;
        }

        return value;
    }

    return firstRecordFromArray(value);
};

export const getStringValue = (value: Record<string, unknown>, keys: string[]): string => {
    return firstString(value, keys);
};

export const getNumberValue = (value: Record<string, unknown>, keys: string[]): number => {
    return firstNumber(value, keys);
};

export const isEmployerLabel = (value: string): boolean => {
    const normalized = value.trim().toLowerCase();

    if (!normalized) {
        return false;
    }

    if (normalized.includes("job seeker") || normalized.includes("jobseeker")) {
        return false;
    }

    return (
        normalized.includes("employer") ||
        normalized.includes("company") ||
        normalized.includes("business") ||
        normalized.includes("owner") ||
        normalized.includes("admin")
    );
};

export const getRoleLabel = (value: Record<string, unknown>, keys: string[]): string => {
    return firstString(value, keys);
};

export const resolveEmployerFlag = (
    profileRecord: Record<string, unknown>,
    loginRecord?: Record<string, unknown> | null,
): boolean => {
    const userTypeId = getNumberValue(profileRecord, ["user_type_id", "userTypeId"]);
    if (userTypeId === 1) {
        return true;
    }

    const roleLabels = [
        getRoleLabel(profileRecord, ["userType", "user_type", "usertype", "role"]),
        loginRecord ? getRoleLabel(loginRecord, ["userType", "user_type", "usertype", "role"]) : "",
    ];

    if (roleLabels.some((label) => isEmployerLabel(label))) {
        return true;
    }

    const companyId = getCompanyId(profileRecord);
    return companyId > 0;
};

export const getCompanyId = (profile: Record<string, unknown>): number => {
    const companies = [profile.my_company, profile.myCompany, profile.company, profile.companies];

    for (const candidate of companies) {
        const record = getFirstRecord(candidate);
        if (!record) {
            continue;
        }

        const companyId = getNumberValue(record, ["id", "company_id", "cid"]);
        if (companyId > 0) {
            return companyId;
        }
    }

    return 0;
};

const parseCompanyList = (value: unknown): AuthCompany[] => {
    const records = Array.isArray(value)
        ? value
        : isRecord(value)
            ? Array.isArray(value.my_company)
                ? value.my_company
                : Array.isArray(value.myCompany)
                    ? value.myCompany
                    : Array.isArray(value.company)
                        ? value.company
                        : []
            : [];

    return records
        .map((item) => {
            if (!isRecord(item)) {
                return null;
            }

            const id = getNumberValue(item, ["id", "company_id", "cid"]);
            const name = getStringValue(item, ["name", "title", "company_name", "display_name"]);

            if (id <= 0 || !name) {
                return null;
            }

            return { id, name } satisfies AuthCompany;
        })
        .filter((item): item is AuthCompany => Boolean(item));
};

export const getAuthCompanies = (profile: Record<string, unknown>): AuthCompany[] => {
    return parseCompanyList(profile.my_company ?? profile.myCompany ?? profile.companies ?? profile.company);
};
