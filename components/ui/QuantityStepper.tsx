"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  value: number;
  onChange: (next: number) => void;
  label: string;
  decreaseLabel: string;
  increaseLabel: string;
  min?: number;
  max?: number;
  disabled?: boolean;
};

/** − value + pill. Buttons stay active at the limits and simply do nothing, per the design system. */
export function QuantityStepper({ value, onChange, label, decreaseLabel, increaseLabel, min = 0, max = 10, disabled }: Props) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-surface p-1", disabled && "opacity-60")} role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label={decreaseLabel} className="grid size-9 place-items-center rounded-full hover:bg-card">
        <Minus aria-hidden className="size-4" />
      </button>
      <output aria-live="polite" className="w-7 text-center font-medium tabular-nums">
        {value}
      </output>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label={increaseLabel} className="grid size-9 place-items-center rounded-full hover:bg-card">
        <Plus aria-hidden className="size-4" />
      </button>
    </span>
  );
}
