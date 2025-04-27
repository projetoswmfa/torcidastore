import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted text-muted-foreground pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4">Torcida Store</h3>
            <p className="mb-6">
              A melhor loja para encontrar camisas oficiais dos seus times favoritos.
              Produtos de qualidade e entrega para todo o Brasil.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4">Links Rápidos</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/categoria/brasileiros" className="hover:text-primary transition-colors">
                  Times Brasileiros
                </Link>
              </li>
              <li>
                <Link to="/categoria/internacionais" className="hover:text-primary transition-colors">
                  Internacionais
                </Link>
              </li>
              <li>
                <Link to="/categoria/selecoes" className="hover:text-primary transition-colors">
                  Seleções
                </Link>
              </li>
              <li>
                <Link to="/categoria/retro" className="hover:text-primary transition-colors">
                  Retrô
                </Link>
              </li>
              <li>
                <Link to="/categoria/conjuntos" className="hover:text-primary transition-colors">
                  Conjuntos
                </Link>
              </li>
              <li>
                <Link to="/categoria/inverno" className="hover:text-primary transition-colors">
                  Inverno
                </Link>
              </li>
              <li>
                <Link to="/categoria/promocoes" className="hover:text-primary transition-colors">
                  Promoções
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 mt-0.5 text-primary" />
                <span>Antônio Emídio Moreira, 51 - Catiguá/SP</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-primary" />
                <span>(17) 99214-7984</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-primary" />
                <span>jhonyfersouza07@gmail.com</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4">Newsletter</h3>
            <p className="mb-4">
              Inscreva-se para receber ofertas exclusivas e novidades
            </p>
            <div className="flex flex-col space-y-2">
              <Input
                type="email"
                placeholder="Seu e-mail"
                className="border-primary focus:ring-primary"
              />
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Inscrever-se
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center text-sm">
          <p>&copy; {currentYear} Jersey League. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
