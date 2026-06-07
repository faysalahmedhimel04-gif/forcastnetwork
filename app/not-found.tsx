export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-4 text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
      <a href="/" className="mt-6 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90">
        Go back home
      </a>
    </div>
  )
}
