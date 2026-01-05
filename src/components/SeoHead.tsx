import { useEffect } from "react"

type Props = {
  title: string
  description?: string
  canonical?: string
}

export function SeoHead({ title, description, canonical }: Props) {
  useEffect(() => {
    document.title = title

    if (description) {
      let tag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
      if (!tag) {
        tag = document.createElement("meta")
        tag.setAttribute("name", "description")
        document.head.appendChild(tag)
      }
      tag.setAttribute("content", description)
    }

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
      if (!link) {
        link = document.createElement("link")
        link.setAttribute("rel", "canonical")
        document.head.appendChild(link)
      }
      link.setAttribute("href", canonical)
    }
  }, [title, description, canonical])

  return null
}
