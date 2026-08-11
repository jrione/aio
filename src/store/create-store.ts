/**
 * Satu-satunya mekanisme state global di aplikasi ini.
 *
 * ## Kenapa bukan Redux, dan kenapa (belum) Zustand
 *
 * Yang benar-benar perlu hidup di luar pohon komponen cuma empat hal, dan
 * semuanya sederhana: sesi pengguna, tema, preferensi UI, notifikasi global.
 * Sisanya — data dari server — sudah punya rumah sendiri di cache TanStack
 * Query (Issue #8), dan menyalinnya ke store global justru melahirkan dua
 * sumber kebenaran yang harus terus disamakan.
 *
 * Untuk kebutuhan sekecil itu, `useSyncExternalStore` bawaan React sudah
 * memberi persis apa yang dibutuhkan: langganan, snapshot yang konsisten, dan
 * aman terhadap concurrent rendering. Menambah Zustand berarti menambah
 * dependency untuk menulis ulang file ini; menambah Redux berarti membawa
 * action, reducer, dan devtools untuk tiga boolean. Kalau nanti muncul
 * kebutuhan yang benar-benar rumit (state turunan lintas store, middleware,
 * time-travel), Zustand tinggal menggantikan file ini saja — pemakainya tidak
 * ikut berubah, karena semua akses lewat `store.use()` / `store.set()`.
 *
 * ## Aturan isi
 *
 * Store global HANYA untuk: sesi pengguna, tema, preferensi UI, notifikasi.
 * Data server → TanStack Query. State satu halaman → `useState`. Aturannya
 * ditulis di sini supaya store tidak perlahan berubah jadi tempat penampungan
 * segala hal yang kebetulan sulit dioper lewat props.
 */
import { useSyncExternalStore } from 'react'

import type { StorageKey } from '@/store/storage-keys.ts'

export interface PersistedStore<Value> {
  /** Nilai saat ini, tanpa berlangganan. Untuk dipakai di luar komponen React. */
  get: () => Value
  /**
   * Sengaja tidak menerima fungsi updater seperti `useState`.
   *
   * Updater ada di `useState` untuk mengatasi closure basi — nilai yang
   * tertangkap saat render bisa sudah usang ketika handler-nya jalan. Di sini
   * masalah itu tidak ada: `get()` membaca cache di memori secara sinkron dan
   * selalu mutakhir, jadi `set(!get())` sudah benar tanpa perlu updater.
   *
   * Menambahkan overload fungsi justru memunculkan ambiguitas yang tidak bisa
   * diselesaikan: kalau `Value` sendiri bertipe fungsi, `set(fn)` tidak bisa
   * dibedakan antara "simpan fungsi ini" dan "hitung nilai baru dengan fungsi
   * ini". React menanggung ambiguitas itu karena harus; di sini tidak perlu.
   */
  set: (value: Value) => void
  /** Berlangganan perubahan di luar React, mis. untuk efek samping pada `<html>`. */
  subscribe: (listener: () => void) => () => void
  /** Hook React: ikut render ulang saat nilainya berubah, termasuk dari tab lain. */
  use: () => Value
}

export interface StoreOptions<Value> {
  key: StorageKey
  /** Dipakai saat storage kosong, tidak terbaca, atau isinya tidak dikenali. */
  fallback: Value
  /**
   * Mengubah string dari storage jadi nilai bertipe.
   *
   * Wajib mengembalikan `undefined` untuk isi yang tidak dikenali, bukan
   * melempar: isi localStorage bisa berasal dari versi aplikasi yang lebih
   * lama, dari tab lain, atau dari tangan pengguna sendiri lewat devtools.
   * Apa pun yang ditemukan di sana tidak boleh membuat aplikasi gagal render.
   */
  decode: (raw: string) => Value | undefined
  encode?: (value: Value) => string
}

export function createPersistedStore<Value>({
  key,
  fallback,
  decode,
  encode = String,
}: StoreOptions<Value>): PersistedStore<Value> {
  const listeners = new Set<() => void>()

  const readStorage = (): Value => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw === null ? fallback : (decode(raw) ?? fallback)
    } catch {
      // Mode privat sebagian browser melarang localStorage sama sekali.
      // Aplikasi tetap berjalan, preferensinya cuma tidak bertahan.
      return fallback
    }
  }

  /*
   * Nilainya di-cache di memori, bukan dibaca ulang dari localStorage tiap
   * render. Dua alasan, dan yang kedua bukan soal performa:
   *
   *   1. `getSnapshot` dipanggil sangat sering oleh React.
   *   2. `useSyncExternalStore` mengharuskan snapshot stabil secara referensi
   *      selama nilainya belum berubah. localStorage mengembalikan string baru
   *      tiap panggilan, jadi untuk tipe non-primitif React akan menganggapnya
   *      selalu berubah dan render tanpa henti.
   */
  let current = readStorage()

  const emit = () => {
    for (const listener of listeners) listener()
  }

  /**
   * Perubahan dari tab lain hanya sampai lewat event `storage`.
   *
   * Tanpa ini, menekan "keluar" di satu tab meninggalkan tab lain mengira
   * dirinya masih login — sampai halaman kebetulan di-refresh.
   */
  const onStorage = (event: StorageEvent) => {
    // `event.key === null` berarti storage dikosongkan seluruhnya (`clear()`).
    if (event.key !== key && event.key !== null) return
    const next = readStorage()
    if (Object.is(next, current)) return
    current = next
    emit()
  }

  /*
   * Referensi fungsi ini harus stabil: `useSyncExternalStore` berlangganan
   * ulang setiap kali argumen pertamanya berganti referensi. Karena itu ia
   * dibuat sekali di sini, bukan di dalam `use()`.
   *
   * Listener `storage` dipasang ke window hanya selama ada yang berlangganan,
   * dan dilepas saat pelanggan terakhir pergi.
   */
  const subscribe = (listener: () => void) => {
    if (listeners.size === 0) window.addEventListener('storage', onStorage)
    listeners.add(listener)

    return () => {
      listeners.delete(listener)
      if (listeners.size === 0) window.removeEventListener('storage', onStorage)
    }
  }

  const getSnapshot = () => current

  // Snapshot untuk server rendering. Aplikasi ini murni klien, tapi
  // menyediakannya menjaga hook tetap benar seandainya nanti dirender di
  // server — dan mencegah `window` disentuh di lingkungan yang tidak punya.
  const getServerSnapshot = () => fallback

  return {
    get: getSnapshot,
    subscribe,

    set: (value) => {
      if (Object.is(value, current)) return
      current = value
      try {
        window.localStorage.setItem(key, encode(value))
      } catch {
        // Nilainya tetap berlaku selama sesi ini lewat cache di memori.
      }
      emit()
    },

    use: () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot),
  }
}
