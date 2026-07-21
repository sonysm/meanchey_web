import type { ReactNode } from "react";

type DeltaOp = {
    insert?: unknown;
    attributes?: Record<string, unknown>;
};

type DetailItem = {
    text?: unknown;
    imgs?: unknown;
};

type JsonParseResult =
    | { ok: true; value: unknown }
    | { ok: false };

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

const escapeControlCharsInJsonStrings = (input: string): string => {
    let output = "";
    let inString = false;
    let escaped = false;

    for (const char of input) {
        if (!inString) {
            output += char;
            if (char === '"') {
                inString = true;
            }
            continue;
        }

        if (escaped) {
            output += char;
            escaped = false;
            continue;
        }

        if (char === "\\") {
            output += char;
            escaped = true;
            continue;
        }

        if (char === '"') {
            output += char;
            inString = false;
            continue;
        }

        if (char === "\n") {
            output += "\\n";
            continue;
        }

        if (char === "\r") {
            output += "\\r";
            continue;
        }

        if (char === "\t") {
            output += "\\t";
            continue;
        }

        output += char;
    }

    return output;
};

const parseJsonWithRepair = (text: string): JsonParseResult => {
    try {
        return { ok: true, value: JSON.parse(text) as unknown };
    } catch {
        const repaired = escapeControlCharsInJsonStrings(text);
        if (repaired === text) {
            return { ok: false };
        }

        try {
            return { ok: true, value: JSON.parse(repaired) as unknown };
        } catch {
            return { ok: false };
        }
    }
};

const resolveRenderablePayload = (raw: string): unknown => {
    const parseUnknown = (value: unknown, depth: number): unknown => {
        if (depth > 4) {
            return value;
        }

        if (typeof value === "string") {
            const text = value.trim();
            if (!text) {
                return value;
            }

            const parsed = parseJsonWithRepair(text);
            if (!parsed.ok) {
                return value;
            }

            return parseUnknown(parsed.value, depth + 1);
        }

        if (Array.isArray(value)) {
            return value;
        }

        if (isRecord(value)) {
            if (Array.isArray(value.ops)) {
                return value;
            }

            const candidates = [
                value.detail,
                value.content,
                value.body,
                value.description,
                value.data,
                value.info,
                value.result,
            ];

            for (const candidate of candidates) {
                const parsed = parseUnknown(candidate, depth + 1);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
                if (isRecord(parsed) && Array.isArray(parsed.ops)) {
                    return parsed;
                }
            }
        }

        return value;
    };

    return parseUnknown(raw, 0);
};

const parseDetailText = (value: unknown): { text: string; attributes?: Record<string, unknown> } => {
    if (typeof value === "string") {
        const parsed = parseJsonWithRepair(value.trim());
        if (parsed.ok) {
            return parseDetailText(parsed.value);
        }

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

const renderContentBlocks = (raw: string, photoPath: string | undefined, id: string, title: string): ReactNode[] => {
    if (!raw || !raw.trim()) {
        return [<p key="empty" className="text-sm text-muted-foreground">No content.</p>];
    }

    const blocks: ReactNode[] = [];

    const pushTextBlock = (text: string, attributes?: Record<string, unknown>) => {
        if (!text) {
            return;
        }
        blocks.push(
            <p key={`text-${blocks.length}`} className="text-base leading-8 whitespace-pre-wrap">
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
                className="w-full max-h-[34rem] rounded-xl border border-border object-contain"
            />,
        );
    };

    const parsed = resolveRenderablePayload(raw);

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

        return blocks;
    }

    if (isRecord(parsed) && Array.isArray(parsed.ops)) {
        for (const op of parsed.ops as DeltaOp[]) {
            if (typeof op.insert === "string") {
                pushTextBlock(op.insert, isRecord(op.attributes) ? op.attributes : undefined);
                continue;
            }

            if (isRecord(op.insert) && typeof op.insert.image === "string") {
                pushImageBlock(op.insert.image);
            }
        }

        return blocks;
    }

    pushTextBlock(raw);
    return blocks;
};

type ArticleBodyProps = {
    content: string;
    photoPath?: string;
    id: string;
    title: string;
};

export default function ArticleBody({ content, photoPath, id, title }: ArticleBodyProps) {
    const blocks = renderContentBlocks(content, photoPath, id, title);
    return <div className="space-y-5">{blocks}</div>;
}
