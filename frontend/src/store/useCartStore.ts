import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
    productoId: string;
    descripcion: string;
    proveedorId?: string;
    proveedorNombre: string;
    precio: number;
    bulto: number;
    cantidad: number;
}

interface CartState {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'cantidad'>, cantidad?: number) => void;
    removeItem: (productoId: string) => void;
    updateCantidad: (productoId: string, cantidad: number) => void;
    clearCart: () => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
        items: [],
        addItem: (item, cantidad = 1) => {
            const { items } = get();
            const existe = items.find((i) => i.productoId === item.productoId);
            if (existe) {
            set({
                items: items.map((i) =>
                i.productoId === item.productoId
                    ? { ...i, cantidad: i.cantidad + cantidad }
                    : i
                ),
            });
            } else {
            set({ items: [...items, { ...item, cantidad }] });
            }
        },
        removeItem: (productoId) => {
            set({ items: get().items.filter((i) => i.productoId !== productoId) });
        },
        updateCantidad: (productoId, cantidad) => {
            if (cantidad <= 0) {
            get().removeItem(productoId);
            return;
            }
            set({
            items: get().items.map((i) =>
                i.productoId === productoId ? { ...i, cantidad } : i
            ),
            });
        },
        clearCart: () => set({ items: [] }),
        }),
        {
        name: 'carrito-pedidos-storage',
        storage: createJSONStorage(() => localStorage),
        }
    )
    );