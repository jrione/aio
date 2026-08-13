/**
 * Log sebuah deployment.
 *
 * Ditulis sebagai daftar berlabel waktu, bukan blok teks mentah. Bedanya bukan
 * estetika: warna saja tidak menyampaikan tingkat pesan kepada pengguna yang
 * tidak membedakan warna atau yang memakai screen reader, jadi tiap baris
 * membawa labelnya sendiri — tersembunyi di layar, terbaca oleh pembaca layar.
 *
 * Bagian yang bergulir adalah daftarnya, bukan halamannya. Log 200 baris yang
 * memanjangkan halaman membuat tombol aksi di atas menghilang jauh ke atas,
 * padahal itu justru yang dicari orang setelah membaca barisnya.
 */
import { Card } from '@/components/ui/Card.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { LOG_LEVEL_CLASS, LOG_LEVEL_LABEL } from '@/features/deployments/labels.ts'
import { formatClock } from '@/features/formatters.ts'
import type { DeploymentLogLine } from '@/services/deployments/deployment.types.ts'
import { cn } from '@/utils/cn.ts'

export function DeploymentLog({ lines }: { lines: readonly DeploymentLogLine[] }) {
  if (lines.length === 0) {
    return (
      <Card bodyClassName="p-0">
        <EmptyState
          icon="documentation-icon"
          title="Belum ada log"
          description="Baris log muncul begitu prosesnya mulai berjalan."
        />
      </Card>
    )
  }

  return (
    <Card bodyClassName="p-0">
      <ol className="max-h-96 divide-y divide-edge overflow-y-auto font-mono text-xs">
        {lines.map((line, index) => (
          <li
            // Baris log tidak punya id sendiri, dan dua baris bisa berisi
            // pesan yang sama persis. Yang membedakan keduanya memang
            // urutannya — dan urutan itu tidak pernah berubah setelah dikirim.
            key={`${line.at}-${String(index)}`}
            className="flex gap-3 px-4 py-2"
          >
            <time dateTime={line.at} className="shrink-0 text-content-muted tabular-nums">
              {formatClock(line.at)}
            </time>
            <span className={cn('min-w-0 break-words', LOG_LEVEL_CLASS[line.level])}>
              <span className="sr-only">{LOG_LEVEL_LABEL[line.level]}: </span>
              {line.message}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  )
}
