// src/components/ProfilePage.tsx
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useMe } from '../App'
import { apiFetch } from "../lib/api"
import {
  User as UserIcon,
  Mail,
  Shield,
  KeyRound,
  Home,
  Building2,
  Key,
  BarChart3,
  MapPin,
  Hammer,
  Save,
  Trash2,
  AlertTriangle,
} from 'lucide-react'

type AvatarKey = 'home' | 'building' | 'key' | 'chart' | 'map' | 'hammer'

const AVATARS: { key: AvatarKey; label: string; Icon: any }[] = [
  { key: 'home', label: 'Maison', Icon: Home },
  { key: 'building', label: 'Immeuble', Icon: Building2 },
  { key: 'key', label: 'Clés', Icon: Key },
  { key: 'chart', label: 'Rendement', Icon: BarChart3 },
  { key: 'map', label: 'Localisation', Icon: MapPin },
  { key: 'hammer', label: 'Travaux', Icon: Hammer },
]

export function ProfilePage() {
  const { user, isLoading, getAccessTokenSilently, logout } = useAuth0()
  const { me, refreshMe } = useMe()

  const displayName = user?.name ?? user?.nickname ?? '—'
  const displayEmail = user?.email ?? '—'
  const planLabel = me?.plan?.toUpperCase?.() ?? 'FREE'

  // avatar en BDD
  const currentAvatarKey = (me?.avatarKey as AvatarKey | undefined) ?? 'home'
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarKey>(currentAvatarKey)
  const [savingAvatar, setSavingAvatar] = useState(false)

  // delete account UI
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const SelectedIcon = useMemo(() => {
    return AVATARS.find((a) => a.key === selectedAvatar)?.Icon ?? UserIcon
  }, [selectedAvatar])

  const handleSaveAvatar = async () => {
    try {
      setSavingAvatar(true)
      await apiFetch(getAccessTokenSilently, '/api/me/avatar', {
        method: 'PATCH',
        body: JSON.stringify({ avatarKey: selectedAvatar }),
      })
      await refreshMe()
    } catch (e: any) {
      console.error(e)
      alert(e?.message || "Erreur lors de l'enregistrement.")
    } finally {
      setSavingAvatar(false)
    }
  }

  const handleResetPassword = async () => {
    try {
      const DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN
      const CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID

      if (!DOMAIN || !CLIENT_ID || !user?.email) {
        alert('Impossible de lancer la réinitialisation.')
        return
      }

      const res = await fetch(`https://${DOMAIN}/dbconnections/change_password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          email: user.email,
          connection: 'Username-Password-Authentication',
        }),
      })

      if (!res.ok) {
        alert('Erreur lors de la demande.')
        return
      }

      alert('Un email de réinitialisation a été envoyé.')
    } catch (e) {
      console.error(e)
      alert('Erreur réseau.')
    }
  }

  const handleDeleteAccount = async () => {
    // confirmation simple
    if (confirmText.trim().toUpperCase() !== 'SUPPRIMER') {
      alert('Tape SUPPRIMER pour confirmer.')
      return
    }

    const ok = window.confirm(
      "Dernière confirmation : ton compte va être supprimé (abonnement Stripe annulé si présent). Continuer ?"
    )
    if (!ok) return

    try {
      setDeleting(true)

      await apiFetch(getAccessTokenSilently, '/api/me', {
        method: 'DELETE',
      })

      // logout + retour home
      logout({
        logoutParams: { returnTo: window.location.origin },
      })
    } catch (e: any) {
      console.error(e)
      alert(e?.message || "Erreur lors de la suppression du compte.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="mb-2">Mon profil</h1>
        <p className="text-gray-600 dark:text-gray-400">Informations de votre compte</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full overflow-hidden flex items-center justify-center mb-4">
                <SelectedIcon className="w-12 h-12 text-emerald-600 dark:text-emerald-500" />
              </div>

              <h2>{isLoading ? 'Chargement…' : displayName}</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{isLoading ? '—' : displayEmail}</p>
            </div>

            <div className="space-y-2">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-4 py-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">Plan actuel</div>
                <div className="font-semibold text-emerald-600 dark:text-emerald-500">{planLabel}</div>
              </div>

              <Link
                to="/billing"
                className="block w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm text-center"
              >
                Gérer l’abonnement
              </Link>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Infos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <UserIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
              <h2>Informations personnelles</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Nom</label>
                <input
                  type="text"
                  value={isLoading ? '' : displayName}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg opacity-80 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={isLoading ? '' : displayEmail}
                    disabled
                    className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg opacity-80 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Avatar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="mb-4">Avatar</h2>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {AVATARS.map(({ key, label, Icon }) => {
                const active = selectedAvatar === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedAvatar(key)}
                    className={`p-3 rounded-xl border transition-colors flex flex-col items-center gap-2 ${
                      active
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900'
                    }`}
                    aria-label={label}
                    title={label}
                  >
                    <Icon className={`w-6 h-6 ${active ? 'text-emerald-600 dark:text-emerald-500' : 'text-gray-500'}`} />
                    <span className="text-[11px] text-gray-600 dark:text-gray-300">{label}</span>
                  </button>
                )
              })}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={handleSaveAvatar}
                type="button"
                disabled={savingAvatar || selectedAvatar === currentAvatarKey}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg transition-colors ${
                  savingAvatar || selectedAvatar === currentAvatarKey
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <Save className="w-5 h-5" />
                {savingAvatar ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900/40 p-6">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h2 className="text-red-700 dark:text-red-400">Zone dangereuse</h2>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Supprimer votre compte efface vos données dans ImmoFlow et annule votre abonnement si vous en avez un.
              Cette action est irréversible.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex-1">
                <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                  Tape <span className="font-semibold">SUPPRIMER</span> pour confirmer
                </label>
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="SUPPRIMER"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                />
              </div>

              <button
                onClick={handleDeleteAccount}
                type="button"
                disabled={deleting || confirmText.trim().toUpperCase() !== 'SUPPRIMER'}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                  deleting || confirmText.trim().toUpperCase() !== 'SUPPRIMER'
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                <Trash2 className="w-5 h-5" />
                {deleting ? 'Suppression…' : 'Supprimer mon compte'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
