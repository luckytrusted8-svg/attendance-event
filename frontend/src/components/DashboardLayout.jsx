import Sidebar from './Sidebar';

export default function DashboardLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen bg-brand-50">
      <Sidebar />
      <main className="flex-1 px-8 py-8 max-w-full overflow-x-hidden">
        {title && (
          <div className="mb-6">
            <h1 className="font-display text-2xl text-ink-900">{title}</h1>
            {subtitle && <p className="text-sm text-ink-700/60 mt-1">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
