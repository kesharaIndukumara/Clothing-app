"use client";
export function QtyStepper({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="inline-flex items-center rounded-full border border-line">
      <button type="button" className="h-8 w-8 text-lg leading-none" onClick={() => onChange(value - 1)} aria-label="Decrease">−</button>
      <span className="w-6 text-center text-sm">{value}</span>
      <button type="button" className="h-8 w-8 text-lg leading-none disabled:opacity-30" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="Increase">+</button>
    </div>
  );
}
