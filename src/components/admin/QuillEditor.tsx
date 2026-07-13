"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "quill/dist/quill.snow.css";

type DeltaOperation = { insert?: unknown; attributes?: Record<string, unknown> };
type ArticleDetailItem = {
    text?: unknown;
    imgs?: unknown;
};
type QuillLike = {
    getContents: () => DeltaLike;
    formatText: (index: number, length: number, formats: Record<string, unknown>, source?: string) => void;
    getSelection: (focus?: boolean) => { index: number; length: number } | null;
    getLength: () => number;
    insertEmbed: (index: number, type: string, value: unknown, source?: string) => void;
    insertText: (index: number, text: string, source?: string) => void;
    setSelection: (index: number, length?: number, source?: string) => void;
    setContents: (delta: unknown) => void;
    setText: (text: string) => void;
    on: (eventName: string, handler: () => void) => void;
};

type QuillEditorProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    imageBaseUrl?: string;
    onImageUploadStateChange?: (state: { uploading: number; failed: number }) => void;
};

const toolbarOptions = [
    ["bold", "italic"],
    ["link", "image"],
];

const allowedFormats = ["bold", "italic", "link", "image"];

type DeltaLike = { ops?: DeltaOperation[] };

const isDeltaObject = (value: unknown): value is DeltaLike => {
    return typeof value === "object" && value !== null && Array.isArray((value as DeltaLike).ops);
};

const isArticleDetailArray = (value: unknown): value is ArticleDetailItem[] => {
    return Array.isArray(value);
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null;
};

const normalizeTextInsert = (value: unknown): DeltaOperation | null => {
    if (isRecord(value) && "insert" in value) {
        return value as DeltaOperation;
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value) as unknown;
            if (isRecord(parsed) && "insert" in parsed) {
                return parsed as DeltaOperation;
            }
        } catch {
            return { insert: value };
        }
    }

    return null;
};

const resolveImageUrl = (imageName: string, imageBaseUrl?: string): string => {
    try {
        if (imageName.startsWith("http://") || imageName.startsWith("https://")) {
            console.debug("QuillEditor.resolveImageUrl: absolute image used", { imageName });
            return imageName;
        }

        if (!imageBaseUrl) {
            console.debug("QuillEditor.resolveImageUrl: no base, returning raw imageName", { imageName });
            return imageName;
        }

        const resolved = `${imageBaseUrl.replace(/\/$/, "")}/${imageName}`;
        console.debug("QuillEditor.resolveImageUrl: resolved image url", { imageName, imageBaseUrl, resolved });
        return resolved;
    } catch (err) {
        console.debug("QuillEditor.resolveImageUrl: error resolving image", { imageName, imageBaseUrl, err });
        return imageName;
    }
};

const detailToDelta = (details: ArticleDetailItem[], imageBaseUrl?: string): DeltaLike => {
    const ops: DeltaOperation[] = [];

    for (const item of details) {
        const imgs = Array.isArray(item.imgs)
            ? item.imgs.filter((img): img is string => typeof img === "string" && img.length > 0)
            : [];

        if (imgs.length > 0) {
            // Use default Quill image embed format for web rendering.
            ops.push({ insert: { image: resolveImageUrl(imgs[0], imageBaseUrl) } });
            ops.push({ insert: "\n" });
            continue;
        }

        const textOp = normalizeTextInsert(item.text);
        if (textOp) {
            ops.push(textOp);
        }
    }

    if (ops.length === 0) {
        ops.push({ insert: "\n" });
    }

    return { ops };
};

const parseDelta = (value: string, imageBaseUrl?: string): DeltaLike | null => {
    const parseUnknown = (input: unknown, depth: number): DeltaLike | null => {
        if (depth > 3) {
            return null;
        }

        if (isDeltaObject(input)) {
            return input;
        }

        if (isArticleDetailArray(input)) {
            return detailToDelta(input, imageBaseUrl);
        }

        if (typeof input === "string") {
            const text = input.trim();
            if (!text) {
                return null;
            }

            try {
                const parsed = JSON.parse(text) as unknown;
                return parseUnknown(parsed, depth + 1);
            } catch {
                return null;
            }
        }

        if (isRecord(input)) {
            const candidates = [
                input.detail,
                input.content,
                input.body,
                input.description,
                input.data,
                input.info,
                input.result,
            ];

            for (const candidate of candidates) {
                const parsed = parseUnknown(candidate, depth + 1);
                if (parsed) {
                    return parsed;
                }
            }
        }

        return null;
    };

    if (!value) {
        return null;
    }

    return parseUnknown(value, 0);
};

const normalizeDeltaString = (delta: DeltaLike): string => {
    return JSON.stringify(delta);
};

const fileToDataUrl = async (file: File): Promise<string> => {
    return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result === "string" && result.length > 0) {
                resolve(result);
                return;
            }

            reject(new Error("Failed to read image file"));
        };
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(file);
    });
};

const normalizeImageForUpload = async (file: File): Promise<File> => {
    if (!file.type.startsWith("image/")) {
        return file;
    }

    try {
        const sourceUrl = await fileToDataUrl(file);
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Failed to decode image"));
            img.src = sourceUrl;
        });

        const maxEdge = 1920;
        const maxSide = Math.max(image.width, image.height);
        const ratio = maxSide > maxEdge ? maxEdge / maxSide : 1;
        const width = Math.max(1, Math.round(image.width * ratio));
        const height = Math.max(1, Math.round(image.height * ratio));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
            return file;
        }

        context.drawImage(image, 0, 0, width, height);

        const jpegBlob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, "image/jpeg", 0.9);
        });

        if (!jpegBlob) {
            return file;
        }

        return new File([jpegBlob], "image.jpg", { type: "image/jpeg" });
    } catch {
        return file;
    }
};

const isImageOpWithValue = (op: unknown, imageValue: string): op is DeltaOperation => {
    if (!isRecord(op)) {
        return false;
    }

    const insert = op.insert;
    if (!isRecord(insert)) {
        return false;
    }

    return typeof insert.image === "string" && insert.image === imageValue;
};

const findImageOpIndex = (delta: DeltaLike, imageValue: string): number => {
    const ops = Array.isArray(delta.ops) ? delta.ops : [];
    let index = 0;

    for (const op of ops) {
        if (isImageOpWithValue(op, imageValue)) {
            return index;
        }

        if (typeof (op as DeltaOperation).insert === "string") {
            index += ((op as DeltaOperation).insert as string).length;
        } else {
            index += 1;
        }
    }

    return -1;
};

export default function QuillEditor({
    value,
    onChange,
    placeholder = "Write your article content here...",
    imageBaseUrl,
    onImageUploadStateChange,
}: QuillEditorProps) {
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const quillRef = useRef<QuillLike | null>(null);
    const onChangeRef = useRef(onChange);
    const onImageUploadStateChangeRef = useRef(onImageUploadStateChange);
    const initialValueRef = useRef(value);
    const initialImageBaseUrlRef = useRef(imageBaseUrl);
    const lastLocalValueRef = useRef<string>(value);
    const imageUploadStateRef = useRef(new Map<string, "uploading" | "failed" | "uploaded">());
    const fileByImageRef = useRef(new Map<string, File>());
    const [failedImageUrls, setFailedImageUrls] = useState<string[]>([]);
    const [retryingImageUrls, setRetryingImageUrls] = useState<string[]>([]);

    const emitUploadState = useCallback(() => {
        const quill = quillRef.current;
        const map = imageUploadStateRef.current;

        if (!quill) {
            onImageUploadStateChangeRef.current?.({ uploading: 0, failed: 0 });
            return;
        }

        const current = quill.getContents();
        const existingImages = new Set<string>();
        const ops = Array.isArray(current.ops) ? current.ops : [];
        for (const op of ops) {
            if (isRecord(op.insert) && typeof op.insert.image === "string") {
                existingImages.add(op.insert.image);
            }
        }

        for (const key of Array.from(map.keys())) {
            if (!existingImages.has(key)) {
                map.delete(key);
                fileByImageRef.current.delete(key);
            }
        }

        let uploading = 0;
        let failed = 0;
        const failedUrls: string[] = [];
        for (const status of map.values()) {
            if (status === "uploading") {
                uploading += 1;
            }
            if (status === "failed") {
                failed += 1;
            }
        }

        for (const [url, status] of map.entries()) {
            if (status === "failed") {
                failedUrls.push(url);
            }
        }

        setFailedImageUrls(failedUrls);
        setRetryingImageUrls((previous) => previous.filter((url) => existingImages.has(url)));
        onImageUploadStateChangeRef.current?.({ uploading, failed });
    }, []);

    const uploadImage = useCallback(async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append("imgs[]", file, "image.jpg");

        const response = await fetch("/api/admin/articles/images", {
            method: "POST",
            credentials: "include",
            body: formData,
        });

        const payload = (await response.json().catch(() => ({}))) as {
            data?: { imgs?: string[] };
            imgs?: string[];
            message?: string;
            error?: string;
            detail?: string;
            msg?: string;
        };

        if (!response.ok) {
            throw new Error(
                payload.message ?? payload.error ?? payload.detail ?? payload.msg ?? "Failed to upload image",
            );
        }

        const imgs = Array.isArray(payload.imgs)
            ? payload.imgs
            : Array.isArray(payload.data?.imgs)
                ? payload.data?.imgs
                : [];

        const imageName = imgs[0];
        if (typeof imageName !== "string" || imageName.length === 0) {
            throw new Error("Image upload response is invalid");
        }

        console.debug("QuillEditor.uploadImage: upload response imageName", { imageName, imgs });
        return imageName;
    }, []);

    const applyImageAttributes = useCallback((
        imageValue: string,
        attributes: Record<string, unknown>,
    ) => {
        const quill = quillRef.current;
        if (!quill) {
            return;
        }

        const contents = quill.getContents();
        const imageIndex = findImageOpIndex(contents, imageValue);
        if (imageIndex < 0) {
            return;
        }

        quill.formatText(imageIndex, 1, attributes, "api");
    }, []);

    const triggerImageInsert = useCallback(() => {
        const quill = quillRef.current;
        if (!quill) {
            return;
        }

        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) {
                return;
            }

            const uploadFile = await normalizeImageForUpload(file);

            const range = quill.getSelection(true);
            const index = range?.index ?? quill.getLength();
            let localPreviewUrl: string;

            try {
                localPreviewUrl = await fileToDataUrl(uploadFile);
            } catch {
                return;
            }

            quill.insertEmbed(index, "image", localPreviewUrl, "user");
            quill.insertText(index + 1, "\n", "user");
            quill.setSelection(index + 2, 0, "silent");

            fileByImageRef.current.set(localPreviewUrl, uploadFile);
            imageUploadStateRef.current.set(localPreviewUrl, "uploading");
            emitUploadState();

            try {
                const uploadedName = await uploadImage(uploadFile);
                applyImageAttributes(localPreviewUrl, {
                    imageName: uploadedName,
                    imageUploadState: "uploaded",
                    imageUploadError: null,
                });
                imageUploadStateRef.current.set(localPreviewUrl, "uploaded");
            } catch {
                applyImageAttributes(localPreviewUrl, {
                    imageUploadState: "failed",
                    imageUploadError: "upload_failed",
                });
                imageUploadStateRef.current.set(localPreviewUrl, "failed");
            }

            emitUploadState();
        };

        input.click();
    }, [applyImageAttributes, emitUploadState, uploadImage]);

    const retryFailedImageUpload = useCallback(async (imageUrl: string) => {
        const quill = quillRef.current;
        if (!quill) {
            return;
        }

        const file = fileByImageRef.current.get(imageUrl);
        if (!file) {
            return;
        }

        setRetryingImageUrls((previous) => {
            if (previous.includes(imageUrl)) {
                return previous;
            }
            return [...previous, imageUrl];
        });

        imageUploadStateRef.current.set(imageUrl, "uploading");
        applyImageAttributes(imageUrl, {
            imageUploadState: "uploading",
            imageUploadError: null,
        });
        emitUploadState();

        try {
            const uploadedName = await uploadImage(file);
            applyImageAttributes(imageUrl, {
                imageName: uploadedName,
                imageUploadState: "uploaded",
                imageUploadError: null,
            });
            imageUploadStateRef.current.set(imageUrl, "uploaded");
        } catch {
            applyImageAttributes(imageUrl, {
                imageUploadState: "failed",
                imageUploadError: "upload_failed",
            });
            imageUploadStateRef.current.set(imageUrl, "failed");
        }

        setRetryingImageUrls((previous) => previous.filter((url) => url !== imageUrl));
        emitUploadState();
    }, [applyImageAttributes, emitUploadState, uploadImage]);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        onImageUploadStateChangeRef.current = onImageUploadStateChange;
    }, [onImageUploadStateChange]);

    useEffect(() => {
        if (!wrapperRef.current || quillRef.current) {
            return;
        }

        const hostWrapper = wrapperRef.current;
        const editorHost = document.createElement("div");
        hostWrapper.appendChild(editorHost);

        let mounted = true;
        const uploadStateMap = imageUploadStateRef.current;
        const fileByImageMap = fileByImageRef.current;

        void (async () => {
            const quillModule = await import("quill");
            const QuillCtor = quillModule.default;

            if (!mounted) {
                return;
            }

            const quill = new QuillCtor(editorHost, {
                theme: "snow",
                placeholder,
                formats: allowedFormats,
                modules: {
                    toolbar: {
                        container: toolbarOptions,
                        handlers: {
                            image: triggerImageInsert,
                        },
                    },
                },
            }) as unknown as QuillLike;

            const parsed = parseDelta(initialValueRef.current, initialImageBaseUrlRef.current);
            if (parsed) {
                quill.setContents(parsed);
            } else if (initialValueRef.current) {
                quill.setText(initialValueRef.current);
            }

            quill.on("text-change", () => {
                const nextValue = normalizeDeltaString(quill.getContents());
                lastLocalValueRef.current = nextValue;
                onChangeRef.current(nextValue);
                emitUploadState();
            });

            quillRef.current = quill;
            emitUploadState();
        })();

        return () => {
            mounted = false;
            quillRef.current = null;
            uploadStateMap.clear();
            fileByImageMap.clear();
            setFailedImageUrls([]);
            setRetryingImageUrls([]);
            onImageUploadStateChangeRef.current?.({ uploading: 0, failed: 0 });
            hostWrapper.innerHTML = "";
        };
    }, [emitUploadState, placeholder, triggerImageInsert]);

    useEffect(() => {
        const quill = quillRef.current;
        if (!quill) {
            return;
        }

        // Ignore value updates that originated from this same editor instance.
        if (value === lastLocalValueRef.current) {
            return;
        }

        const current = normalizeDeltaString(quill.getContents());
        if (current === value) {
            return;
        }

        const parsed = parseDelta(value, imageBaseUrl);
        if (parsed) {
            quill.setContents(parsed);
        } else {
            quill.setText(value || "");
        }
        emitUploadState();
    }, [emitUploadState, imageBaseUrl, value]);

    return (
        <div className="space-y-2">
            <div className="min-h-56 rounded-md border" ref={wrapperRef} />

            {failedImageUrls.length > 0 && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2">
                    <p className="text-xs text-destructive">
                        Some images failed to upload. Retry below or remove the failed image from editor.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {failedImageUrls.map((url, index) => {
                            const isRetrying = retryingImageUrls.includes(url);
                            return (
                                <div
                                    key={`${url}-${index}`}
                                    className="flex items-center gap-2 rounded border border-destructive/40 bg-background p-1"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={url}
                                        alt={`Failed image ${index + 1}`}
                                        className="h-10 w-10 rounded object-cover border border-border"
                                    />
                                    <button
                                        type="button"
                                        className="rounded border border-destructive px-2 py-1 text-xs text-destructive disabled:opacity-60"
                                        onClick={() => {
                                            void retryFailedImageUpload(url);
                                        }}
                                        disabled={isRetrying}
                                    >
                                        {isRetrying ? `Retrying Image ${index + 1}...` : `Retry Image ${index + 1}`}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
