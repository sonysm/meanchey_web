"use client";

import { useState, useTransition, useCallback, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UsersSearch({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushQuery = useCallback(
    (text: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (text.trim()) {
        params.set("q", text.trim());
      } else {
        params.delete("q");
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setValue(v);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      pushQuery(v);
    }, 400);
  };

  const handleClear = () => {
    setValue("");
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    pushQuery("");
  };

  return (
    <div className="relative w-full max-w-sm">
      <Search
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
      <Input
        type="search"
        placeholder="Search users…"
        value={value}
        onChange={handleChange}
        className="pl-9 pr-9"
        aria-label="Search users"
      />
      {isPending && (
        <Loader2
          size={15}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin"
        />
      )}
      {!isPending && value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X size={13} />
        </Button>
      )}
    </div>
  );
}
