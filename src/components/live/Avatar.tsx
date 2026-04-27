const PALETTE = [
  "from-rose-400 to-pink-600",
  "from-orange-400 to-red-500",
  "from-amber-400 to-orange-600",
  "from-lime-400 to-green-600",
  "from-emerald-400 to-teal-600",
  "from-cyan-400 to-blue-600",
  "from-sky-400 to-indigo-600",
  "from-violet-400 to-purple-600",
  "from-fuchsia-400 to-pink-600",
  "from-slate-400 to-slate-700",
] as const;

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function getAvatar(seed: string, displayName: string): {
  initial: string;
  gradient: string;
} {
  const trimmed = displayName.trim();
  const initial = trimmed.length > 0 ? trimmed[0].toUpperCase() : "?";
  const gradient = PALETTE[hash(seed || displayName) % PALETTE.length];
  return { initial, gradient };
}

interface AvatarProps {
  seed: string;
  displayName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "h-7 w-7 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-2xl",
} as const;

export function Avatar({ seed, displayName, size = "md", className }: AvatarProps) {
  const { initial, gradient } = getAvatar(seed, displayName);
  return (
    <div
      className={`shrink-0 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-semibold text-white ${SIZE_CLASSES[size]} ${className ?? ""}`}
      aria-label={`${displayName} avatar`}
    >
      {initial}
    </div>
  );
}
