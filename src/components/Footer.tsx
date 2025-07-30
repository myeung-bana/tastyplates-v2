import { HELP, HOME, RESTAURANTS } from "@/constants/pages";
import Image from "next/image";

interface Props {
  isShowLinks?: boolean
  isShowCopyright?: boolean
}
const footerLinks = {
  company: [
    { name: "Home", href: HOME },
    { name: "Restaurant", href: RESTAURANTS },
    { name: "Add a Listing", href: HOME },
    { name: "Write a Review", href: HOME },
  ],
  support: [
    { name: "Help Center", href: HELP },
    // { name: "Safety Information", href: "/safety" },
    // { name: "Cancellation Options", href: "/cancellation" },
    // { name: "COVID-19 Response", href: "/covid" },
  ],
  legal: [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Cookie Settings", href: "#" },
    // { name: "Sitemap", href: "/sitemap" },
  ],
}

export default function Footer({
  isShowLinks = true,
  isShowCopyright = true
}: Props) {
  return (
    <footer className="bg-[#F1F1F1] text-[#31343F]">
      <div className={`${isShowLinks ? 'pt-12' : ''} max-w-[82rem] px-4 xl:px-0 mx-auto`}>
        {/* Main footer content */}
        {isShowLinks && (
          <div className="flex flex-col sm:flex-row flex-wrap justify-start items-start gap-6 sm:gap-8 md:gap-[122px]">
            {/* Company Info Column */}
            <div className="max-w-[500px] w-full">
              <h2 className="text-[#31343F] text-xs sm:text-lg font-semibold mb-4">
                TastyPlates
              </h2>
              <p className="text-xs sm:text-sm mb-4">
                Discover and book the best restaurants in your area.
              </p>
              <div className="flex space-x-4">
                {/* Social Media Icons */}
                <a href="#" className="hover:text-[#31343F]">
                  <span className="sr-only">Facebook</span>
                  <Image
                    src='/facebook.svg'
                    className="h-6 w-6"
                    width={24}
                    height={24}
                    alt="Facebook logo"
                  />
                </a>
                <a href="#" className="hover:text-[#31343F]">
                  <span className="sr-only">Instagram</span>
                  <Image
                    src='/instagram.svg'
                    className="h-6 w-6"
                    width={24}
                    height={24}
                    alt="Instagram logo"
                  />
                </a>
                <a href="#" className="hover:text-[#31343F]">
                  <span className="sr-only">Twitter</span>
                  <Image
                    src='/x.svg'
                    className="h-6 w-6"
                    width={24}
                    height={24}
                    alt="X logo"
                  />
                </a>
              </div>
            </div>

            {/* Links Columns */}
            {/* <div className="grid grid-cols-3 gap-8"> */}
              {/* Company Links */}
              <div className="sm:px-[5px]">
                <h3 className="text-[#31343F] text-xs sm:text-base font-semibold mb-4">Company</h3>
                <ul className="space-y-3">
                  {footerLinks.company.map((link) => (
                    <li key={link.name}>
                      <a href={link.href} className="hover:text-[#494D5D] text-[#494D5D] text-xs sm:text-base font-semibold">
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal Column */}
              <div className="sm:px-2.5">
                <h3 className="text-[#31343F] text-xs sm:text-base font-semibold mb-4">Legal</h3>
                <ul className="space-y-3">
                  {footerLinks.legal.map((link) => (
                    <li key={link.name}>
                      <a href={link.href} className="hover:text-[#494D5D] text-[#494D5D] text-xs sm:text-base font-semibold">
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Support Links */}
              <div>
                <h3 className="text-[#31343F] text-xs sm:text-base font-semibold mb-4">Support</h3>
                <ul className="space-y-3">
                  {footerLinks.support.map((link) => (
                    <li key={link.name}>
                      <a href={link.href} className="hover:text-[#494D5D] text-[#494D5D] text-xs sm:text-base font-semibold">
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            {/* </div> */}

          </div>
        )}
        {isShowCopyright && (
        <div className={`${isShowLinks ? 'mt-6 sm:mt-10 border-t border-[#CACACA]' : ''} text-sm sm:text-base py-6`}>
          <p className="text-[#31343F]">
            &copy; {new Date().getFullYear()} TastyPlates. All rights
            reserved.
          </p>
        </div>
        )}
      </div>
    </footer>
  );
}
