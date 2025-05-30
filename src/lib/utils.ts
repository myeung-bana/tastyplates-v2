import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function stripTags(input: string): string {
  return input.replace(/<[^>]*>?/gm, '');
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const [datePart] = dateString.split(' ');
  const [year, month, day] = datePart.split('-');
  return `${day}/${month}/${year}`;
}
