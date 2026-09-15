import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 font-semibold text-lg">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
          TB
        </span>
        <span>TransitBook</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
