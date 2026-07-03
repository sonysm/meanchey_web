"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

export default function CreateNewsPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NewsFormValues>({
    resolver: zodResolver(newsSchema),
    defaultValues: { status: "draft" },
  });

  const onSubmit = async (data: NewsFormValues) => {
    // TODO: Connect to your API
    console.log("Creating news:", data);
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
          <h1 className="text-2xl font-bold">Create News</h1>
          <p className="text-muted-foreground text-sm">
            Write and publish a new article
          </p>
        </div>
      </div>

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

            {/* Title KH */}
            <div className="space-y-1.5">
              <Label htmlFor="titleKh">Title (Khmer)</Label>
              <Input id="titleKh" placeholder="ចំណងជើងជាភាសាខ្មែរ" {...register("titleKh")} />
            </div>

            {/* Excerpt */}
            <div className="space-y-1.5">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                placeholder="Short summary of the article..."
                rows={2}
                {...register("excerpt")}
              />
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                placeholder="Write your article content here..."
                rows={10}
                {...register("content")}
              />
              {errors.content && (
                <p className="text-xs text-destructive">{errors.content.message}</p>
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
            {/* Category */}
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select onValueChange={(v) => setValue("category", v as string)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category.message}</p>
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
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="economy, cambodia, news (comma separated)"
                {...register("tags")}
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
          <Button type="submit" disabled={isSubmitting} className="gap-2">
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
