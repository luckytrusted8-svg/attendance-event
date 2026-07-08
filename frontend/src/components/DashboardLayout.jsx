import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout({ title, subtitle, actions, children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 max-w-full min-w-0">
        {/* Sticky topbar — stays visible while scrolling the page content */}
        <div className="sticky top-0 z-30 bg-slate-50/90 backdrop-blur border-b border-slate-200 px-8 py-4">
          <Topbar />
        </div>

        <div className="px-8 py-6">
          {title && (
            <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
              <div>
                <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">{title}</h1>
                {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
              </div>
              {actions && <div className="flex items-center gap-3">{actions}</div>}
            </div>
          )}

          {children}
        </div>
      </main>
    </div>
  );
}