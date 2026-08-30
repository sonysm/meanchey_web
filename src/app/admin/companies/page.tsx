import {
  getCompanies,
  searchCompanies,
  COMPANIES_PAGE_SIZE,
} from "@/lib/companies";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2 } from "lucide-react";
import { CompaniesSearch } from "@/components/admin/CompaniesSearch";
import { CompaniesPagination } from "@/components/admin/CompaniesPagination";
import DeleteCompanyButton from "@/components/admin/DeleteCompanyButton";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, parseAuthSession } from "@/lib/auth";

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const { q, page: pageParam } = await searchParams;
  const query = q?.trim() ?? "";
  const page = Math.max(1, Number(pageParam) || 1);

  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = sessionValue ? parseAuthSession(sessionValue) : null;
  const currentUserId = session?.userId ? String(session.userId) : null;

  const result = query
    ? await searchCompanies(query, page, COMPANIES_PAGE_SIZE)
    : await getCompanies(page, COMPANIES_PAGE_SIZE);

  const { data: companies, total, hasNext, hasPrev, totalPages } = result;

  // Row range for "Showing X–Y of Z" label
  const offset = (page - 1) * COMPANIES_PAGE_SIZE;
  const rowFrom = companies.length === 0 ? 0 : offset + 1;
  const rowTo = offset + companies.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Companies</h1>
        <p className="text-muted-foreground text-sm mt-1">
          All registered companies, sorted by latest
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-base">
            {query
              ? `Results for "${query}"`
              : "All Companies"}
          </CardTitle>
          {/* Suspense required: CompaniesSearch reads useSearchParams */}
          <Suspense>
            <CompaniesSearch defaultValue={query} />
          </Suspense>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Building2 size={40} strokeWidth={1.5} />
              <p className="text-sm">
                {query
                  ? `No companies found for "${query}".`
                  : "No companies found."}
              </p>
            </div>
          ) : (
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8 text-center text-muted-foreground">#</TableHead>
                  <TableHead className="w-full">Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company, idx) => (
                  <TableRow key={company.id}>
                    {/* Row number */}
                    <TableCell className="text-center text-xs text-muted-foreground tabular-nums">
                      {offset + idx + 1}
                    </TableCell>

                    {/* Company info */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {company.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={company.logo}
                            alt={company.name}
                            className="h-10 w-10 rounded-full object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full border border-dashed border-border bg-muted shrink-0 flex items-center justify-center">
                            <Building2 size={16} className="text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm line-clamp-1">
                            {company.name}
                          </p>
                          {company.nameKh && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {company.nameKh}
                            </p>
                          )}
                          {company.address && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {company.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact */}
                    <TableCell>
                      <div className="space-y-0.5">
                        {company.email && (
                          <p className="text-xs text-muted-foreground">{company.email}</p>
                        )}
                        {company.phone && (
                          <p className="text-xs text-muted-foreground">{company.phone}</p>
                        )}
                        {!company.email && !company.phone && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Website */}
                    <TableCell>
                      {company.website ? (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline line-clamp-1 max-w-[160px] block"
                        >
                          {company.website}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Created date */}
                    <TableCell>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(company.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      {currentUserId && company.userId === currentUserId && (
                        <DeleteCompanyButton
                          companyId={company.id}
                          name={company.name}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* Footer: row count info + pagination */}
        {companies.length > 0 && (
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{rowFrom}–{rowTo}</span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {hasNext ? `${total}+` : total}
              </span>{" "}
              companies
            </p>
            <Suspense>
              <CompaniesPagination
                page={page}
                totalPages={totalPages}
                hasNext={hasNext}
                hasPrev={hasPrev}
              />
            </Suspense>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
