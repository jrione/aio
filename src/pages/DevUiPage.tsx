/**
 * Katalog design system — hanya ada saat `npm run dev`.
 *
 * Halaman ini merangkap dua peran: rujukan visual saat membangun halaman
 * baru, dan tempat menguji komponen secara manual (fokus keyboard, Escape di
 * modal, panah di tab) tanpa perlu halaman asli lebih dulu ada.
 *
 * Setiap komponen ditampilkan bersama seluruh variannya. Varian dirender dari
 * array, bukan disalin satu per satu, supaya menambah varian di komponen
 * cukup menambah satu entri di sini.
 */
import { useState } from 'react'

import { Badge } from '@/components/ui/Badge.tsx'
import { Button } from '@/components/ui/Button.tsx'
import { Card } from '@/components/ui/Card.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { ErrorState } from '@/components/ui/ErrorState.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { Modal } from '@/components/ui/Modal.tsx'
import { Pagination } from '@/components/ui/Pagination.tsx'
import { SearchInput } from '@/components/ui/SearchInput.tsx'
import { Select } from '@/components/ui/Select.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { Spinner } from '@/components/ui/Spinner.tsx'
import { Switch } from '@/components/ui/Switch.tsx'
import { Table, type TableColumn } from '@/components/ui/Table.tsx'
import { Tabs } from '@/components/ui/Tabs.tsx'
import { useToast, type ToastTone } from '@/components/ui/toast-context.ts'

const BUTTON_VARIANTS = ['primary', 'secondary', 'ghost', 'danger'] as const
const BUTTON_SIZES = ['sm', 'md', 'lg'] as const
const BADGE_TONES = ['neutral', 'success', 'warning', 'danger', 'info'] as const
const TOAST_TONES: readonly ToastTone[] = ['success', 'warning', 'danger', 'info']

interface Deployment {
  id: string
  service: string
  env: string
  status: (typeof BADGE_TONES)[number]
  duration: string
}

const DEPLOYMENTS: Deployment[] = [
  { id: 'd-1', service: 'api-gateway', env: 'production', status: 'success', duration: '2m 14s' },
  { id: 'd-2', service: 'billing-worker', env: 'staging', status: 'warning', duration: '4m 02s' },
  { id: 'd-3', service: 'web-frontend', env: 'production', status: 'danger', duration: '0m 47s' },
]

const COLUMNS: TableColumn<Deployment>[] = [
  { key: 'service', header: 'Service', render: (row) => row.service, className: 'font-medium' },
  { key: 'env', header: 'Lingkungan', render: (row) => row.env, className: 'font-mono text-xs' },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <Badge tone={row.status} dot>
        {row.status}
      </Badge>
    ),
  },
  { key: 'duration', header: 'Durasi', align: 'right', render: (row) => row.duration },
]

const ENV_OPTIONS = [
  { value: 'production', label: 'Production' },
  { value: 'staging', label: 'Staging' },
  { value: 'development', label: 'Development' },
]

/** Judul seksi katalog — dipakai berulang, jadi tidak diketik ulang tiap kali. */
function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="font-display text-lg font-medium text-content">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-content-muted">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

export default function DevUiPage() {
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [tab, setTab] = useState('ringkasan')
  const [page, setPage] = useState(3)
  const [email, setEmail] = useState('')
  const [keyword, setKeyword] = useState('')
  const [committed, setCommitted] = useState('(belum ada)')
  const [notify, setNotify] = useState(true)

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="text-content-muted">
          Katalog komponen design system. Halaman ini hanya terdaftar saat dev — di build produksi
          URL-nya jatuh ke halaman 404.
        </p>
      </div>

      <Section title="Button" hint="Varian dan ukuran dikelola cva, bukan if bertingkat di JSX.">
        <div className="flex flex-col gap-3">
          {BUTTON_VARIANTS.map((variant) => (
            <div key={variant} className="flex flex-wrap items-center gap-3">
              {BUTTON_SIZES.map((size) => (
                <Button key={size} variant={variant} size={size}>
                  {variant} / {size}
                </Button>
              ))}
              <Button variant={variant} disabled>
                disabled
              </Button>
              <Button variant={variant} loading>
                loading
              </Button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Badge">
        <div className="flex flex-wrap items-center gap-2">
          {BADGE_TONES.map((tone) => (
            <Badge key={tone} tone={tone} dot>
              {tone}
            </Badge>
          ))}
          {BADGE_TONES.map((tone) => (
            <Badge key={`${tone}-md`} tone={tone} size="md">
              {tone} md
            </Badge>
          ))}
        </div>
      </Section>

      <Section title="Input & Select">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="demo-email"
            label="Email"
            placeholder="nama@perusahaan.com"
            hint="Dipakai untuk notifikasi deployment."
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
            }}
          />
          <Input id="demo-token" label="Token" defaultValue="rahasia" error="Token tidak valid." />
          <Select id="demo-env" label="Lingkungan" options={ENV_OPTIONS} defaultValue="staging" />
          <Select
            id="demo-env-empty"
            label="Lingkungan"
            options={ENV_OPTIONS}
            placeholder="Pilih lingkungan"
            defaultValue=""
            hint="Ukuran kecil."
            size="sm"
          />
        </div>
      </Section>

      <Section
        title="SearchInput"
        hint="Nilai yang diketik dan nilai yang berlaku dipisah oleh jeda 300 ms."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SearchInput
            id="demo-cari"
            label="Cari layanan"
            value={keyword}
            onChange={(next) => {
              setKeyword(next)
              setCommitted(next === '' ? '(kosong)' : next)
            }}
            hint="Ketik cepat — nilai di bawah baru berubah setelah berhenti mengetik."
          />
          <div className="self-end pb-1 text-sm text-content-muted">
            Nilai yang diterapkan: <span className="font-mono text-content">{committed}</span>
          </div>
        </div>
      </Section>

      <Section
        title="Switch"
        hint="Berlaku seketika. Untuk pilihan yang menunggu tombol Simpan, checkbox yang benar."
      >
        <div className="flex flex-col gap-4">
          <Switch
            checked={notify}
            onChange={setNotify}
            label="Kirim email saat deployment gagal"
            hint="Berlaku untuk seluruh lingkungan."
          />
          <Switch checked={false} onChange={() => undefined} label="Nonaktif, mati" disabled />
          <Switch checked onChange={() => undefined} label="Nonaktif, nyala" disabled />
          <Switch checked={notify} onChange={setNotify} aria-label="Tanpa label terlihat" />
        </div>
      </Section>

      <Section title="Card & Table" hint="Kolom tabel dideklarasikan sebagai data.">
        <Card
          title="Deployment terakhir"
          description="Tiga rilis paling baru."
          actions={
            <Button size="sm" variant="secondary">
              Muat ulang
            </Button>
          }
          footer="Diperbarui beberapa detik lalu."
          bodyClassName="p-0"
        >
          <Table columns={COLUMNS} rows={DEPLOYMENTS} rowKey={(row) => row.id} />
        </Card>

        <Card title="Tabel kosong" bodyClassName="p-0">
          <Table
            columns={COLUMNS}
            rows={[]}
            rowKey={(row) => row.id}
            empty={
              <EmptyState
                title="Belum ada deployment"
                description="Jalankan pipeline pertama untuk melihat riwayatnya di sini."
                action={<Button size="sm">Jalankan pipeline</Button>}
              />
            }
          />
        </Card>
      </Section>

      <Section title="Tabs" hint="Panah kiri/kanan, Home, dan End berpindah tab.">
        <Tabs
          label="Contoh tab"
          value={tab}
          onChange={setTab}
          items={[
            { id: 'ringkasan', label: 'Ringkasan', content: <p>Isi tab ringkasan.</p> },
            { id: 'log', label: 'Log', content: <p>Isi tab log.</p> },
            { id: 'artefak', label: 'Artefak', content: <p>Isi tab artefak.</p> },
            {
              id: 'nonaktif',
              label: 'Nonaktif',
              content: <p>Tidak terjangkau.</p>,
              disabled: true,
            },
          ]}
        />
      </Section>

      <Section title="Modal" hint="Escape menutup, fokus terkunci di dalam dialog.">
        <div>
          <Button
            onClick={() => {
              setModalOpen(true)
            }}
          >
            Buka modal
          </Button>
        </div>

        <Modal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false)
          }}
          title="Hapus deployment"
          description="Tindakan ini tidak bisa dibatalkan."
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setModalOpen(false)
                }}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setModalOpen(false)
                  toast.show({ title: 'Deployment dihapus', tone: 'success' })
                }}
              >
                Hapus
              </Button>
            </>
          }
        >
          <p className="text-sm text-content-muted">
            Tekan Tab berulang kali — fokus tidak akan keluar dari dialog ini.
          </p>
        </Modal>
      </Section>

      <Section title="Toast">
        <div className="flex flex-wrap gap-2">
          {TOAST_TONES.map((tone) => (
            <Button
              key={tone}
              variant="secondary"
              size="sm"
              onClick={() => {
                toast.show({
                  title: `Notifikasi ${tone}`,
                  description: 'Menutup sendiri setelah lima detik.',
                  tone,
                })
              }}
            >
              {tone}
            </Button>
          ))}
        </div>
      </Section>

      <Section
        title="Spinner, Skeleton, EmptyState & ErrorState"
        hint="Keadaan-keadaan yang dirender <QueryState> di lapisan data."
      >
        <div className="flex flex-wrap items-center gap-6">
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" label="Memuat data" />
        </div>

        {/* Skeleton dipakai saat ukuran isinya bisa ditebak lebih dulu —
            kartu metrik, baris tabel, kotak grafik. Untuk isi yang tingginya
            tak tentu, spinner di atas lebih jujur. */}
        <Card>
          <Skeleton className="h-4 w-28" />
          <div className="mt-3 flex items-center justify-between gap-3">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </Card>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card bodyClassName="p-0">
            <EmptyState
              title="Tidak ada hasil"
              description="Coba ubah kata kunci atau saring dengan lingkungan lain."
              action={
                <Button size="sm" variant="secondary">
                  Reset filter
                </Button>
              }
            />
          </Card>
          <Card bodyClassName="p-0">
            <ErrorState
              description="Tidak dapat terhubung ke server. Periksa koneksi internet Anda."
              onRetry={() => {
                toast.show({ tone: 'info', title: 'Mencoba lagi…' })
              }}
            />
          </Card>
        </div>
      </Section>

      <Section title="Pagination" hint="Halaman jauh diringkas jadi elipsis.">
        <div className="flex flex-col gap-3">
          <Pagination page={page} pageCount={5} onChange={setPage} />
          <Pagination page={page} pageCount={24} onChange={setPage} />
        </div>
      </Section>
    </div>
  )
}
