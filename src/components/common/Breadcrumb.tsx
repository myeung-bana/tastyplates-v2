"use client";
import Link from "next/link";
import { FiHome } from "react-icons/fi";
import { RESTAURANTS, HOME } from "@/constants/pages";

interface BreadcrumbProps {
  items: Array<{
    label: string;
    href?: string;
  }>;
  showHomeIcon?: boolean;
}

export default function Breadcrumb({ items, showHomeIcon = false }: BreadcrumbProps) {
  return (
    <nav className="breadcrumb font-neusans" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm text-gray-600">
        {showHomeIcon && (
          <li className="flex items-center">
            <Link
              href={HOME}
              className="font-neusans text-gray-600 hover:text-[#ff7c0a] transition-colors font-normal flex items-center"
              aria-label="Home"
            >
              <FiHome className="w-4 h-4" />
            </Link>
            {items.length > 0 && (
              <span className="mx-2 text-gray-400">/</span>
            )}
          </li>
        )}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-gray-400">/</span>
              )}
              {isLast || !item.href ? (
                <span className={`font-neusans ${isLast ? 'text-gray-900 font-normal' : 'text-gray-600'}`}>
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="font-neusans text-gray-600 hover:text-[#ff7c0a] transition-colors font-normal"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

