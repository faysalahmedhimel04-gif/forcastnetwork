import { Suspense } from "react"
import CreateForecastClient from "./create-forecast-client"

// Force dynamic rendering. This page is behind auth (proxy redirects unauthed users)
// and we never want static prerender attempts that could hit Supabase without env vars.
export const dynamic = 'force-dynamic'

export default function CreateForecastPage({
  searchParams,
}: {
  searchParams?: Promise<{ link?: string }>
}) {
  return (
    <Suspense fallback={<div className="container max-w-3xl mx-auto px-4 py-10">Loading...</div>}>
      <CreateForecastClient searchParams={searchParams} />
    </Suspense>
  )
}
