import { Suspense } from "react"
import CreateForecastClient from "./create-forecast-client"

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
