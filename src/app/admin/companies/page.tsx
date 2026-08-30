import { getCompanies, searchCompanies } from "@/lib/companies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Suspense } from "react";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const companies = query
    ? await searchCompanies(query)
    : await getCompanies();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Companies</h1>
          <p className="text-muted-foreground text-sm mt-1">
            All registered companies, sorted by latest
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-base">
            {query
              ? `Search results for "${query}" (${companies.length})`
              : `All Companies (${companies.length})`}
          </CardTitle>
          {/* Suspense required because CompaniesSearch reads useSearchParams */}
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
                  <TableHead className="w-full">Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
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
                            <Building2
                              size={16}
                              className="text-muted-foreground"
                            />
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
                    <TableCell>
                      <div className="space-y-0.5">
                        {company.email && (
                          <p className="text-xs text-muted-foreground">
                            {company.email}
                          </p>
                        )}
                        {company.phone && (
                          <p className="text-xs text-muted-foreground">
                            {company.phone}
                          </p>
                        )}
                        {!company.email && !company.phone && (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </div>
                    </TableCell>
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
                        <span className="text-xs text-muted-foreground">
                          —
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(company.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
