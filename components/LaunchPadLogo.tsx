import Image from "next/image";

export function LaunchPadLogo({ className }: { className?: string }) {
  return (
    <span className="inline-flex items-center rounded-brand bg-white px-4 py-2 shadow-soft">
      <Image
        src="/logo.png"
        alt="LaunchPad"
        width={200}
        height={50}
        priority
        className={className}
      />
    </span>
  );
}
