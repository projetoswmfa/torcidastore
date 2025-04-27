import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-md px-6">
        <h1 className="text-6xl font-bold mb-4 text-sport-blue">404</h1>
        <p className="text-2xl font-medium text-gray-800 mb-4">Página não encontrada</p>
        <p className="text-gray-600 mb-8">
          A página que você está procurando não existe ou foi movida para outro endereço.
        </p>
        <Link to="/">
          <Button className="bg-sport-blue hover:bg-blue-600">
            Voltar para a Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
