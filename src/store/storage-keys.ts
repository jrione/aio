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
  /**
   * Penanda sesi: id pengguna yang sedang masuk, atau string kosong.
   *
   * **Bukan** kredensial, dan sengaja begitu — token tidak pernah menyentuh
   * localStorage (lihat `src/services/auth-token.ts`). Gunanya cuma dua, dan
   * keduanya butuh sesuatu yang bertahan melewati reload: memberi tahu tab lain
   * bahwa sesi baru saja dimulai atau diakhiri, dan memberi tahu aplikasi saat
   * dimuat apakah ada sesi yang layak dicoba pulihkan — supaya pengunjung yang
   * belum pernah masuk tidak dibuat menunggu satu request sia-sia.
   */
  session: 'aio.session',
  /** Preferensi tema: 'light' | 'dark' | 'system'. */
  theme: 'aio.theme',
  /** Sidebar desktop menyusut jadi rel ikon. */
  sidebarCollapsed: 'aio.sidebar-collapsed',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

/** Atribut di `<html>` yang dibaca selector `[data-theme]` di index.css. */
export const THEME_ATTRIBUTE = 'data-theme'
