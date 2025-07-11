import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function stripTags(input: string): string {
  const stripped = input.replace(/<[^>]*>?/gm, '');

  const txt = document.createElement("textarea");
  txt.innerHTML = stripped;
  return txt.value;
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const [datePart] = dateString.split(' ');
  const [year, month, day] = datePart.split('-');
  return `${day}/${month}/${year}`;
}

export function formatDateT(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const [datePart] = dateString.split('T');
  const [year, month, day] = datePart.split('-');
  return `${day}/${month}/${year}`;
}

export function capitalizeWords(str: string): string {
  return str
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

//ex: PAGE(DASHBOARD, ["path", "list"], { status: true }) returns "/dashboard/path/list?status=true"
export const PAGE = (
  basePath: string,
  subPaths: any[] = [],
  params?: Record<string, any> | string
): string => {
  const path = [basePath, ...subPaths].join("/").replace(/\/+/g, "/");

  // If params is a string, assume it's already URLSearchParams-style
  if (typeof params === "string") {
    return params ? `${path}?${params}` : path;
  }

  // Otherwise, treat as object and serialize
  const query = new URLSearchParams(
    Object.entries(params || {}).reduce((acc, [key, value]) => {
      acc[key] = String(value);
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  return query ? `${path}?${query}` : path;
};
