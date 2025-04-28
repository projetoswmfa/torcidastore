import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 px-4 md:px-6 lg:px-8 w-full max-w-[1400px] mx-auto">
        {children}
      </main>
      <Footer />
    </div>
  );
}
