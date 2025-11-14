import { FACEBOOK, INSTAGRAM, TWITTER } from "@/constants/images";
import { HELP, HOME, RESTAURANTS, PRIVACY_POLICY, TERMS_OF_SERVICE,CONTENT_GUIDELINES } from "@/constants/pages";
import Image from "next/image";
import "@/styles/components/_footer.scss";

interface Props {
  isShowLinks?: boolean
  isShowCopyright?: boolean
}
const footerLinks = {
  company: [
    { name: "Home", href: HOME },
    { name: "Discover Restaurants", href: RESTAURANTS },
    { name: "Add a Listing", href: HOME },
    { name: "Write a Review", href: HOME },
  ],
  support: [
    { name: "Help Center", href: HELP },
    { name: "Tastyplates for Business", href: "#" },
    { name: "Claim your Business", href: "#" },
    // { name: "Cancellation Options", href: "/cancellation" },
    // { name: "COVID-19 Response", href: "/covid" },
  ],
  legal: [
    { name: "Terms of Service", href: TERMS_OF_SERVICE },
    { name: "Content Guidelines", href: CONTENT_GUIDELINES },
    { name: "Cookie Policy", href: "#" },
    { name: "Privacy Policy", href: PRIVACY_POLICY },
    // { name: "Sitemap", href: "/sitemap" },
  ],
}

export default function Footer({
  isShowLinks = true,
  isShowCopyright = true
}: Props) {
  return (
    <footer className="footer font-neusans hidden md:block">
      <div className={`footer__container ${isShowLinks ? 'footer__container--with-links' : ''}`}>
        {/* Main footer content */}
        {isShowLinks && (
          <div className="footer__content">
            {/* Company Info Column */}
            <div className="footer__company">
              <Image
                src="/TastyPlates_Logo_Black.svg"
                alt="TastyPlates"
                width={199}
                height={35}
                className="footer__logo"
              />
              <p className="footer__description">
                Discover and book the best restaurants in your area.
              </p>
              <div className="footer__social">
                {/* Social Media Icons */}
                <a href="#" className="footer__social-link">
                  <span className="sr-only">Facebook</span>
                  <Image
                    src={FACEBOOK}
                    className="footer__social-icon"
                    width={24}
                    height={24}
                    alt="Facebook logo"
                  />
                </a>
                <a href="#" className="footer__social-link">
                  <span className="sr-only">Instagram</span>
                  <Image
                    src={INSTAGRAM}
                    className="footer__social-icon"
                    width={24}
                    height={24}
                    alt="Instagram logo"
                  />
                </a>
                <a href="#" className="footer__social-link">
                  <span className="sr-only">Twitter</span>
                  <Image
                    src={TWITTER}
                    className="footer__social-icon"
                    width={24}
                    height={24}
                    alt="X logo"
                  />
                </a>
              </div>
            </div>

            {/* Links Columns */}
              {/* Company Links */}
              <div className="footer__links-column footer__links-column--company">
                <h3 className="footer__links-title">Discover</h3>
                <ul className="footer__links-list">
                  {footerLinks.company.map((link) => (
                    <li key={link.name} className="footer__links-item">
                      <a href={link.href} className="footer__links-link">
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal Column */}
              <div className="footer__links-column footer__links-column--legal">
                <h3 className="footer__links-title">About</h3>
                <ul className="footer__links-list font-neusans">
                  {footerLinks.legal.map((link) => (
                    <li key={link.name} className="footer__links-item">
                      <a href={link.href} className="footer__links-link">
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Support Links */}
              <div className="footer__links-column">
                <h3 className="footer__links-title">Support</h3>
                <ul className="footer__links-list">
                  {footerLinks.support.map((link) => (
                    <li key={link.name} className="footer__links-item">
                      <a href={link.href} className="footer__links-link">
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
          </div>
        )}
        {isShowCopyright && (
        <div className={`footer__copyright ${isShowLinks ? 'footer__copyright--with-border' : ''}`}>
          <p className="footer__copyright-text font-neusans">
            &copy; {new Date().getFullYear()} TastyPlates. All rights
            reserved.
          </p>
        </div>
        )}
      </div>
    </footer>
  );
}
