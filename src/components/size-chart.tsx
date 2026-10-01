import { SIZE_CHART } from "@/lib/config";

export function SizeChart() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line">
            {SIZE_CHART.headers.map((h) => <th key={h} className="py-2 pr-4 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {SIZE_CHART.rows.map((r) => (
            <tr key={r[0]} className="border-b border-line/60">
              {r.map((c, i) => <td key={i} className={`py-2 pr-4 ${i === 0 ? "font-medium" : "text-muted"}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted">Measurements in inches. Between sizes? Size up for a relaxed fit.</p>
    </div>
  );
}
