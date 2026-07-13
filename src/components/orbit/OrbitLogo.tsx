import { cn } from "@/lib/utils";

export function OrbitLogo({
  className,
  showWord = true,
}: {
  className?: string;
  showWord?: boolean;
}) {
  const src = showWord ? "/orbit-logo.png" : "/orbit-mark.png";

  return (
    <div className={cn("flex items-center", className)}>
      <img
        src={src}
        alt={showWord ? "Orbit" : ""}
        aria-hidden={!showWord}
        className={cn(showWord ? "h-11 w-auto" : "h-9 w-9", "shrink-0 object-contain")}
        draggable={false}
      />
    </div>
  );
}
