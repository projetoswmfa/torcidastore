import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Digite um email válido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "A confirmação de senha deve ter pelo menos 6 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signUp } = useAuthContext();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      console.log("Tentando registrar com email:", data.email);
      const { success, error, emailConfirmationRequired } = await signUp(
        data.email, 
        data.password,
        { fullName: data.name }
      );
      
      if (success) {
        // Se o cadastro for bem-sucedido
        setRegistrationSuccess(true);
        
        if (emailConfirmationRequired) {
          toast({
            title: "Conta criada com sucesso!",
            description: "Enviamos um email de confirmação. Por favor, verifique sua caixa de entrada.",
          });
        } else {
          toast({
            title: "Conta criada com sucesso!",
            description: "Você já pode fazer login com suas credenciais.",
          });
          
          // Redirecionar após um delay curto
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        }
      } else if (error) {
        // Tratar mensagens de erro específicas
        let message = "Não foi possível completar o cadastro. Tente novamente.";
        
        if (error.code === 'invalid_email') {
          form.setError('email', { 
            type: 'manual', 
            message: 'Email inválido. Por favor, forneça um endereço de email válido.' 
          });
          message = "O email fornecido é inválido.";
        } else if (error.code === 'user_exists') {
          form.setError('email', { 
            type: 'manual', 
            message: 'Este email já está cadastrado.' 
          });
          message = "Este email já está cadastrado. Tente fazer login ou recuperar sua senha.";
        } else if (error.message) {
          message = error.message;
        }
        
        setErrorMessage(message);
        toast({
          variant: "destructive",
          title: "Erro ao criar conta",
          description: message,
        });
      }
    } catch (error: any) {
      // Tratamento de erro genérico como fallback
      let message = "Não foi possível completar o cadastro. Tente novamente.";
      
      if (error?.message) {
        message = error.message;
      }
      
      setErrorMessage(message);
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: message,
      });
      console.error("Erro de cadastro:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Criar Conta</CardTitle>
          <CardDescription className="text-center">
            Preencha os dados abaixo para criar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registrationSuccess ? (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertTitle className="text-green-800">Cadastro realizado!</AlertTitle>
              <AlertDescription className="text-green-700">
                Foi enviado um link de confirmação para o seu email.
                Por favor, verifique sua caixa de entrada (e pasta de spam) para ativar sua conta.
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
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome completo</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Seu nome completo" 
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
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar senha</FormLabel>
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
                    {isLoading ? "Criando conta..." : "Criar conta"}
                  </Button>
                </form>
              </Form>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-gray-500">
            Já tem uma conta?{" "}
            <Link to="/login" className="text-sport-blue hover:underline">
              Faça login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register; 