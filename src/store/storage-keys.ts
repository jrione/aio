/**
 * Seluruh kunci localStorage yang dipakai aplikasi, di satu tempat.
 *
 * Dikumpulkan bukan demi kerapian, melainkan karena kunci storage adalah
 * namespace bersama yang tidak punya pemilik: dua fitur yang kebetulan memilih
 * `"theme"` akan saling menimpa, dan gejalanya baru muncul di perangkat
 * pengguna. Daftar terpusat membuat tabrakan itu terlihat saat menulis kode.
 *
 * Berguna juga sebagai jawaban atas satu pertanyaan yang selalu muncul:
 * "aplikasi ini menyimpan apa saja di browser saya?" — jawabannya file ini.
 *
 * Prefiks `aio.` menjaga agar aplikasi lain di origin yang sama (mis. saat
 * beberapa tool di-host di satu domain) tidak saling mengganggu.
 */
export const STORAGE_KEYS = {
  /** Status login sementara. Diganti sesi sungguhan di Issue #10. */
  auth: 'aio.fake-auth',
  /** Preferensi tema: 'light' | 'dark' | 'system'. */
  theme: 'aio.theme',
  /** Sidebar desktop menyusut jadi rel ikon. */
  sidebarCollapsed: 'aio.sidebar-collapsed',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

/** Atribut di `<html>` yang dibaca selector `[data-theme]` di index.css. */
export const THEME_ATTRIBUTE = 'data-theme'
