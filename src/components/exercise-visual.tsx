import { useEffect, useState } from "react";
import { Dumbbell } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  name: string;
  gifUrl?: string | null | undefined;
  imageUrl?: string | null | undefined;
  muscle?: string | null | undefined;
  className?: string | undefined;
};

/**
 * Renders exercise media. When both a start frame (image) and end frame (gif slot)
 * exist, the two are cross-faded to animate the movement. Falls back to a branded tile.
 */
export function ExerciseVisual({ name, gifUrl, imageUrl, muscle, className }: Props) {
  const frames = [imageUrl, gifUrl].filter(Boolean) as string[];
  const [frame, setFrame] = useState(0);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    if (frames.length < 2) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % 2), 1100);
    return () => clearInterval(id);
  }, [frames.length]);

  if (frames.length && !broken) {
    return (
      <div className={cn("relative overflow-hidden rounded-xl bg-elevated", className)}>
        {frames.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`${name} demonstration`}
            loading="lazy"
            onError={() => setBroken(true)}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
              frames.length < 2 || i === frame ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-border bg-elevated",
        className,
      )}
    >
      <Dumbbell className="h-8 w-8 text-primary" strokeWidth={1.5} />
      <p className="label-caps">{muscle ?? "No media yet"}</p>
    </div>
  );
}
