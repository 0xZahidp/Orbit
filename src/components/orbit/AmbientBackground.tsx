import { cn } from "@/lib/utils";

// Subtle grid + soft orbit rings + ambient particles. Fixed, non-interactive.
export function AmbientBackground({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}
      aria-hidden
    >
      <div className="absolute inset-0 grid-bg opacity-70" />
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />

      {/* Soft glowing orbit lines */}
      <div className="absolute left-1/2 top-[-30%] h-[70vw] w-[70vw] -translate-x-1/2 rounded-full border border-cyan/10 animate-float" />
      <div className="absolute left-1/2 top-[-24%] h-[52vw] w-[52vw] -translate-x-1/2 rounded-full border border-violet/10" />
      <div className="absolute right-[-10%] bottom-[-20%] h-[40vw] w-[40vw] rounded-full border border-cyan/10" />

      {/* Glow blobs */}
      <div className="absolute left-[10%] top-[8%] h-64 w-64 rounded-full bg-cyan/10 blur-[100px]" />
      <div className="absolute right-[8%] top-[30%] h-72 w-72 rounded-full bg-violet/10 blur-[110px]" />

      {/* Ambient particles */}
      {[...Array(14)].map((_, i) => (
        <span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-cyan/40 animate-float"
          style={{
            left: `${(i * 37) % 100}%`,
            top: `${(i * 53) % 100}%`,
            animationDelay: `${i * 0.6}s`,
            animationDuration: `${6 + (i % 5)}s`,
          }}
        />
      ))}
    </div>
  );
}
