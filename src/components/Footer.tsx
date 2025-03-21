import Image from "next/image";

const footerLinks = {
  company: [
    { name: "Home", href: "/" },
    { name: "Restaurant", href: "/restaurants" },
    { name: "Add a Listing", href: "/" },
    { name: "Write a review", href: "/" },
  ],
  support: [
    { name: "Help Center", href: "/help" },
    // { name: "Safety Information", href: "/safety" },
    // { name: "Cancellation Options", href: "/cancellation" },
    // { name: "COVID-19 Response", href: "/covid" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Settings", href: "/cookies" },
    // { name: "Sitemap", href: "/sitemap" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[#F1F1F1] text-[#31343F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-[122px]">
          {/* Company Info Column */}
          <div>
            <h2 className="text-[#31343F] text-lg font-semibold mb-4">
              TastyPlates
            </h2>
            <p className="text-sm text-gray-400 mb-4">
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
            <div>
              <h3 className="text-[#31343F] text-sm font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-sm hover:text-[#31343F] text-[#494D5D] font-semibold">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h3 className="text-[#31343F] text-sm font-semibold mb-4">Legal</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-sm hover:text-[#31343F] text-[#494D5D] font-semibold">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-[#31343F] text-sm font-semibold mb-4">Support</h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-sm hover:text-[#31343F] text-[#494D5D] font-semibold">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          {/* </div> */}

        </div>
        <div className="mt-8 border-t border-[#CACACA] py-6">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} TastyPlates. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
