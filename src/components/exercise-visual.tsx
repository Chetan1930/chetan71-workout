import { Dumbbell } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  name: string;
  gifUrl?: string | null;
  imageUrl?: string | null;
  muscle?: string | null;
  className?: string;
};

/** Renders exercise media when an admin has uploaded a GIF/image, otherwise a branded fallback. */
export function ExerciseVisual({ name, gifUrl, imageUrl, muscle, className }: Props) {
  const src = gifUrl || imageUrl;

  if (src) {
    return (
      <img
        src={src}
        alt={`${name} demonstration`}
        loading="lazy"
        className={cn("w-full rounded-xl object-cover", className)}
      />
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
