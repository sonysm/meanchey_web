"use client";

import { useRouter } from "next/navigation";
import { use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { mockNews } from "@/lib/news";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

const newsSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  titleKh: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().min(10, "Content is required"),
  category: z.string().min(1, "Category is required"),
  status: z.enum(["published", "draft", "archived"]),
  tags: z.string().optional(),
  coverImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type NewsFormValues = z.infer<typeof newsSchema>;

const categories = [
  { id: "1", name: "Economy" },
  { id: "2", name: "Politics" },
  { id: "3", name: "Tourism" },
  { id: "4", name: "Technology" },
  { id: "5", name: "Sports" },
  { id: "6", name: "Culture" },
];

export default function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const news = mockNews.find((n) => n.id === id);

  if (!news) notFound();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NewsFormValues>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: news.title,
      titleKh: news.titleKh ?? "",
      excerpt: news.excerpt ?? "",
      content: news.content,
      category: news.category?.id ?? "",
      status: news.status,
      tags: news.tags?.join(", ") ?? "",
      coverImage: news.coverImage ?? "",
    },
  });

  const onSubmit = async (data: NewsFormValues) => {
    // TODO: Connect to your API
    console.log("Updating news:", id, data);
    await new Promise((r) => setTimeout(r, 500));
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
              <Label htmlFor="titleKh">Title (Khmer)</Label>
              <Input id="titleKh" {...register("titleKh")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea id="excerpt" rows={2} {...register("excerpt")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="content">Content *</Label>
              <Textarea id="content" rows={10} {...register("content")} />
              {errors.content && (
                <p className="text-xs text-destructive">{errors.content.message}</p>
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
              <Label>Category *</Label>
              <Select
                defaultValue={news.category?.id ?? ""}
                onValueChange={(v) => setValue("category", v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                defaultValue={news.status}
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

            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" {...register("tags")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="coverImage">Cover Image URL</Label>
              <Input id="coverImage" {...register("coverImage")} />
              {errors.coverImage && (
                <p className="text-xs text-destructive">{errors.coverImage.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            <Save size={16} />
            {isSubmitting ? "Saving..." : "Update Article"}
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
