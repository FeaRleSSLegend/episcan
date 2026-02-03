import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Footer = () => {
  const footerLinks = {
    product: [
      { name: "Features", href: "#features" },
      { name: "For Students", href: "#" },
      { name: "For Parents", href: "#" },
      { name: "For Schools", href: "#for-schools" },
    ],
    company: [
      { name: "About Us", href: "#" },
      { name: "Contact", href: "#contact" },
      { name: "Careers", href: "#" },
      { name: "Press", href: "#" },
    ],
    resources: [
      { name: "Documentation", href: "#" },
      { name: "Health Tips", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Support", href: "#" },
    ],
    legal: [
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
      { name: "Cookie Policy", href: "#" },
      { name: "HIPAA Compliance", href: "#" },
    ],
  };

  return (
    <footer className="bg-foreground text-background">
      <div className="container px-4 sm:px-6 py-10 sm:py-12 lg:py-16">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand - Full width on mobile, then responsive */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <img src={logo} alt="EPISCAN Logo" className="h-8 w-8 sm:h-10 sm:w-10 brightness-0 invert" />
              <span className="font-heading font-bold text-lg sm:text-xl">EPISCAN</span>
            </Link>
            <p className="text-background/70 text-sm leading-relaxed max-w-xs">
              Empowering schools with early health monitoring and outbreak detection systems.
            </p>
          </div>

          {/* Links Grid - 2x2 on mobile/tablet, row on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 lg:col-span-4 gap-8">
            {/* Product Links */}
            <div>
              <h3 className="font-heading font-semibold text-sm sm:text-base mb-3 sm:mb-4">Product</h3>
              <ul className="space-y-2 sm:space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-background/70 hover:text-background text-xs sm:text-sm transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="font-heading font-semibold text-sm sm:text-base mb-3 sm:mb-4">Company</h3>
              <ul className="space-y-2 sm:space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-background/70 hover:text-background text-xs sm:text-sm transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h3 className="font-heading font-semibold text-sm sm:text-base mb-3 sm:mb-4">Resources</h3>
              <ul className="space-y-2 sm:space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-background/70 hover:text-background text-xs sm:text-sm transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="font-heading font-semibold text-sm sm:text-base mb-3 sm:mb-4">Legal</h3>
              <ul className="space-y-2 sm:space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-background/70 hover:text-background text-xs sm:text-sm transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-background/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-background/60 text-xs sm:text-sm text-center sm:text-left">
            © {new Date().getFullYear()} EPISCAN. All rights reserved.
          </p>
          <div className="flex items-center gap-4 sm:gap-6">
            <a href="#" className="text-background/60 hover:text-background transition-colors" aria-label="Twitter">
              <span className="sr-only">Twitter</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="#" className="text-background/60 hover:text-background transition-colors" aria-label="LinkedIn">
              <span className="sr-only">LinkedIn</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
