import { Suspense } from "react";

import PublicLoginForm from "./public-login-form";

const LoginSkeleton = () => (
    <div className="grid w-full animate-pulse gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:gap-8">
        <div className="h-[500px] rounded-[1.75rem] bg-gray-200"></div>
        <div className="h-[500px] rounded-2xl bg-gray-200"></div>
    </div>
);

export default function PublicLoginPage() {
    return (
        <div className="min-h-dvh overflow-x-clip bg-[radial-gradient(circle_at_top_left,_rgba(253,224,71,0.15),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_25%),linear-gradient(180deg,_#fff7ed_0%,_#ffffff_52%,_#eff6ff_100%)] text-foreground">
            <div className="mx-auto flex min-h-dvh w-full max-w-6xl items-stretch px-4 py-4 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
                <Suspense fallback={<LoginSkeleton />}>
                    <PublicLoginForm />
                </Suspense>
            </div>
        </div>
    );
}
