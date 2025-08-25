import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart";
import { useState } from "react";
import CartDrawer from "./cart-drawer";

export default function CartButton() {
  const { totalItems } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className="relative flex flex-col items-center text-white hover:text-rose-100 hover:bg-rose-800 p-1 md:p-1 transition-all duration-200 min-w-[40px]"
        data-testid="button-cart"
      >
        <ShoppingCart className="h-5 w-5 md:h-5 md:w-5" />
        <span className="hidden md:block text-xs font-medium">Cart</span>
        {totalItems > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-red-500"
            data-testid="badge-cart-count"
          >
            {totalItems}
          </Badge>
        )}
      </Button>
      
      <CartDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}