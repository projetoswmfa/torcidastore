import { useState } from "react";
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
import { AlertCircle, CheckCircle } from "lucide-react";
import { checkUserExists, checkUserIsAdmin, createAdminUser } from "@/utils/supabaseAdmin";
import { supabase } from "@/integrations/supabase/client";

const diagnosticSchema = z.object({
  email: z.string().email("Digite um email válido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type DiagnosticFormValues = z.infer<typeof diagnosticSchema>;

const AuthDiagnostic = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<DiagnosticFormValues>({
    resolver: zodResolver(diagnosticSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const checkUser = async (data: DiagnosticFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setResult(null);
    
    try {
      // Verificar se o usuário existe
      const userCheck = await checkUserExists(data.email);
      
      if (!userCheck.success) {
        setError(`Erro ao verificar usuário: ${userCheck.error?.message}`);
        setResult(userCheck);
        return;
      }

      let finalResult: any = {
        ...userCheck,
        adminStatus: null,
      };

      // Se o usuário existir, tentar fazer login para obter o ID
      if (userCheck.exists) {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        
        if (loginError) {
          setError(`Erro ao fazer login: ${loginError.message}`);
          finalResult.loginError = loginError;
        } else if (loginData.user) {
          finalResult.user = loginData.user;
          
          // Verificar se é admin
          const adminCheck = await checkUserIsAdmin(loginData.user.id);
          finalResult.adminStatus = adminCheck;
          
          setSuccess(`Usuário verificado com sucesso. Status de admin: ${adminCheck.isAdmin ? 'Sim' : 'Não'}`);
        }
      } else {
        setError(`Usuário não encontrado: ${data.email}`);
      }
      
      setResult(finalResult);
    } catch (err: any) {
      setError(`Erro durante diagnóstico: ${err.message}`);
      console.error("Erro durante diagnóstico:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const createAdmin = async (data: DiagnosticFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setResult(null);
    
    try {
      // Verificar primeiro se o usuário já existe
      const userCheck = await checkUserExists(data.email);
      
      if (userCheck.exists) {
        setError(`O usuário ${data.email} já existe. Use a função de diagnóstico para verificar o status.`);
        return;
      }
      
      // Criar novo usuário admin
      const createResult = await createAdminUser(data.email, data.password);
      
      if (!createResult.success) {
        setError(`Erro ao criar administrador: ${createResult.error?.message}`);
      } else {
        setSuccess(`Administrador criado com sucesso! ID: ${createResult.userId}`);
      }
      
      setResult(createResult);
    } catch (err: any) {
      setError(`Erro ao criar administrador: ${err.message}`);
      console.error("Erro ao criar administrador:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Diagnóstico de Autenticação</CardTitle>
          <CardDescription className="text-center">
            Verifique e resolva problemas de autenticação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="admin@exemplo.com" 
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
              
              <div className="flex space-x-2">
                <Button 
                  type="button" 
                  className="flex-1"
                  disabled={isLoading}
                  onClick={form.handleSubmit(checkUser)}
                >
                  {isLoading ? "Verificando..." : "Verificar Usuário"}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline"
                  className="flex-1"
                  disabled={isLoading}
                  onClick={form.handleSubmit(createAdmin)}
                >
                  {isLoading ? "Criando..." : "Criar Admin"}
                </Button>
              </div>
            </form>
          </Form>
          
          {result && (
            <div className="mt-6 p-4 bg-gray-50 rounded border">
              <h3 className="font-medium mb-2">Resultado do Diagnóstico:</h3>
              <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-64">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-xs text-gray-500 text-center">
            Esta ferramenta deve ser usada apenas para diagnóstico e resolução de problemas.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthDiagnostic; 