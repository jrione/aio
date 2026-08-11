/**
 * Tampilan sementara selagi chunk halaman diunduh (`<Suspense fallback>`).
 *
 * Sengaja setipis mungkin: skeleton dan spinner yang benar dibangun di
 * Issue #14 bersama loading state global.
 */
export function RouteFallback() {
  return (
    <output
      aria-live="polite"
      className="flex min-h-48 w-full items-center justify-center p-8 text-sm text-content-muted"
    >
      Memuat halaman…
    </output>
  )
}
