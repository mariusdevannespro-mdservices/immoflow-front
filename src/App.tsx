import { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { Routes, Route, Navigate, Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { Home, CreditCard, User, LayoutDashboard, ListChecks, Columns3, Menu, X, Sun, Moon } from 'lucide-react'
import { useAuth0 } from '@auth0/auth0-react'

import { LandingPage } from './components/LandingPage'
import { PricingPage } from './components/PricingPage'
import { ForgotPasswordPage } from './components/ForgotPasswordPage'
import { Dashboard } from './components/Dashboard'
import { ProjectForm } from './components/ProjectForm'
import { ResultsPage } from './components/ResultsPage'
import { ComparisonPage } from './components/ComparisonPage'
import { PDFExportPage } from './components/PDFExportPage'
import { ProfilePage } from './components/ProfilePage'
import { BillingPage } from './components/BillingPage'
import { LegalPage } from './components/LegalPage'
import { ProjectsResultsSplitPage } from './components/ProjectsResultsSplitPage'
import { SimulationInvestissementLocatifPage } from "./components/seo/SimulationInvestissementLocatifPage"
import { CashflowImmobilierPage } from "./components/seo/CashflowImmobilierPage"
import { CalculRentabiliteLocativePage } from "./components/seo/CalculRentabiliteLocativePage"
import { RentabiliteLMNPPage } from "./components/seo/RentabiliteLMNPPage"
import { ProjectsAPI } from "../src/services/projects.api"

const MAINTENANCE =
  String(import.meta.env.VITE_MAINTENANCE ?? "").toLowerCase() === "true" ||
  String(import.meta.env.VITE_MAINTENANCE ?? "") === "1"

const MAINTENANCE_MESSAGE =
  import.meta.env.VITE_MAINTENANCE_MESSAGE ?? "Site en maintenance."


// ✅ NEW (page publique simulateur rapide)
import { PublicQuickSimPage } from './components/PublicQuickSimPage'

/* ===================== THEME ===================== */
type ThemeContextType = { isDark: boolean; toggleTheme: () => void }
const ThemeContext = createContext<ThemeContextType>({ isDark: false, toggleTheme: () => {} })
export const useTheme = () => useContext(ThemeContext)

/* ===================== ME CONTEXT ===================== */
type Me = {
  id?: string
  email?: string | null
  avatarKey?: string | null

  theme?: 'light' | 'dark' | null

  plan?: string
  hasStartedFree?: boolean
  stripeStatus?: string | null
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
} | null

type MeContextType = {
  me: Me
  meLoading: boolean
  refreshMe: () => Promise<void>
}

const MeContext = createContext<MeContextType>({
  me: null,
  meLoading: false,
  refreshMe: async () => {},
})

export const useMe = () => useContext(MeContext)

/* ===================== ROUTE GUARDS ===================== */
function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth0()

  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/" replace />
  return <Outlet />
}

function ProRoute() {
  const { me, meLoading } = useMe()
  const navigate = useNavigate()
  const location = useLocation()

  if (meLoading) return null
  if (!me) return null

  if (me.plan === 'pro' || me.plan === 'pro_plus') return <Outlet />

  const goBackOrDashboard = () => {
    const from = (location.state as any)?.from as string | undefined
    if (from) {
      navigate(from, { replace: true })
      return
    }

    try {
      navigate(-1)
      setTimeout(() => {
        if (window.location.pathname === location.pathname) {
          navigate('/dashboard', { replace: true })
        }
      }, 0)
    } catch {
      navigate('/dashboard', { replace: true })
    }
  }

  const goUpgrade = () => {
    navigate('/upgrade', { replace: false, state: { from: location.pathname } })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={goBackOrDashboard} />

      <div className="relative w-[92%] max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-6">
        <h2 className="text-xl font-semibold mb-2">Accès réservé au plan Pro</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Ton compte est en <b>FREE</b>, tu n’as pas accès à cette page.
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={goBackOrDashboard}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            type="button"
          >
            Annuler
          </button>
          <button
            onClick={goUpgrade}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            type="button"
          >
            Voir les offres
          </button>
        </div>
      </div>
    </div>
  )
}

/* ===================== LAYOUTS ===================== */
function PublicLayout() {
  const { isAuthenticated, isLoading } = useAuth0()
  const authed = !isLoading && isAuthenticated

  return (
    <>
      <PublicNav isAuthenticated={authed} />
      <main>
        <Outlet />
      </main>
    </>
  )
}

function PrivateLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

/* ===================== POST AUTH / POST CHECKOUT ===================== */
function PostAuthRedirect() {
  const navigate = useNavigate()
  const { me, meLoading, refreshMe } = useMe()

  useEffect(() => {
    if (!me && !meLoading) void refreshMe()
  }, [me, meLoading, refreshMe])

  useEffect(() => {
    if (meLoading) return
    if (!me) return
    if (typeof window !== "undefined" && (window as any).gtag) {
      ;(window as any).gtag('event', 'sign_up', { method: 'auth0' })
    }
    navigate('/dashboard', { replace: true })
  }, [me, meLoading, navigate])

  return null
}


function PostCheckoutRedirect() {
  const navigate = useNavigate()
  const { me, meLoading, refreshMe } = useMe()

  useEffect(() => {
    void refreshMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (meLoading) return
    if (!me) return

    if (me.plan === 'pro' || me.plan === 'pro_plus') navigate('/dashboard', { replace: true })
    else navigate('/upgrade', { replace: true })
  }, [me, meLoading, navigate])

  return null
}

/* ===================== HOME ROUTE REDIRECT ===================== */
function HomeRoute() {
  const { isAuthenticated, isLoading } = useAuth0()
  if (isLoading) return null
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <LandingPage />
}

function FallbackRedirect() {
  const { isAuthenticated, isLoading } = useAuth0()
  if (isLoading) return null
  return <Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />
}

/* ===================== APP ===================== */
export default function App() {
  const { isAuthenticated, getAccessTokenSilently, logout } = useAuth0()
  const [me, setMe] = useState<Me>(null)
  const [meLoading, setMeLoading] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

  // ✅ theme local state
  const [isDark, setIsDark] = useState(false)

  const saveThemeToApi = async (nextIsDark: boolean) => {
    if (!isAuthenticated) return
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          scope: 'openid profile email',
        },
      })

      await fetch(`${API_URL}/api/me/theme`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: nextIsDark ? 'dark' : 'light' }),
      })
    } catch (e) {
      console.error('saveTheme error:', e)
    }
  }

  const toggleTheme = () => {
    setIsDark((v) => {
      const next = !v
      void saveThemeToApi(next)
      return next
    })
  }

  const themeValue = useMemo(() => ({ isDark, toggleTheme }), [isDark])

  const refreshMe = async () => {
    try {
      setMeLoading(true)

      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          scope: "openid profile email offline_access",
        },
      })

      const res = await fetch(`${API_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json()
      setMe(data)
    } catch (e: any) {
      console.error("refreshMe error:", e)
      setMe(null)

      const err = e?.error || e?.code
      if (err === "missing_refresh_token" || err === "login_required") {
        logout({ logoutParams: { returnTo: window.location.origin } })
      }
    } finally {
      setMeLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      setMe(null)
      setIsDark(false)
      return
    }
    void refreshMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  const meValue = useMemo(() => ({ me, meLoading, refreshMe }), [me, meLoading])

  if (MAINTENANCE) {
    return (
      <div className={isDark ? "dark" : ""}>
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex items-center justify-center px-6">
          <div className="max-w-lg w-full text-center">
            <h1 className="text-2xl font-semibold mb-2">Maintenance</h1>
            <p className="text-gray-600 dark:text-gray-400">{MAINTENANCE_MESSAGE}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ThemeContext.Provider value={themeValue}>
      <MeContext.Provider value={meValue}>
        <div className={isDark ? 'dark' : ''}>
          <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomeRoute />} />
                <Route path="/pricing" element={<PricingPage />} />

                {/* ✅ NEW: simulateur public sans compte */}
                <Route path="/simulateur-gratuit" element={<PublicQuickSimPage />} />

                {/* SEO pages */}
                <Route path="/simulation-investissement-locatif" element={<SimulationInvestissementLocatifPage />} />
                <Route path="/cashflow-immobilier" element={<CashflowImmobilierPage />} />
                <Route path="/calcul-rentabilite-locative" element={<CalculRentabiliteLocativePage />} />
                <Route path="/rentabilite-lmnp" element={<RentabiliteLMNPPage />} />

                <Route path="/login" element={<AuthRedirect mode="login" />} />
                <Route path="/signup" element={<AuthRedirect mode="signup" />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/terms" element={<LegalPage type="terms" />} />
                <Route path="/privacy" element={<LegalPage type="privacy" />} />
                <Route path="/legal" element={<LegalPage type="legal" />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route path="/post-auth" element={<PostAuthRedirect />} />
                <Route path="/post-checkout" element={<PostCheckoutRedirect />} />

                <Route element={<PrivateLayout />}>
                  <Route path="/dashboard" element={<DashboardWrapper />} />

                  <Route path="/projects/new" element={<ProjectForm mode="create" />} />
                  <Route path="/projects/:id/edit" element={<ProjectForm mode="edit" />} />

                  <Route path="/projects/results" element={<ProjectsResultsSplitPage />} />
                  <Route path="/projects/results/:projectId" element={<ProjectsResultsSplitPage />} />

                  <Route path="/projects/:projectId/results" element={<ResultsPage />} />

                  <Route path="/upgrade" element={<PricingPage />} />

                  <Route element={<ProRoute />}>
                    <Route path="/projects/:projectId/pdf" element={<PDFExportPage />} />
                    <Route path="/comparison" element={<ComparisonPage />} />
                  </Route>

                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/billing" element={<BillingPage />} />
                </Route>
              </Route>

              <Route path="*" element={<FallbackRedirect />} />
            </Routes>
          </div>
        </div>
      </MeContext.Provider>
    </ThemeContext.Provider>
  )
}

/* ===================== HELPERS ===================== */
function AuthRedirect({ mode }: { mode: 'login' | 'signup' }) {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0()

  useEffect(() => {
    if (isLoading || isAuthenticated) return
    void loginWithRedirect({
      appState: { returnTo: '/post-auth' },
      authorizationParams: mode === 'signup' ? { screen_hint: 'signup' } : undefined,
    })
  }, [isLoading, isAuthenticated, loginWithRedirect, mode])

  if (!isLoading && isAuthenticated) return <Navigate to="/post-auth" replace />
  return null
}

function DashboardWrapper() {
  const navigate = useNavigate()
  const { getAccessTokenSilently } = useAuth0()

  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let alive = true

    ;(async () => {
      try {
        // ✅ même méthode que ton Dashboard
        const list = await ProjectsAPI.list(getAccessTokenSilently)

        if (!alive) return

        if (!list || list.length === 0) {
          navigate("/projects/new", { replace: true })
          return
        }
      } catch (e) {
        // si erreur, on laisse afficher le dashboard (il gérera error state)
        console.error("DashboardWrapper check projects error:", e)
      } finally {
        if (alive) setChecking(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [getAccessTokenSilently, navigate])

  if (checking) return null

  return (
    <Dashboard
      onCreateProject={() => navigate("/projects/new")}
      onSelectProject={(id) => navigate(`/projects/${id}/edit`)}
      onViewResults={(id) => navigate(`/projects/${id}/results`)}
    />
  )
}


/* ===================== NAVS ===================== */
function PublicNav({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isDark, toggleTheme } = useTheme()
  const { loginWithRedirect } = useAuth0()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${isActive ? 'text-emerald-600 dark:text-emerald-500' : 'text-gray-600 dark:text-gray-300'} hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors`

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2 cursor-pointer">
            <Home className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
            <span className="font-semibold">ImmoFlow</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {!isAuthenticated && (
              <NavLink to="/" className={linkClass} end>
                Accueil
              </NavLink>
            )}

            <NavLink to={isAuthenticated ? '/upgrade' : '/pricing'} className={linkClass}>
              Tarifs
            </NavLink>

            <button
              onClick={toggleTheme}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors"
              aria-label="Toggle theme"
              type="button"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {isAuthenticated ? (
              <Link to="/dashboard" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                Continuer
              </Link>
            ) : (
              <>
                <button
                  onClick={() => loginWithRedirect({ appState: { returnTo: '/post-auth' } })}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors"
                  type="button"
                >
                  Connexion
                </button>
                <Link
                  to="/simulateur-gratuit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Tester gratuitement
                </Link>
              </>
            )}
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-600 dark:text-gray-300" type="button">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col gap-4">
              {!isAuthenticated && (
                <Link onClick={() => setMobileMenuOpen(false)} to="/" className="text-left text-gray-700 dark:text-gray-300">
                  Accueil
                </Link>
              )}

              <Link
                onClick={() => setMobileMenuOpen(false)}
                to={isAuthenticated ? '/upgrade' : '/pricing'}
                className="text-left text-gray-700 dark:text-gray-300"
              >
                Tarifs
              </Link>

              <button onClick={toggleTheme} className="text-left text-gray-700 dark:text-gray-300 flex items-center gap-2" type="button">
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                {isDark ? 'Mode clair' : 'Mode sombre'}
              </button>

              {isAuthenticated ? (
                <Link onClick={() => setMobileMenuOpen(false)} to="/dashboard" className="text-left px-4 py-2 bg-emerald-600 text-white rounded-lg">
                  Continuer
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => loginWithRedirect({ appState: { returnTo: '/post-auth' } })}
                    className="text-left text-gray-700 dark:text-gray-300"
                    type="button"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() =>
                      loginWithRedirect({
                        appState: { returnTo: '/post-auth' },
                        authorizationParams: { screen_hint: 'signup' },
                      })
                    }
                    className="text-left px-4 py-2 bg-emerald-600 text-white rounded-lg"
                    type="button"
                  >
                    Tester gratuitement
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

function Sidebar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isDark, toggleTheme } = useTheme()
  const { logout } = useAuth0()

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects/results', label: 'Résultats rapides', icon: ListChecks },
    { to: '/comparison', label: 'Comparaison', icon: Columns3 },
    { to: '/profile', label: 'Profil', icon: User },
    { to: '/billing', label: 'Facturation', icon: CreditCard },
  ]

  const itemClass = ({ isActive }: { isActive: boolean }) =>
    `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive
        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Home className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
          <span className="font-semibold">ImmoFlow</span>
        </Link>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.to} to={item.to} className={itemClass} onClick={() => setMobileMenuOpen(false)}>
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mb-2"
          type="button"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span>{isDark ? 'Mode clair' : 'Mode sombre'}</span>
        </button>

        <button
          onClick={() => logout({ logoutParams: { returnTo: import.meta.env.VITE_AUTH0_LOGOUT_URI } })}
          className="w-full px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          type="button"
        >
          Déconnexion
        </button>
      </div>
    </>
  )

  return (
    <>
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-gray-600 dark:text-gray-300"
        type="button"
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-64 h-full bg-white dark:bg-gray-900 shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <SidebarContent />
          </div>
        </div>
      )}

      <aside className="hidden lg:flex lg:flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        <SidebarContent />
      </aside>
    </>
  )
}
