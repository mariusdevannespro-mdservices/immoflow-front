import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Home, CheckCircle } from 'lucide-react'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Home className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />
            <span className="text-2xl font-semibold">ImmoFlow</span>
          </div>
          <h1 className="mb-2">Mot de passe oublié ?</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Nous vous enverrons un lien pour réinitialiser votre mot de passe
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          {!submitted ? (
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
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-gray-100"
                    placeholder="vous@exemple.fr"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-6 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
              >
                Envoyer le lien
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />
              </div>
              <h2 className="mb-2">Email envoyé !</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>. Vérifiez votre boîte de réception.
              </p>

              <Link
                to="/login"
                className="text-emerald-600 dark:text-emerald-500 hover:underline"
              >
                Retour à la connexion
              </Link>
            </div>
          )}

          {!submitted && (
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-500"
              >
                ← Retour à la connexion
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
