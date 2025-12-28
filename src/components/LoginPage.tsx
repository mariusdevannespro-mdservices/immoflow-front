import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, Home } from 'lucide-react'

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin()
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Home className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />
            <span className="text-2xl font-semibold">ImmoFlow</span>
          </div>
          <h1 className="mb-2">Connexion</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Accédez à votre tableau de bord
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="vous@exemple.fr"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-emerald-600 border-gray-300 rounded" />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Se souvenir de moi
                </span>
              </label>

              <Link
                to="/forgot-password"
                className="text-sm text-emerald-600 dark:text-emerald-500 hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-6 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
            >
              Se connecter
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pas encore de compte ?{' '}
              <Link to="/signup" className="text-emerald-600 dark:text-emerald-500 hover:underline">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-500"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
