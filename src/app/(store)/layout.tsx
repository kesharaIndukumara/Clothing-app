import { CartProvider } from "@/components/cart-context";
import { CartDrawer } from "@/components/cart-drawer";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { Analytics } from "@/components/analytics";
import { Suspense } from "react";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Header />
      <main>{children}</main>
      <Footer />
      <CartDrawer />
      <WhatsAppButton />
      <Suspense fallback={null}><Analytics /></Suspense>
    </CartProvider>
  );
}
