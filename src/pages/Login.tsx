import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Digite um email válido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuthContext();

  // Se o usuário foi redirecionado de outra página, verificamos se há um estado com uma URL de redirecionamento
  const from = location.state?.from?.pathname || "/";

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      console.log("Login - Tentando autenticar com:", data.email);
      const result = await signIn(data.email, data.password);
      
      if (result.success) {
        console.log("Login - Autenticação bem-sucedida");
        toast({
          title: "Login bem-sucedido",
          description: "Você foi autenticado com sucesso!",
        });
        
        // Redirecionar automaticamente para a página admin se for o usuário principal
        if (data.email.toLowerCase() === 'torcida.store@gmail.com') {
          console.log("Login - Usuário principal identificado, redirecionando para /admin");
          navigate('/admin');
        } else {
          // Verifica se existe uma rota administrativa salva no localStorage
          const lastAdminRoute = localStorage.getItem('lastAdminRoute');
          if (lastAdminRoute) {
            navigate(lastAdminRoute);
          } else {
            navigate(from);
          }
        }
      } else {
        console.error("Login - Erro no resultado da autenticação:", result.error);
        throw result.error;
      }
    } catch (error: any) {
      // Tratamento de erro mais detalhado
      let message = "Erro ao fazer login. Tente novamente.";
      
      console.error("Login - Erro detalhado:", {
        error: error,
        message: error?.message,
        code: error?.code
      });
      
      if (error?.message?.includes("Invalid login credentials")) {
        message = "Email ou senha incorretos. Verifique suas credenciais.";
      } else if (error?.message?.includes("Email not confirmed")) {
        message = "Seu email ainda não foi confirmado. Verifique sua caixa de entrada.";
      } else if (error?.message) {
        message = error.message;
      }
      
      setErrorMessage(message);
      
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: message,
      });
      console.error("Erro de login:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Entrar</CardTitle>
          <CardDescription className="text-center">
            Digite seu email e senha para acessar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="seu.email@exemplo.com" 
                        type="email" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="••••••••" 
                        type="password" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="text-right">
                      <Link to="/recuperar-senha" className="text-xs text-sport-blue hover:underline">
                        Esqueceu sua senha?
                      </Link>
                    </div>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-gray-500">
            Ainda não tem uma conta?{" "}
            <Link to="/cadastro" className="text-sport-blue hover:underline">
              Cadastre-se
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login; 