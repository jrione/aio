/**
 * Preferensi tampilan yang bertahan antar sesi.
 *
 * Yang masuk ke sini hanya pilihan yang **sengaja diambil pengguna** dan wajar
 * ia harapkan masih berlaku besok pagi. Keadaan sesaat — drawer mobile sedang
 * terbuka, dropdown sedang tampil — tidak termasuk: menyimpannya berarti
 * membuka aplikasi dan disambut menu yang menutupi layar tanpa sebab.
 */
import { createPersistedStore } from '@/store/create-store.ts'
import { STORAGE_KEYS } from '@/store/storage-keys.ts'

export const sidebarCollapsedStore = createPersistedStore<boolean>({
  key: STORAGE_KEYS.sidebarCollapsed,
  fallback: false,
  decode: (raw) => (raw === 'true' ? true : raw === 'false' ? false : undefined),
})
