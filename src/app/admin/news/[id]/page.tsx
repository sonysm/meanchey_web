import { getNewsById, statusColors } from "@/lib/news";
import { AUTH_COOKIE_NAME, parseAuthSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

type DeltaOp = {
  insert?: unknown;
  attributes?: Record<string, unknown>;
};

type DetailItem = {
  text?: unknown;
  imgs?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const buildImageUrl = (image: string, photoPath: string | undefined, id: string): string => {
  if (!image) {
    return "";
  }

  if (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("data:")) {
    return image;
  }

  const base = (photoPath && photoPath.trim()) || `https://meanchey.org/storage/article/${id}/`;
  return `${base.replace(/\/$/, "")}/${image.replace(/^\//, "")}`;
};

const parseDetailText = (value: unknown): { text: string; attributes?: Record<string, unknown> } => {
  if (typeof value === "string") {
    return { text: value };
  }

  if (isRecord(value)) {
    const insert = value.insert;
    if (typeof insert === "string") {
      return {
        text: insert,
        attributes: isRecord(value.attributes) ? value.attributes : undefined,
      };
    }
  }

  return { text: "" };
};

const renderStyledText = (
  text: string,
  attributes: Record<string, unknown> | undefined,
  key: string,
): ReactNode => {
  const segments = text.split("\n");
  const content: ReactNode[] = [];

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i] ?? "";
    if (segment.length > 0) {
      let node: ReactNode = segment;
      const link = typeof attributes?.link === "string" ? attributes.link : undefined;

      if (link) {
        node = (
          <a href={link} target="_blank" rel="noreferrer" className="text-primary underline">
            {node}
          </a>
        );
      }
      if (attributes?.italic) {
        node = <em>{node}</em>;
      }
      if (attributes?.bold) {
        node = <strong>{node}</strong>;
      }

      content.push(<span key={`${key}-seg-${i}`}>{node}</span>);
    }

    if (i < segments.length - 1) {
      content.push(<br key={`${key}-br-${i}`} />);
    }
  }

  return content;
};

const renderContentPreview = (raw: string, photoPath: string | undefined, id: string, title: string): ReactNode => {
  if (!raw || !raw.trim()) {
    return <p className="text-sm text-muted-foreground">No content.</p>;
  }

  const blocks: ReactNode[] = [];

  const pushTextBlock = (text: string, attributes?: Record<string, unknown>) => {
    if (!text) {
      return;
    }
    blocks.push(
      <p key={`text-${blocks.length}`} className="text-sm leading-7 whitespace-pre-wrap">
        {renderStyledText(text, attributes, `text-${blocks.length}`)}
      </p>,
    );
  };

  const pushImageBlock = (image: string) => {
    if (!image) {
      return;
    }

    const src = buildImageUrl(image, photoPath, id);
    blocks.push(
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={`img-${blocks.length}`}
        src={src}
        alt={title}
        className="w-full max-h-[28rem] rounded-md border border-border object-contain"
      />,
    );
  };

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (Array.isArray(parsed)) {
      for (const item of parsed as DetailItem[]) {
        const imgs = Array.isArray(item?.imgs)
          ? item.imgs.filter((img): img is string => typeof img === "string" && img.trim().length > 0)
          : [];

        for (const image of imgs) {
          pushImageBlock(image);
        }

        const parsedText = parseDetailText(item?.text);
        pushTextBlock(parsedText.text, parsedText.attributes);
      }
    } else if (isRecord(parsed) && Array.isArray(parsed.ops)) {
      for (const op of parsed.ops as DeltaOp[]) {
        if (typeof op.insert === "string") {
          pushTextBlock(op.insert, isRecord(op.attributes) ? op.attributes : undefined);
          continue;
        }

        if (isRecord(op.insert) && typeof op.insert.image === "string") {
          pushImageBlock(op.insert.image);
        }
      }
    } else {
      pushTextBlock(raw);
    }
  } catch {
    pushTextBlock(raw);
  }

  if (blocks.length === 0) {
    return <p className="text-sm text-muted-foreground">No content.</p>;
  }

  return <div className="space-y-4">{blocks}</div>;
};

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const session = parseAuthSession(cookieStore.get(AUTH_COOKIE_NAME)?.value);
  const news = await getNewsById(id);
  if (!news) notFound();
  const canEdit = session?.userId ? news.authorId === String(session.userId) : false;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/news">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold line-clamp-1">{news.title}</h1>
        </div>
        {canEdit ? (
          <Link href={`/admin/news/${news.id}/edit`}>
            <Button variant="outline" className="gap-2">
              <Pencil size={15} /> Edit
            </Button>
          </Link>
        ) : null}
      </div>

      {news.coverImage && (
        <div className="relative h-64 w-full rounded-lg overflow-hidden">
          <Image
            src={news.coverImage}
            alt={news.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[news.status]}`}
        >
          {news.status}
        </span>
        {news.category && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {news.category.name}
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          {new Date(news.createdAt).toLocaleDateString()}
        </span>
        {news.viewCount !== undefined && (
          <span className="text-xs text-muted-foreground">
            👁 {news.viewCount.toLocaleString()} views
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          Company: {news.companyName ?? "Unknown"}
        </span>
      </div>

      {news.tags && news.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {news.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Content Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {renderContentPreview(news.content, news.photoPath, news.id, news.title)}
        </CardContent>
      </Card>
    </div>
  );
}
