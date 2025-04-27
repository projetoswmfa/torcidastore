import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, ChevronLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { orderStatusTranslation } from "@/hooks/useOrders";

// Definindo o tipo OrderItem localmente
interface OrderItem {
  id: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
  customization?: {
    name: string;
    number: string;
  };
}

export default function Cart() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart, total } = useCart();
  const [coupon, setCoupon] = useState("");
  // Estados para o formulário de dados do cliente
  const [name, setName] = useState("");
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const formattedTotal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(total());

  const handleApplyCoupon = () => {
    if (coupon.trim() === "") return;
    
    toast.info("Cupom de desconto inválido ou expirado.");
    setCoupon("");
  };

  // Função para buscar endereço a partir do CEP usando a API ViaCEP
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCep = e.target.value.replace(/\D/g, '');
    setCep(newCep);

    if (newCep.length === 8) {
      try {
        setIsLoadingCep(true);
        const response = await fetch(`https://viacep.com.br/ws/${newCep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          const fullAddress = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
          setAddress(fullAddress);
        } else {
          toast.error("CEP não encontrado");
        }
      } catch (error) {
        toast.error("Erro ao buscar CEP");
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  // Formatar número de WhatsApp
  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers;
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatWhatsApp(e.target.value);
    setWhatsapp(formattedValue);
  };

  // Função para enviar pedido pelo WhatsApp
  const handleCheckout = async () => {
    // Validar campos obrigatórios
    if (!name || !cep || !address || !whatsapp) {
      toast.error("Por favor, preencha todos os campos do formulário");
      return;
    }

    try {
      // Obter o ID do usuário atual
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        toast.error("Erro ao verificar sua sessão");
        console.error("Erro de sessão:", sessionError);
        return;
      }

      const userId = sessionData.session?.user.id;
      if (!userId) {
        toast.error("Você precisa estar logado para finalizar a compra");
        navigate("/login?redirect=/cart");
        return;
      }

      // Criar o objeto de pedido para o banco de dados com a estrutura correta
      const orderData = {
        user_id: userId,
        customer: name,
        customer_address: address,
        customer_cep: cep,
        customer_whatsapp: whatsapp,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          size: item.size,
          quantity: item.quantity,
          customization: item.customization
        })),
        total_amount: total(),
        shipping_address: { address: address },
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Inserir o pedido diretamente usando o cliente Supabase
      // Usando type assertion para contornar o erro de tipagem
      const { data, error } = await supabase
        .from('orders')
        .insert(orderData as any)
        .select();

      if (error) {
        console.error("Erro ao criar pedido:", error);
        toast.error(`Falha ao criar pedido: ${error.message}`);
        throw error;
      }

      console.log("Pedido criado com sucesso:", data);
      
      // Criar mensagem para WhatsApp
      let message = "🏆 Olá, Torcida Store! Quero fazer um pedido: 🏆\n\n";
      
      // Adicionar informações de cada item
      items.forEach(item => {
        message += "👕 Camisa: " + item.name + "\n";
        message += "📏 Tamanho: " + item.size + "\n";
        
        if (item.customization) {
          message += "✏ Nome na camisa: " + item.customization.name + "\n";
          message += "🔢 Número na camisa: " + item.customization.number + "\n";
        } else {
          message += "✏ Nome na camisa: Não personalizado\n";
          message += "🔢 Número na camisa: Não personalizado\n";
        }
        
        message += "🛒 Quantidade: " + item.quantity + "\n\n";
      });

      // Adicionar dados do cliente
      message += "📌 Dados\n";
      message += "👤 Nome: " + name + "\n";
      message += "📮 CEP: " + cep + "\n";
      message += "🏡 Endereço: " + address + "\n";
      message += "📱 WhatsApp: " + whatsapp + "\n";

      // Codificar a mensagem para URL
      const encodedMessage = encodeURIComponent(message);
      
      // Número do WhatsApp para enviar (sem formatação)
      const targetWhatsApp = "17988251207";
      
      // Criar link do WhatsApp
      const whatsappLink = `https://wa.me/55${targetWhatsApp}?text=${encodedMessage}`;
      
      // Abrir link em nova aba
      window.open(whatsappLink, '_blank');
      
      toast.success("Pedido realizado com sucesso!");
      clearCart();
      
      // Redirecionar para a página de pedidos/confirmação
      navigate('/meus-pedidos');
    } catch (err) {
      console.error("Erro ao processar pedido:", err);
      toast.error("Ocorreu um erro ao processar seu pedido. Por favor, tente novamente.");
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Carrinho de Compras</h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-medium mb-4 text-foreground">Seu carrinho está vazio</h2>
            <p className="text-muted-foreground mb-8">
              Adicione produtos ao seu carrinho para continuar comprando
            </p>
            <Link to="/">
              <Button className="bg-primary hover:bg-primary/90">
                Continuar comprando
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-card text-card-foreground rounded-lg shadow-md border border-border p-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left pb-4">Produto</th>
                      <th className="text-left pb-4">Preço</th>
                      <th className="text-left pb-4">Quantidade</th>
                      <th className="text-right pb-4">Subtotal</th>
                      <th className="pb-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item) => {
                      const formattedPrice = new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(item.price);

                      const formattedSubtotal = new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(item.price * item.quantity);

                      return (
                        <tr key={`${item.id}-${item.size}-${item.customization?.number || ''}`} className="py-4">
                          <td className="py-4">
                            <div className="flex items-center space-x-4">
                              <div className="w-20 h-20 rounded overflow-hidden">
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <h3 className="font-medium text-foreground">{item.name}</h3>
                                <p className="text-sm text-muted-foreground">Tamanho: {item.size}</p>
                                {item.customization && (
                                  <div className="mt-1">
                                    <Badge variant="outline" className="mr-2 text-primary border-primary">
                                      Personalizado
                                    </Badge>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Nome: <span className="font-medium">{item.customization.name}</span>
                                      {" | "}
                                      Número: <span className="font-medium">{item.customization.number}</span>
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4">{formattedPrice}</td>
                          <td className="py-4">
                            <div className="flex items-center border border-border rounded-md w-24">
                              <button
                                className="px-2 py-1 border-r border-border"
                                onClick={() => {
                                  if (item.quantity > 1) {
                                    updateQuantity(item.id, item.size, item.quantity - 1);
                                  }
                                }}
                              >
                                -
                              </button>
                              <span className="px-2 py-1 flex-1 text-center">{item.quantity}</span>
                              <button
                                className="px-2 py-1 border-l border-border"
                                onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="text-right py-4">
                            {formattedSubtotal}
                          </td>
                          <td className="text-right py-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id, item.size)}
                              aria-label={`Remove ${item.name} from cart`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="mt-6 flex justify-between items-center">
                  <Link to="/">
                    <Button variant="outline" className="flex items-center gap-2">
                      <ChevronLeft className="h-4 w-4" />
                      Continuar comprando
                    </Button>
                  </Link>

                  <Button 
                    variant="outline" 
                    className="text-destructive border-destructive hover:bg-destructive/10"
                    onClick={clearCart}
                  >
                    Limpar carrinho
                  </Button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-card text-card-foreground rounded-lg shadow-md border border-border p-6 sticky top-24">
                <h2 className="text-xl font-semibold mb-4 text-foreground">Resumo do pedido</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formattedTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frete</span>
                    <span>Calculado no checkout</span>
                  </div>
                </div>
                
                <div className="border-t border-border pt-4 mb-6">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formattedTotal}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Formulário de dados do cliente */}
                  <div className="space-y-4 border-t border-border pt-4 mb-2">
                    <h3 className="font-medium text-foreground mb-2">Informações para entrega</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome:</Label>
                      <Input 
                        id="name"
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP:</Label>
                      <Input 
                        id="cep"
                        type="text" 
                        value={cep}
                        onChange={handleCepChange}
                        placeholder="00000-000"
                        maxLength={8}
                        required
                      />
                      {isLoadingCep && <p className="text-xs text-muted-foreground">Buscando CEP...</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Endereço:</Label>
                      <Input 
                        id="address"
                        type="text" 
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Seu endereço completo"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp:</Label>
                      <Input 
                        id="whatsapp"
                        type="text" 
                        value={whatsapp}
                        onChange={handleWhatsAppChange}
                        placeholder="DDD + número"
                        maxLength={11}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Input 
                      type="text" 
                      placeholder="Cupom de desconto" 
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                    />
                    <Button 
                      variant="outline" 
                      onClick={handleApplyCoupon}
                    >
                      Aplicar
                    </Button>
                  </div>
                  
                  <Button 
                    className="w-full bg-sport-blue hover:bg-blue-600 cart-button mt-4"
                    onClick={handleCheckout}
                    disabled={items.length === 0 || !name || !cep || !address || !whatsapp}
                  >
                    <span className="text-white">Finalizar Compra</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
