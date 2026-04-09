export type CartItemPayload = {
  variantId: string;
  productName: string;
  variantName: string;
  unit: string;
  price: number;

  quantity: number;
};

export type QuantityType = "discrete" | "continuous";

export type Variant = {
  id?: string;
  name: string;
  unit: string;
  price: number;
  stock: number;
  quantityType: "discrete" | "continuous";
  step: number;
  minOrder: number;
};

export type Product = {
  id: string;
  name: string;
  category: { id: string; name: string } | null;
  variants: Variant[];
};

export type CartItem = CartItemPayload & {
  unit: string;
  stock: number;
  quantityType: QuantityType;
  step: number;
  minOrder: number;
};

export type CheckoutState = {
  success: boolean;
  message?: string;
  invoiceNo?: string;
};

export type ProductWithVariants = {
  id: string;
  name: string;
  createdAt: Date;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  variants: {
    id: string;
    name: string;
    unit: string;
    price: number;
    stock: number;
    quantityType: QuantityType;
    step: number;
    minOrder: number;
  }[];
};
