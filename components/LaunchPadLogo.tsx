import Image from "next/image";

export function LaunchPadLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="LaunchPad"
      width={563}
      height={125}
      priority
      className={className}
    />
  );
}
