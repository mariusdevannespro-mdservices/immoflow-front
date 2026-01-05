import React from "react"
import { Link } from "react-router-dom"
import { SeoHead } from "./SeoHead"

type Props = {
  title: string
  description: string
  h1: string
  canonical?: string
  content: React.ReactNode
}

export function SeoPage({ title, description, h1, canonical, content }: Props) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <SeoHead title={title} description={description} canonical={canonical} />

      <h1 className="text-4xl font-semibold mb-6">{h1}</h1>

      <div className="prose dark:prose-invert max-w-none">{content}</div>

      <div className="mt-10">
        <Link to="/signup" className="px-6 py-3 bg-emerald-600 text-white rounded-lg">
          Tester gratuitement
        </Link>
      </div>
    </div>
  )
}
