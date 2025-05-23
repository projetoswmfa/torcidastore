import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Menu, Search, User, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { items } = useCart();
  
  const categories = [
    { name: "Times Brasileiros", path: "/categoria/brasileiros" },
    { name: "Internacionais", path: "/categoria/internacionais" },
    { name: "Seleções", path: "/categoria/selecoes" },
    { name: "Retrô", path: "/categoria/retro" },
    { name: "Conjuntos", path: "/categoria/conjuntos" },
    { name: "Inverno", path: "/categoria/inverno" },
    { name: "Promoções", path: "/categoria/promocoes" },
    { name: "Lançamentos", path: "/categoria/lancamentos" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background shadow-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-2">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src="https://torcidastore.s3.sa-east-1.amazonaws.com/src/assets/Logo.svg" 
              alt="Jersey League Logo" 
              className="h-24"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <ul className="flex space-x-8">
              {categories.map((category) => (
                <li key={category.path}>
                  <Link 
                    to={category.path}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            {/* Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Account Link */}
            <Link to="/login">
              <Button variant="ghost" size="icon" aria-label="Entrar">
                <User className="h-5 w-5" />
              </Button>
            </Link>

            {/* Cart Link */}
            <Link to="/carrinho" className="relative">
              <Button variant="ghost" size="icon" aria-label="Shopping Cart" className="nav-icon-button">
                <ShoppingCart className="h-5 w-5 text-foreground" />
                {items?.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-sport-blue text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close Menu" : "Open Menu"}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            searchOpen ? "max-h-16 py-3" : "max-h-0"
          )}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar camisas..."
              className="pl-10 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "fixed inset-0 bg-background z-40 transform transition-transform duration-300 ease-in-out md:hidden",
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-6 pt-20">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>
          
          <nav className="flex-1">
            <ul className="space-y-6">
              {categories.map((category) => (
                <li key={category.path}>
                  <Link
                    to={category.path}
                    className="text-lg font-medium text-foreground hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/login"
                  className="text-lg font-medium text-foreground hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Entrar / Cadastrar
                </Link>
              </li>
              <li className="mt-2 pt-2 border-t border-border">
                <Link
                  to="/admin"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 border border-slate-700 shadow-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield className="h-5 w-5 text-blue-400" />
                  <div>
                    <span className="text-white font-medium block">Área Administrativa</span>
                    <span className="text-xs text-slate-400">Acesso restrito</span>
                  </div>
                  <div className="ml-auto bg-blue-500/20 text-blue-400 text-xs py-1 px-2 rounded font-medium">
                    Admin
                  </div>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
