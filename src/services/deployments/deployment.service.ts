/**
 * Service domain deployments.
 *
 * Satu-satunya lapisan yang tahu path endpoint dan nama parameter query untuk
 * domain ini. Komponen memanggil hook di `deployment.queries.ts`, hook memanggil
 * service ini, service memanggil `http` — dijaga `npm run check:layers`.
 *
 * Perhatikan nama parameter query di `list()`: `env`, bukan `environment`.
 * Nama pendek itu milik URL yang dilihat pengguna (lihat `deployment-filter.ts`),
 * dan penerjemahannya berhenti di sini. Komponen tetap menyebut `environment`
 * seperti di seluruh aplikasi, dan mengganti nama parameter di sisi backend
 * tidak menyentuh satu pun file di luar folder ini.
 */
import type {
  Deployment,
  DeploymentDetail,
  DeploymentFilter,
  NewDeployment,
} from '@/services/deployments/deployment.types.ts'
import { http } from '@/services/http.ts'
import type { Paginated } from '@/services/paginated.ts'

export const deploymentService = {
  list: (
    { q, environment, status, page, pageSize }: DeploymentFilter,
    signal?: AbortSignal,
  ): Promise<Paginated<Deployment>> =>
    http.get<Paginated<Deployment>>('/deployments', {
      // Entri `undefined` dibuang `http.ts`, jadi penyaring kosong tidak
      // mengirimkan `?status=undefined` ke server.
      query: { q, env: environment, status, page, pageSize },
      signal,
    }),

  get: (id: string, signal?: AbortSignal): Promise<DeploymentDetail> =>
    http.get<DeploymentDetail>(`/deployments/${encodeURIComponent(id)}`, { signal }),

  /** Daftar layanan yang bisa dirilis — mengisi pilihan di dialog "Deployment baru". */
  listServices: (signal?: AbortSignal): Promise<readonly string[]> =>
    http.get<readonly string[]>('/deployments/services', { signal }),

  create: (input: NewDeployment): Promise<Deployment> =>
    http.post<Deployment>('/deployments', { body: input }),

  /**
   * Membatalkan deployment yang masih mengantre atau berjalan.
   *
   * `PATCH` dengan satu field, bukan `POST /deployments/:id/cancel`: yang
   * berubah memang satu atribut dari sumber daya yang sudah ada, dan bentuk itu
   * tetap benar saat kelak ada atribut lain yang boleh diubah.
   */
  cancel: (id: string): Promise<Deployment> =>
    http.patch<Deployment>(`/deployments/${encodeURIComponent(id)}`, {
      body: { status: 'canceled' },
    }),

  remove: (id: string): Promise<void> =>
    http.delete<void>(`/deployments/${encodeURIComponent(id)}`),
}
