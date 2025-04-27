import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase } from '@/integrations/supabase/client'

// Garantir que o supabase seja inicializado corretamente
const initializeApp = async () => {
  try {
    // Verificar a sessão atual como uma forma de garantir que o cliente está pronto
    await supabase.auth.getSession();
    console.log("Supabase client inicializado com sucesso");
  } catch (error) {
    console.error("Erro ao inicializar o cliente Supabase:", error);
  } finally {
    // Renderizar a aplicação de qualquer forma
    createRoot(document.getElementById("root")!).render(<App />);
  }
};

// Iniciar a aplicação
initializeApp();
