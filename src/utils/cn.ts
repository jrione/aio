/**
 * Menggabungkan class Tailwind, dengan yang belakangan menang.
 *
 * Ini yang membuat prop `className` di komponen design system benar-benar
 * bisa menimpa styling bawaan. Tanpa `twMerge`, menulis
 * `<Button className="px-8">` hanya menghasilkan `px-4 px-8` — keduanya ada di
 * DOM, dan yang menang ditentukan urutan di file CSS, bukan urutan di JSX.
 * `twMerge` mengerti kelompok utility Tailwind, jadi ia membuang `px-4` dan
 * menyisakan `px-8`.
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
