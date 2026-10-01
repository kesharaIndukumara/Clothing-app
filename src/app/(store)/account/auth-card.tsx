export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="container-x flex justify-center py-14">
      <div className="w-full max-w-md rounded-2xl border border-line bg-card p-7 sm:p-9">
        <h1 className="font-display text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
