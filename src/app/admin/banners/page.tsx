import {
  getBanners,
  searchBanners,
  BANNERS_PAGE_SIZE,
} from "@/lib/banners";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Image as ImageIcon } from "lucide-react";
import { BannersSearch } from "@/components/admin/BannersSearch";
import { BannersPagination } from "@/components/admin/BannersPagination";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, parseAuthSession } from "@/lib/auth";

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function BannersPage({ searchParams }: PageProps) {
  const { q, page: pageParam } = await searchParams;
  const query = q?.trim() ?? "";
  const page = Math.max(1, Number(pageParam) || 1);

  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = sessionValue ? parseAuthSession(sessionValue) : null;
  const loginToken = session?.loginToken;

  const result = query
    ? await searchBanners(query, page, BANNERS_PAGE_SIZE, loginToken)
    : await getBanners(page, BANNERS_PAGE_SIZE, loginToken);

  const { data: banners, total, hasNext, hasPrev, totalPages } = result;

  const offset = (page - 1) * BANNERS_PAGE_SIZE;
  const rowFrom = banners.length === 0 ? 0 : offset + 1;
  const rowTo = offset + banners.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Banners</h1>
          <p className="text-muted-foreground text-sm mt-1">
            All ads banners, sorted by latest
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-base">
            {query ? `Results for "${query}"` : "All Banners"}
          </CardTitle>
          <Suspense>
            <BannersSearch defaultValue={query} />
          </Suspense>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {banners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <ImageIcon size={40} strokeWidth={1.5} />
              <p className="text-sm">
                {query ? `No banners found for "${query}".` : "No banners found."}
              </p>
            </div>
          ) : (
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8 text-center text-muted-foreground">#</TableHead>
                  <TableHead className="w-full">Banner</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner, idx) => (
                  <TableRow key={banner.id}>
                    <TableCell className="text-center text-xs text-muted-foreground tabular-nums">
                      {offset + idx + 1}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-3">
                        {banner.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="h-10 w-16 rounded-md object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-16 rounded-md border border-dashed border-border bg-muted shrink-0 flex items-center justify-center">
                            <ImageIcon size={16} className="text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm line-clamp-1">
                            {banner.title}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-muted-foreground capitalize">
                        {banner.type || "—"}
                      </span>
                    </TableCell>

                    <TableCell>
                      {banner.link ? (
                        <a
                          href={banner.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline line-clamp-1 max-w-[160px] block"
                        >
                          {banner.link}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {banner.isActive === undefined ? "—" : banner.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(banner.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {banners.length > 0 && (
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{rowFrom}–{rowTo}</span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {hasNext ? `${total}+` : total}
              </span>{" "}
              banners
            </p>
            <Suspense>
              <BannersPagination
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
