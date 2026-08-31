import {
  getUsers,
  searchUsers,
  USERS_PAGE_SIZE,
} from "@/lib/users";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users as UsersIcon, Plus } from "lucide-react";
import { UsersSearch } from "@/components/admin/UsersSearch";
import { UsersPagination } from "@/components/admin/UsersPagination";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, parseAuthSession } from "@/lib/auth";

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const { q, page: pageParam } = await searchParams;
  const query = q?.trim() ?? "";
  const page = Math.max(1, Number(pageParam) || 1);

  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = sessionValue ? parseAuthSession(sessionValue) : null;
  const loginToken = session?.loginToken;

  const result = query
    ? await searchUsers(query, page, USERS_PAGE_SIZE, loginToken)
    : await getUsers(page, USERS_PAGE_SIZE, loginToken);

  const { data: users, total, hasNext, hasPrev, totalPages } = result;

  const offset = (page - 1) * USERS_PAGE_SIZE;
  const rowFrom = users.length === 0 ? 0 : offset + 1;
  const rowTo = offset + users.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground text-sm mt-1">
            All registered users, sorted by latest
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-base">
            {query ? `Results for "${query}"` : "All Users"}
          </CardTitle>
          <Suspense>
            <UsersSearch defaultValue={query} />
          </Suspense>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <UsersIcon size={40} strokeWidth={1.5} />
              <p className="text-sm">
                {query ? `No users found for "${query}".` : "No users found."}
              </p>
            </div>
          ) : (
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8 text-center text-muted-foreground">#</TableHead>
                  <TableHead className="w-full">User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, idx) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-center text-xs text-muted-foreground tabular-nums">
                      {offset + idx + 1}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-3">
                        {user.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.photo}
                            alt={user.name}
                            className="h-10 w-10 rounded-full object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full border border-dashed border-border bg-muted shrink-0 flex items-center justify-center">
                            <UsersIcon size={16} className="text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm line-clamp-1">
                            {user.name}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        {user.email && (
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        )}
                        {user.phone && (
                          <p className="text-xs text-muted-foreground">{user.phone}</p>
                        )}
                        {!user.email && !user.phone && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-muted-foreground capitalize">
                        {user.role || "User"}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {users.length > 0 && (
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{rowFrom}–{rowTo}</span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {hasNext ? `${total}+` : total}
              </span>{" "}
              users
            </p>
            <Suspense>
              <UsersPagination
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
