import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  Bot,
  Building2,
  Cpu,
  Database,
  FileSpreadsheet,
  FileText,
  GitBranch,
  Home,
  Info,
  Layers,
  Menu,
  Sparkles,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { DatasetMode } from '../types/healthcare';
import { LanguageCode, NavPageId, TRANSLATIONS } from '../i18n/translations';

interface LayoutProps {
  activePage: NavPageId;
  onNavigate: (page: NavPageId) => void;
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  mode: DatasetMode;
  filename: string;
  totalRows: number;
  onQuickUploadClick: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: Array<{ id: NavPageId; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'home', icon: Home },
  { id: 'dashboard', icon: Activity },
  { id: 'data-collection', icon: FileSpreadsheet },
  { id: 'data-preprocessing', icon: Sparkles },
  { id: 'data-warehouse', icon: Database },
  { id: 'etl-process', icon: GitBranch },
  { id: 'disease-pattern', icon: Cpu },
  { id: 'patient-segmentation', icon: Users },
  { id: 'healthcare-analytics', icon: BarChart3 },
  { id: 'olap-explorer', icon: Layers },
  { id: 'ai-assistant', icon: Bot },
  { id: 'hospital-insights', icon: Building2 },
  { id: 'reports', icon: FileText },
  { id: 'about-project', icon: Info },
];

export const Layout: React.FC<LayoutProps> = ({
  activePage,
  onNavigate,
  language,
  onLanguageChange,
  mode,
  filename,
  totalRows,
  onQuickUploadClick,
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = TRANSLATIONS[language];

  const handleNav = (id: NavPageId) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      <div className="px-5 py-5 border-b border-slate-200">
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-md"
        >
          <span className="block font-display text-lg font-bold tracking-tight text-[#0F2942]">
            {t.brandName}
          </span>
          <span className="mt-0.5 block text-xs text-slate-500 leading-snug">
            Healthcare Analytics System
          </span>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5" aria-label="Primary Navigation">
        {NAV_ITEMS.map(({ id, icon: Icon }) => {
          const isActive = activePage === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleNav(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors text-left whitespace-nowrap ${
                isActive
                  ? 'bg-[#0F2942] text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-300' : 'text-slate-400'}`}
              />
              <span className="truncate">{t.nav[id]}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 bg-slate-50/70">
        <div className="text-xs font-medium text-slate-700">
          {mode === 'demonstration' ? t.demoBadge : t.uploadedBadge}
        </div>
        <div className="mt-1 text-xs text-slate-500 truncate font-mono tabular-nums">
          {filename} · {totalRows.toLocaleString()} rows
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb/Title — Language Selector — Primary Upload CTA */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-700 whitespace-nowrap">{t.brandName}</span>
                <span aria-hidden="true">/</span>
                <span className="truncate">{t.nav[activePage]}</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span
                  className={
                    mode === 'demonstration' ? 'text-amber-700 font-medium' : 'text-emerald-700 font-medium'
                  }
                >
                  {mode === 'demonstration' ? t.demoBadge : t.uploadedBadge}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{totalRows.toLocaleString()} {t.common.records}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div
              className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200"
              role="group"
              aria-label="Language selector"
            >
              {(
                [
                  { code: 'en', label: 'EN' },
                  { code: 'ta', label: 'தமிழ்' },
                  { code: 'hi', label: 'हिन्दी' },
                ] as const
              ).map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => onLanguageChange(lang.code)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    language === lang.code
                      ? 'bg-white text-[#0F2942] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onQuickUploadClick}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2942] hover:bg-sky-900 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{t.uploadCsvBtn}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
