"use client";
export function PrintButton() {
  return <button onClick={() => window.print()} className="btn-outline btn-sm">Print packing slip</button>;
}
