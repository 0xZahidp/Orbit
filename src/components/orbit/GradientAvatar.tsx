import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

export function GradientAvatar({
  name,
  gradient,
  size = 40,
  className,
}: {
  name: string;
  gradient: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-display font-bold text-primary-foreground",
        gradient,
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  );
}
