export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <section className="w-full max-w-xl rounded-xl border border-card-border bg-surface p-10 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand">
          Alpha Integrated Management System
        </p>
        <h1 className="mt-3 text-4xl font-bold text-strong">AIMSCAMS</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          SACCO and microfinance back office for Tanzania. Phase 0 scaffold is running;
          the shell and Dashboard arrive in Phase 1.
        </p>
        <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-card-border pt-6 text-sm">
          <div>
            <dt className="text-label">Web</dt>
            <dd className="mt-1 font-medium text-strong">Next.js 16</dd>
          </div>
          <div>
            <dt className="text-label">API</dt>
            <dd className="mt-1 font-medium text-strong">NestJS 12</dd>
          </div>
          <div>
            <dt className="text-label">Database</dt>
            <dd className="mt-1 font-medium text-strong">PostgreSQL + Prisma</dd>
          </div>
          <div>
            <dt className="text-label">Queue</dt>
            <dd className="mt-1 font-medium text-strong">Redis + BullMQ</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
