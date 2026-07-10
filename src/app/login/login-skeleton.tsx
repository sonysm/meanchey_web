const Skeleton = ({ className }: { className?: string }) => (
    <div
        className={`animate-pulse rounded-md bg-gray-200 ${className}`}
    />
);

export default function LoginSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div>
                    <Skeleton className="h-5 w-24" />
                    <div className="mt-1">
                        <Skeleton className="h-12 w-full" />
                    </div>
                </div>
                <div>
                    <Skeleton className="h-5 w-20" />
                    <div className="mt-1">
                        <Skeleton className="h-12 w-full" />
                    </div>
                </div>
            </div>

            <Skeleton className="h-12 w-full" />

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
            </div>
            <Skeleton className="h-12 w-full" />
        </div>
    );
}