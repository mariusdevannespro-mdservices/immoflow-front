import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, User, Home } from 'lucide-react'

export function SignupPage({ onSignup }: { onSignup: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSignup()
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Home className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />
            <span className="text-2xl font-semibold">ImmoFlow</span>
          </div>
          <h1 className="mb-2">Créer un compte</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Commencez à analyser vos investissements gratuitement
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-gray-100"
                  placeholder="Jean Dupont"
                  required
                />
              </div>
            </div>

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
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-gray-100"
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
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-gray-100"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Au moins 8 caractères
              </p>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                className="w-4 h-4 mt-1 text-emerald-600 border-gray-300 rounded"
                required
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                J'accepte les{' '}
                <Link to="/terms" className="text-emerald-600 dark:text-emerald-500 hover:underline">
                  conditions d'utilisation
                </Link>{' '}
                et la{' '}
                <Link to="/privacy" className="text-emerald-600 dark:text-emerald-500 hover:underline">
                  politique de confidentialité
                </Link>
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-6 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
            >
              Créer mon compte
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Vous avez déjà un compte ?{' '}
              <Link to="/login" className="text-emerald-600 dark:text-emerald-500 hover:underline">
                Se connecter
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
