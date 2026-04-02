import { useState, useEffect, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { ThemeToggle } from '../ui'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { theme } = useTheme()

  const isDark = theme === 'dark'

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const asideWidthMd = sidebarCollapsed ? 'md:w-16' : 'md:w-56'
  const asideTransformMobile = mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
  const showNavLabels = !sidebarCollapsed || mobileMenuOpen

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <header className={`fixed top-0 left-0 right-0 h-14 backdrop-blur z-50 flex items-center justify-between px-4 border-b transition-colors ${
        isDark 
          ? 'bg-slate-900/80 border-slate-800' 
          : 'bg-white/80 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className={`rounded-lg p-2 -ml-1 md:hidden transition-colors ${
              isDark
                ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
            aria-expanded={mobileMenuOpen}
            aria-controls="app-sidebar"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          <img 
            src={isDark ? '/EMBI_logo_final_all_white.png' : '/EMBI_logo_final_all_black.png'} 
            alt="EMBI"
            className="h-8"
          />
        </div>
        <ThemeToggle />
      </header>

      {mobileMenuOpen && (
        <div
          className={`fixed inset-0 top-14 z-30 md:hidden ${
            isDark ? 'bg-slate-950/60' : 'bg-slate-900/40'
          }`}
          aria-hidden="true"
          onClick={() => setMobileMenuOpen(false)}
          role="presentation"
        />
      )}

      <aside 
        id="app-sidebar"
        className={`fixed left-0 top-14 bottom-0 border-r transition-all duration-300 z-40 flex flex-col ${asideTransformMobile} md:translate-x-0 ${
          isDark 
            ? 'bg-slate-900/60 border-slate-800' 
            : 'bg-white/60 border-slate-200'
        } w-56 ${asideWidthMd}`}
      >
        <nav className="flex-1 px-2 py-2 overflow-y-auto">
          <div className="space-y-1">
            <Link
              to="/"
              title="Dashboard"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/'
                  ? isDark 
                    ? 'bg-violet-600/20 text-violet-300' 
                    : 'bg-violet-100 text-violet-700'
                  : isDark 
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {showNavLabels && <span>Dashboard</span>}
            </Link>

            <div className="pt-2">
              {showNavLabels && (
                <span className={`px-3 text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  Variaciones
                </span>
              )}
            </div>

            <Link
              to="/variaciones/revenue"
              title="Variaciones Revenue"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/variaciones/revenue'
                  ? isDark 
                    ? 'bg-violet-600/20 text-violet-300' 
                    : 'bg-violet-100 text-violet-700'
                  : isDark 
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {showNavLabels && <span>Revenue</span>}
            </Link>

            <Link
              to="/variaciones/impressions"
              title="Variaciones Impressions"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/variaciones/impressions'
                  ? isDark 
                    ? 'bg-violet-600/20 text-violet-300' 
                    : 'bg-violet-100 text-violet-700'
                  : isDark 
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {showNavLabels && <span>Impressions</span>}
            </Link>

            <div className="pt-4 pb-2">
              {showNavLabels && (
                <span className={`px-3 text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  Media Buyers
                </span>
              )}
            </div>

            <Link
              to="/media-buyers/sasha-balbi"
              title="Sasha Balbi"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/media-buyers/sasha-balbi'
                  ? isDark 
                    ? 'bg-violet-600/20 text-violet-300' 
                    : 'bg-violet-100 text-violet-700'
                  : isDark 
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {showNavLabels && <span>Sasha Balbi</span>}
            </Link>

            <Link
              to="/media-buyers/embi-media"
              title="Embi Media"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/media-buyers/embi-media'
                  ? isDark 
                    ? 'bg-violet-600/20 text-violet-300' 
                    : 'bg-violet-100 text-violet-700'
                  : isDark 
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {showNavLabels && <span>Embi Media</span>}
            </Link>
          </div>
        </nav>

        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          className={`hidden md:block p-3 transition-colors border-t ${
            isDark 
              ? 'text-slate-400 hover:text-violet-300 border-slate-800' 
              : 'text-slate-500 hover:text-violet-600 border-slate-200'
          }`}
        >
          <svg className={`h-5 w-5 mx-auto transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </aside>

      <main
        className={`pt-14 transition-all duration-300 ${
          sidebarCollapsed ? 'md:pl-16' : 'md:pl-56'
        }`}
      >
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
