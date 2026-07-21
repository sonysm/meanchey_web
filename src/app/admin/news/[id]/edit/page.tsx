"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import QuillEditor from "@/components/admin/QuillEditor";
import TagInput from "@/components/admin/tag-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import type { AuthCompany, AuthSession } from "@/lib/auth";

const newsSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(2, "Content is required"),
  tags: z.array(z.string()),
  companyId: z.string().min(1, "Host company is required"),
});

type NewsFormValues = z.infer<typeof newsSchema>;

const parsePossibleTagValue = (val: unknown): string[] | undefined => {
  if (Array.isArray(val)) {
    return val.filter((t): t is string => typeof t === "string");
  }
  if (typeof val === "string") {
    const text = val.trim();
    if (!text) return undefined;
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((t): t is string => typeof t === "string")
          .map((t) => t.trim())
          .filter(Boolean);
      }
    } catch {
      // not JSON
    }
    return text
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return undefined;
};

export default function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoadingArticle, setIsLoadingArticle] = useState(true);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [imageBaseUrl, setImageBaseUrl] = useState<string>(
    `https://meanchey.org/storage/article/${id}`,
  );
  const [imageUploadState, setImageUploadState] = useState({ uploading: 0, failed: 0 });
  const [session, setSession] = useState<AuthSession | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NewsFormValues>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: "",
      content: JSON.stringify({ ops: [{ insert: "\n" }] }),
      tags: [],
      companyId: "",
    },
  });

  const companyIdValue = watch("companyId");
  const companies = useMemo<AuthCompany[]>(() => session?.companies ?? [], [session]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingArticle(true);
      setIsLoadingSession(true);
      setLoadError(null);

      try {
        const [articleResponse, sessionResponse] = await Promise.all([
          fetch(`/api/admin/articles/${id}`, {
            credentials: "include",
          }),
          fetch("/api/auth/session", {
            credentials: "include",
          }),
        ]);

        if (!articleResponse.ok) {
          throw new Error("Failed to load article");
        }

        const articlePayload = (await articleResponse.json()) as {
          data?: {
            title?: string;
            content?: string;
            photoPath?: string;
            tags?: string[];
            tag?: string | string[];
            companyId?: string;
          };
        };

        const article = articlePayload.data;
        if (!article) {
          throw new Error("Article not found");
        }

        setImageBaseUrl(article.photoPath ?? `https://meanchey.org/storage/article/${id}`);

        let nextSession: AuthSession | null = null;
        if (sessionResponse.ok) {
          const sessionPayload = (await sessionResponse.json().catch(() => ({}))) as {
            data?: AuthSession | null;
          };
          nextSession = sessionPayload.data ?? null;
          setSession(nextSession);
        } else {
          setSession(null);
        }

        const defaultCompanyId =
          article.companyId ??
          nextSession?.companyId?.toString() ??
          nextSession?.companies?.[0]?.id.toString() ??
          "";

        reset({
          title: article.title ?? "",
          content:
            article.content && article.content.trim().length > 0
              ? article.content
              : JSON.stringify({ ops: [{ insert: "\n" }] }),
          tags: parsePossibleTagValue(article.tags) ?? parsePossibleTagValue(article.tag) ?? [],
          companyId: defaultCompanyId,
        });
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Failed to load article");
      } finally {
        setIsLoadingArticle(false);
        setIsLoadingSession(false);
      }
    };

    void loadData();
  }, [id, reset]);

  useEffect(() => {
    if (!companyIdValue && companies.length === 1) {
      setValue("companyId", companies[0]?.id.toString() ?? "", { shouldValidate: true });
    }
  }, [companies, companyIdValue, setValue]);

  const onSubmit = async (data: NewsFormValues) => {
    if (imageUploadState.uploading > 0 || imageUploadState.failed > 0) {
      setSubmitError("Please wait until all images are uploaded successfully.");
      return;
    }

    setSubmitError(null);

    const response = await fetch(`/api/admin/articles/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { message?: string };
      setSubmitError(payload.message ?? "Failed to update article");
      return;
    }

    router.push("/admin/news");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/news">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit News</h1>
          <p className="text-muted-foreground text-sm">Update article details</p>
        </div>
      </div>

      {loadError && <p className="text-sm text-destructive">{loadError}</p>}
      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Article Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title (English) *</Label>
              <Input id="title" {...register("title")} />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="content">Content *</Label>
              <Controller
                control={control}
                name="content"
                render={({ field }) => (
                  <QuillEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Write your article content here..."
                    imageBaseUrl={imageBaseUrl}
                    onImageUploadStateChange={setImageUploadState}
                  />
                )}
              />
              {errors.content && (
                <p className="text-xs text-destructive">{errors.content.message}</p>
              )}
              {imageUploadState.uploading > 0 && (
                <p className="text-xs text-muted-foreground">
                  Uploading {imageUploadState.uploading} image(s). Save is disabled until finished.
                </p>
              )}
              {imageUploadState.failed > 0 && (
                <p className="text-xs text-destructive">
                  {imageUploadState.failed} image upload failed. Remove the failed image or insert it again to re-upload.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Host Company *</Label>
              <Select
                value={companyIdValue}
                onValueChange={(v) => setValue("companyId", v ?? "", { shouldValidate: true })}
                disabled={isLoadingSession || companies.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingSession ? "Loading companies..." : "Select host company"} />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.companyId && (
                <p className="text-xs text-destructive">{errors.companyId.message}</p>
              )}
              {!isLoadingSession && companies.length === 0 && !loadError && (
                <p className="text-xs text-muted-foreground">
                  No company is linked to this account.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Tags</Label>
              <Controller
                control={control}
                name="tags"
                render={({ field }) => (
                  <TagInput
                    value={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="Type a tag and press Enter"
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              isLoadingArticle ||
              isLoadingSession ||
              companies.length === 0 ||
              imageUploadState.uploading > 0 ||
              imageUploadState.failed > 0
            }
            className="gap-2"
          >
            <Save size={16} />
            {isLoadingArticle ? "Loading..." : isSubmitting ? "Saving..." : "Update Article"}
          </Button>
          <Link href="/admin/news">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
