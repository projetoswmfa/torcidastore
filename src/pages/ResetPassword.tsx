import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "A confirmação deve ter pelo menos 6 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hashToken, setHashToken] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // Extrair o token de redefinição de senha da URL
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get("token");
    
    if (!token) {
      setErrorMessage("Link de redefinição inválido ou expirado. Solicite uma nova redefinição de senha.");
    } else {
      setHashToken(token);
    }
  }, [location.search]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!hashToken) {
      setErrorMessage("Token de redefinição não encontrado. Solicite uma nova redefinição de senha.");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Atualizar a senha usando o token fornecido
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });
      
      if (error) {
        throw error;
      }
      
      setResetComplete(true);
      toast({
        title: "Senha atualizada!",
        description: "Sua senha foi redefinida com sucesso. Faça login com sua nova senha.",
      });
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate("/login");
      }, 3000);
      
    } catch (error: any) {
      let message = "Não foi possível redefinir sua senha. Tente novamente.";
      
      if (error?.message) {
        message = error.message;
      }
      
      setErrorMessage(message);
      
      toast({
        variant: "destructive",
        title: "Erro na redefinição de senha",
        description: message,
      });
      console.error("Erro ao redefinir senha:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Redefinir Senha</CardTitle>
          <CardDescription className="text-center">
            Crie uma nova senha para sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resetComplete ? (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-700">
                Senha atualizada com sucesso! Você será redirecionado para a página de login.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {errorMessage && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {errorMessage}
                  </AlertDescription>
                </Alert>
              )}
              
              {!hashToken ? (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">
                    O link de redefinição de senha é inválido ou expirou.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/recuperar-senha")}
                  >
                    Solicitar nova redefinição
                  </Button>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nova senha</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="••••••••" 
                              type="password" 
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
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar nova senha</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="••••••••" 
                              type="password" 
                              {...field} 
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Redefinindo..." : "Redefinir senha"}
                    </Button>
                  </form>
                </Form>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-gray-500">
            Lembrou sua senha?{" "}
            <Button 
              variant="link" 
              className="p-0 h-auto text-sport-blue"
              onClick={() => navigate("/login")}
            >
              Faça login
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ResetPassword; 