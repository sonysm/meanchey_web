"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  status: z.enum(["published", "draft", "archived"]),
  tags: z.array(z.string()),
  coverImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  companyId: z.string().min(1, "Host company is required"),
});

type NewsFormValues = z.infer<typeof newsSchema>;

export default function CreateNewsPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [imageUploadState, setImageUploadState] = useState({ uploading: 0, failed: 0 });

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NewsFormValues>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      status: "draft",
      content: JSON.stringify({ ops: [{ insert: "\n" }] }),
      tags: [],
      companyId: "",
    },
  });

  const companyIdValue = watch("companyId");

  const companies = useMemo<AuthCompany[]>(() => session?.companies ?? [], [session]);

  useEffect(() => {
    const loadSession = async () => {
      setIsLoadingSession(true);
      setLoadError(null);

      try {
        const response = await fetch("/api/auth/session");
        const payload = (await response.json().catch(() => ({}))) as { data?: AuthSession | null };

        if (!response.ok) {
          throw new Error("Failed to load login session");
        }

        const nextSession = payload.data ?? null;
        setSession(nextSession);

        const selectedCompanyId = getValues("companyId");
        const firstCompanyId = nextSession?.companies?.[0]?.id.toString() ?? "";

        if (!selectedCompanyId && firstCompanyId) {
          setValue("companyId", firstCompanyId, { shouldValidate: true });
        }
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Failed to load login session");
      } finally {
        setIsLoadingSession(false);
      }
    };

    void loadSession();
  }, [getValues, setValue]);

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

    const response = await fetch("/api/admin/articles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { message?: string };
      setSubmitError(payload.message ?? "Failed to create article");
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
          <h1 className="text-2xl font-bold">Create News</h1>
          <p className="text-muted-foreground text-sm">
            Write and publish a new article
          </p>
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
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">Title (English) *</Label>
              <Input id="title" placeholder="Enter article title" {...register("title")} />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Content */}
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

        {/* Sidebar settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Host company */}
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

            {/* Status */}
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                defaultValue="draft"
                onValueChange={(v) =>
                  setValue("status", v as "published" | "draft" | "archived")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
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

            {/* Cover Image */}
            <div className="space-y-1.5">
              <Label htmlFor="coverImage">Cover Image URL</Label>
              <Input
                id="coverImage"
                placeholder="https://example.com/image.jpg"
                {...register("coverImage")}
              />
              {errors.coverImage && (
                <p className="text-xs text-destructive">{errors.coverImage.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              isLoadingSession ||
              companies.length === 0 ||
              imageUploadState.uploading > 0 ||
              imageUploadState.failed > 0
            }
            className="gap-2"
          >
            <Save size={16} />
            {isSubmitting ? "Saving..." : "Save Article"}
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
