import { Pause, Play, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PRESETS = [60, 90, 120, 180];

type Props = {
  defaultSeconds: number;
  onFinished: () => void;
  onClose: () => void;
};

/** Full-width rest timer. Advances the workout automatically when it hits zero. */
export function RestTimer({ defaultSeconds, onFinished, onClose }: Props) {
  const [total, setTotal] = useState(defaultSeconds);
  const [left, setLeft] = useState(defaultSeconds);
  const [running, setRunning] = useState(true);
  const [custom, setCustom] = useState("");
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (left === 0 && !finishedRef.current) {
      finishedRef.current = true;
      setRunning(false);
      if (typeof navigator !== "undefined" && "vibrate" in navigator)
        navigator.vibrate?.([200, 100, 200]);
      onFinished();
    }
  }, [left, onFinished]);

  function set(seconds: number) {
    finishedRef.current = false;
    setTotal(seconds);
    setLeft(seconds);
    setRunning(true);
  }

  const pct = total > 0 ? ((total - left) / total) * 100 : 0;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className="surface glow-primary p-4">
      <div className="flex items-center justify-between">
        <p className="label-caps">Rest timer</p>
        <button onClick={onClose} aria-label="Close rest timer" className="text-muted-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      <p className="mt-1 text-center font-mono text-6xl font-bold tabular-nums text-primary">
        {mm}:{ss}
      </p>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p}
            variant={total === p ? "default" : "secondary"}
            className="h-11"
            onClick={() => set(p)}
          >
            {p}s
          </Button>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        <Input
          inputMode="numeric"
          placeholder="Custom seconds"
          value={custom}
          onChange={(e) => setCustom(e.target.value.replace(/\D/g, ""))}
          className="h-11"
        />
        <Button
          variant="secondary"
          className="h-11"
          onClick={() => custom && set(Number(custom))}
          disabled={!custom}
        >
          Set
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-11 w-11"
          onClick={() => setRunning((r) => !r)}
        >
          {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        <Button variant="secondary" size="icon" className="h-11 w-11" onClick={() => set(total)}>
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
