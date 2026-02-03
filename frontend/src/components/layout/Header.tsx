import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const navigation = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "For Schools", href: "#for-schools" },
    { name: "Contact", href: "#contact" },
  ];

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <nav className="container flex items-center justify-between h-16 lg:h-20">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="EPISCAN Logo" className="h-10 w-10 lg:h-12 lg:w-12" />
          <span className="font-heading font-bold text-xl lg:text-2xl text-foreground">
            EPISCAN
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-muted-foreground hover:text-foreground font-medium transition-colors duration-200"
            >
              {item.name}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/login">Log in</Link>
          </Button>
          <Button variant="hero" asChild>
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <button
            className="p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-background border-b border-border animate-fade-in">
          <div className="container py-4 flex flex-col gap-4">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-muted-foreground hover:text-foreground font-medium py-2 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-4 border-t border-border">
              <Button variant="outline" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button variant="hero" asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
