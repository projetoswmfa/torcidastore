import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function MyOrders() {
  const [currentTime] = useState(new Date().toLocaleTimeString());
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 animate-fade-in">
        <div className="max-w-3xl mx-auto bg-card text-card-foreground rounded-lg shadow-md border border-border p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <CheckCircle className="w-20 h-20 text-green-500 mb-4" />
            <h1 className="text-3xl font-bold mb-2 text-foreground">Pedido Realizado com Sucesso!</h1>
            <p className="text-muted-foreground">
              Recebemos seu pedido às {currentTime} e já estamos processando.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
              <h2 className="font-semibold text-green-800 dark:text-green-300 mb-2">Próximos Passos</h2>
              <ul className="list-disc list-inside text-green-700 dark:text-green-400 space-y-2">
                <li>Um atendente entrará em contato pelo WhatsApp para confirmar os detalhes do pedido</li>
                <li>Após a confirmação, você será informado sobre os métodos de pagamento disponíveis</li>
                <li>Assim que o pagamento for confirmado, seu pedido será preparado para envio</li>
              </ul>
            </div>
            
            <div className="border-t border-border pt-4">
              <h2 className="font-semibold mb-3">Precisa de Ajuda?</h2>
              <p className="text-muted-foreground mb-4">
                Se tiver alguma dúvida sobre seu pedido, entre em contato através do WhatsApp 
                <a 
                  href="https://wa.me/5517988251207" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary font-medium ml-1"
                >
                  (17) 98825-1207
                </a>
              </p>
            </div>
            
            <Link to="/">
              <Button className="w-full flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> 
                Voltar para a Loja
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
} 