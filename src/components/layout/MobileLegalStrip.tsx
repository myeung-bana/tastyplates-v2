import Link from "next/link";
import {
  COOKIE_POLICY,
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
} from "@/constants/pages";

const links = [
  { href: PRIVACY_POLICY, label: "Privacy" },
  { href: TERMS_OF_SERVICE, label: "Terms" },
  { href: COOKIE_POLICY, label: "Cookies" },
] as const;

/**
 * Legal links visible on mobile where the main footer is hidden (md+ only).
 */
export default function MobileLegalStrip() {
  return (
    <nav
      className="md:hidden border-t border-gray-200 bg-white"
      aria-label="Legal and policies"
    >
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-xs text-gray-600 font-neusans">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="hover:text-[#ff7c0a] underline-offset-2 hover:underline"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
