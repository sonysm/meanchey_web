'use client'

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, Sparkles, UserCircle2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
    username: z.string().min(1, "Email or phone is required"),
    password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const resolveNextPath = (value: string | null): string => {
    if (!value) {
        return "/";
    }

    if (!value.startsWith("/") || value.startsWith("//")) {
        return "/";
    }

    if (value.startsWith("/admin")) {
        return "/";
    }

    return value;
};

export default function PublicLoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

    const nextPath = useMemo(() => resolveNextPath(searchParams.get("next")), [searchParams]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    const onSubmit = async (values: LoginFormValues) => {
        setSubmitError(null);
        setIsSubmittingLogin(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...values,
                    audience: "public",
                }),
            });

            const payload = (await response.json().catch(() => ({}))) as { message?: string };

            if (!response.ok) {
                setSubmitError(payload.message ?? "Unable to sign in");
                return;
            }

            router.replace(nextPath);
            router.refresh();
        } finally {
            setIsSubmittingLogin(false);
        }
    };

    return (
        <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:gap-8">
            <section className="relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/80 p-5 shadow-[0_24px_80px_-30px_rgba(15,23,42,0.34)] backdrop-blur sm:p-7 lg:flex lg:flex-col lg:justify-between lg:p-10">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-sky-500" />

                <div className="space-y-5 lg:space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                        <Sparkles className="h-3.5 w-3.5" />
                        Personalized news features
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                        <h1 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-6xl">
                            Sign in to react, save, and follow stories.
                        </h1>
                        <p className="max-w-lg text-sm leading-6 text-muted-foreground sm:text-base lg:text-lg">
                            Use your Meanchey user account to access upcoming end-user features across the news platform.
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:mt-12">
                    <div className="rounded-2xl border border-border bg-background/75 p-4">
                        <p className="text-sm font-medium">Same backend</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            This uses the same login API as admin with user-role checks.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background/75 p-4">
                        <p className="text-sm font-medium">For normal users</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            User type 2 accounts can sign in here for public features.
                        </p>
                    </div>
                </div>
            </section>

            <Card className="border-border/70 bg-card/95 shadow-[0_24px_80px_-30px_rgba(15,23,42,0.28)] backdrop-blur">
                <CardContent className="space-y-6 p-5 sm:p-7 lg:p-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <UserCircle2 className="h-4 w-4" />
                            User sign in
                        </div>
                        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                            Welcome back
                        </h2>
                        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                            Enter your email or phone number and password.
                        </p>
                    </div>

                    {submitError && (
                        <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm leading-6 text-destructive">
                            {submitError}
                        </p>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="username">Email or phone</Label>
                            <Input
                                id="username"
                                autoComplete="username"
                                placeholder="you@example.com or +855..."
                                className="h-11 text-sm sm:h-12"
                                {...register("username")}
                            />
                            {errors.username && (
                                <p className="text-xs leading-5 text-destructive">
                                    {errors.username.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                placeholder="••••••••"
                                className="h-11 text-sm sm:h-12"
                                {...register("password")}
                            />
                            {errors.password && (
                                <p className="text-xs leading-5 text-destructive">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="h-11 w-full gap-2 sm:h-12"
                            disabled={isSubmittingLogin}
                        >
                            {isSubmittingLogin ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <ArrowRight className="h-4 w-4" />
                            )}
                            {isSubmittingLogin ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
