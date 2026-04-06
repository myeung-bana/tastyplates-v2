import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Primary “See all” CTA — matches `/restaurants/[slug]` mobile reviews
 * (formerly `restaurant-reviews-mobile__see-all-btn`): orange, rounded-lg, Neusans.
 */
const baseClass =
  "font-neusans font-normal text-[0.9375rem] text-center bg-[#ff7c0a] text-white " +
  "rounded-lg border-0 py-3 px-6 transition-colors " +
  "hover:bg-[#e66d08] active:bg-[#C04A00] " +
  "inline-flex items-center justify-center no-underline";

type SeeAllButtonProps = {
  children: ReactNode;
  /** `block` = full width; `inline` = header / compact placement */
  variant?: "block" | "inline";
  className?: string;
} & (
  | { href: string; onClick?: never }
  | { href?: undefined; onClick: () => void }
);

export default function SeeAllButton({
  children,
  variant = "block",
  className,
  href,
  onClick,
}: SeeAllButtonProps) {
  const cls = cn(
    baseClass,
    variant === "block" ? "w-full" : "w-auto max-w-full",
    className
  );

  if (href !== undefined) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
