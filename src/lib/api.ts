type GetTokenSilently = (opts?: any) => Promise<string>

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001"

export async function apiFetch<T>(
  getAccessTokenSilently: GetTokenSilently,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessTokenSilently({
    authorizationParams: {
      audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      scope: "openid profile email",
    },
  })

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      // mets Content-Type seulement si tu envoies un body (sinon ça peut gêner certains endpoints)
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
  })

  // 204/205 => pas de body, donc pas de json()
  if (res.status === 204 || res.status === 205) {
    return undefined as T
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(txt || `API error ${res.status}`)
  }

  // Si jamais un endpoint renvoie du texte
  const contentType = res.headers.get("content-type") ?? ""
  if (!contentType.includes("application/json")) {
    const txt = await res.text().catch(() => "")
    return txt as unknown as T
  }

  return (await res.json()) as T
}

export async function apiFetchBlob(
  getAccessTokenSilently: GetTokenSilently,
  path: string,
  options: RequestInit = {}
): Promise<Blob> {
  const token = await getAccessTokenSilently({
    authorizationParams: {
      audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      scope: "openid profile email",
    },
  })

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(txt || `API error ${res.status}`)
  }

  return res.blob()
}
