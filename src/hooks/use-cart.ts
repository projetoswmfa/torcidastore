import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  size: string;
  image: string;
  quantity: number;
  customization?: {
    name: string;
    number: string;
  };
};

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, size: string) => void;
  updateQuantity: (id: string, size: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
};

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item: CartItem) => {
        const currentItems = get().items;
        const existingItemIndex = currentItems.findIndex(
          (i) => i.id === item.id && i.size === item.size && 
          // Considerar personalização como parte da identificação única do item
          JSON.stringify(i.customization) === JSON.stringify(item.customization)
        );

        if (existingItemIndex > -1) {
          const updatedItems = [...currentItems];
          updatedItems[existingItemIndex].quantity += item.quantity;
          set({ items: updatedItems });
        } else {
          set({ items: [...currentItems, item] });
        }
      },
      
      removeItem: (id: string, size: string) => {
        set({
          items: get().items.filter((item) => !(item.id === id && item.size === size)),
        });
      },
      
      updateQuantity: (id: string, size: string, quantity: number) => {
        const updatedItems = get().items.map((item) => {
          if (item.id === id && item.size === size) {
            return { ...item, quantity };
          }
          return item;
        });
        
        set({ items: updatedItems });
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      total: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: "cart-storage",
    }
  )
);
