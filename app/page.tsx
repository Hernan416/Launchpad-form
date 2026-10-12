import Link from "next/link";
import { LaunchPadLogo } from "@/components/LaunchPadLogo";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-brand-bg px-6 text-center">
      <LaunchPadLogo className="h-12 w-auto" />
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/v1"
          className="rounded-brand bg-brand-blue px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark"
        >
          Form 1
        </Link>
        <Link
          href="/v2"
          className="rounded-brand border border-brand-line px-8 py-3 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-surface"
        >
          Form 2
        </Link>
      </div>
    </div>
  );
}
