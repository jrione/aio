/**
 * Hook untuk aksi masuk.
 *
 * Ditulis sebagai mutation TanStack Query, bukan `useState` + `try/catch`
 * sendiri, supaya halaman login memakai kosakata yang sama dengan seluruh
 * bagian lain aplikasi: `isPending`, `error`, `mutate`. Yang dijaga di sini
 * cuma satu hal yang tidak diurus TanStack Query — bahwa keberhasilan login
 * langsung menjadi sesi, di satu tempat, bukan di tiap pemanggil.
 */
import { useMutation } from '@tanstack/react-query'

import { startSession } from '@/features/auth/session.ts'
import { authService } from '@/services/auth/auth.service.ts'
import type { Credentials } from '@/services/auth/auth.types.ts'

export function useLogin() {
  return useMutation({
    mutationFn: (credentials: Credentials) => authService.login(credentials),
    onSuccess: startSession,
  })
}
