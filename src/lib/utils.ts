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

export function formatDateForInput(dateString: string): string {
  console.log("formatDateForInput called with:", dateString);
  if (!dateString) return '';

  let year: number, month: number, day: number;

  if (dateString.includes('/')) {
    // MM/DD/YYYY
    const parts = dateString.split('/');
    if (parts.length !== 3) return '';
    [month, day, year] = parts.map(Number);
  } else if (dateString.includes('-')) {
    // YYYY-MM-DD
    const parts = dateString.split('-');
    if (parts.length !== 3) return '';
    [year, month, day] = parts.map(Number);
  } else {
    return '';
  }

  const localDate = new Date(year, month - 1, day);

  // Format to YYYY-MM-DD
  const yyyy = localDate.getFullYear();
  const mm = String(localDate.getMonth() + 1).padStart(2, '0');
  const dd = String(localDate.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
};

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
