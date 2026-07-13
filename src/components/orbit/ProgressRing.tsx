import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number; // 0..1
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
  variant?: "cyan" | "success" | "warning" | "violet";
}

const stroke: Record<NonNullable<ProgressRingProps["variant"]>, string> = {
  cyan: "var(--cyan)",
  success: "var(--success)",
  warning: "var(--warning)",
  violet: "var(--violet)",
};

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  className,
  children,
  variant = "cyan",
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);

  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke[variant]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.9s cubic-bezier(0.16,1,0.3,1)",
            filter: "drop-shadow(0 0 6px currentColor)",
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
