"use client";

import { useState, useTransition, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  checkoutAction,
  type CartItemPayload,
  type CheckoutState,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// ─── Types ────────────────────────────────────────────────────────────────────

type Variant = {
  id: string;
  name: string;
  price: number;
  stock: number;
};

type Product = {
  id: string;
  name: string;
  variants: Variant[];
};

type CartItem = CartItemPayload & {
  stock: number; // stok real-time untuk batas qty di UI
};

type Props = {
  products: Product[];
  cashierName: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PosClient({ products, cashierName }: Props) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState("");
  const [result, setResult] = useState<CheckoutState | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Cart operations ──────────────────────────────────────────────────────

  const addToCart = useCallback((product: Product, variant: Variant) => {
    if (variant.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.variantId === variant.id);
      if (existing) {
        return prev.map((i) =>
          i.variantId === variant.id
            ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) }
            : i,
        );
      }
      return [
        ...prev,
        {
          variantId: variant.id,
          productName: product.name,
          variantName: variant.name,
          price: variant.price,
          quantity: 1,
          stock: variant.stock,
        },
      ];
    });
    setResult(null);
  }, []);

  const updateQty = useCallback((variantId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.variantId === variantId
            ? {
                ...i,
                quantity: Math.max(0, Math.min(i.quantity + delta, i.stock)),
              }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setCart((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setPayment("");
    setDiscount(0);
  }, []);

  // ── Totals ───────────────────────────────────────────────────────────────

  const total = useMemo(
    () => cart.reduce((s, i) => s + i.price * i.quantity, 0),
    [cart],
  );
  const grandTotal = Math.max(0, total - discount);
  const paymentNum = parseInt(payment.replace(/\D/g, ""), 10) || 0;
  const change = paymentNum - grandTotal;

  // ── Filtered products ─────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  // ── Checkout ──────────────────────────────────────────────────────────────

  const handleCheckout = () => {
    if (cart.length === 0 || paymentNum < grandTotal) return;

    const payload: {
      items: CartItemPayload[];
      payment: number;
      discount: number;
    } = {
      items: cart.map(
        ({ variantId, productName, variantName, price, quantity }) => ({
          variantId,
          productName,
          variantName,
          price,
          quantity,
        }),
      ),
      payment: paymentNum,
      discount,
    };

    const formData = new FormData();
    formData.set("payload", JSON.stringify(payload));

    startTransition(async () => {
      const res = await checkoutAction(
        null as unknown as CheckoutState,
        formData,
      );
      console.log("Checkout result:", res);
      setResult(res);
      if (res?.success) {
        clearCart();
        router.refresh();
      }
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)] bg-muted/30 p-4 rounded-xl">
      {/* ───────────── LEFT: PRODUCT AREA ───────────── */}
      <div className="flex-1 flex flex-col min-w-0 gap-4 bg-card rounded-xl p-4 shadow-sm border">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari produk..."
              className="pl-9 h-11 text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            Kasir:
            <span className="ml-2 font-semibold text-foreground">
              {cashierName}
            </span>
          </div>
        </div>

        {/* Product Grid */}
        <ScrollArea className="flex-1 rounded-lg border">
          <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.length === 0 && (
              <div className="col-span-full py-16 text-center text-muted-foreground text-sm">
                Produk tidak ditemukan
              </div>
            )}

            {filtered.map((product) =>
              product.variants.map((variant) => {
                const inCart = cart.find((c) => c.variantId === variant.id);
                const outOfStock = variant.stock <= 0;

                return (
                  <button
                    key={variant.id}
                    onClick={() => addToCart(product, variant)}
                    disabled={outOfStock}
                    className={[
                      "group flex flex-col justify-between rounded-xl border p-4 text-left transition-all duration-150 shadow-sm",
                      outOfStock
                        ? "opacity-40 cursor-not-allowed"
                        : inCart
                          ? "border-primary bg-primary/10 shadow-md scale-[0.98]"
                          : "hover:border-primary hover:shadow-md hover:-translate-y-0.5",
                    ].join(" ")}
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-sm line-clamp-2">
                        {product.name}
                      </p>

                      {variant.name !== "Default" && (
                        <p className="text-xs text-muted-foreground">
                          {variant.name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1 mt-3">
                      <p className="text-base font-bold text-primary">
                        {formatRupiah(variant.price)}
                      </p>

                      <p
                        className={`text-xs ${
                          variant.stock <= 5
                            ? "text-amber-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        Stok: {variant.stock}
                      </p>

                      {inCart && (
                        <p className="text-xs font-medium text-primary">
                          + {inCart.quantity} di keranjang
                        </p>
                      )}
                    </div>
                  </button>
                );
              }),
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ───────────── RIGHT: CART AREA ───────────── */}
      <div className="w-96 shrink-0 flex flex-col rounded-xl border bg-background shadow-lg">
        {/* HEADER */}
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-lg">
              <ShoppingCart className="size-5" />
              Keranjang
            </div>

            {cart.length > 0 && (
              <span className="text-xs bg-muted px-2 py-1 rounded-full">
                {cart.reduce((s, i) => s + i.quantity, 0)} item
              </span>
            )}
          </div>
        </div>

        <Separator />

        {/* CART ITEMS (SCROLL AREA) */}
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full px-5 py-3">
            {cart.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                Keranjang kosong
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.variantId}
                    className="rounded-lg bg-muted/40 p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.productName}
                        </p>
                        {item.variantName !== "Default" && (
                          <p className="text-xs text-muted-foreground">
                            {item.variantName}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(item.variantId, -1)}
                          className="rounded-md border size-7 flex items-center justify-center hover:bg-accent"
                        >
                          <Minus className="size-3" />
                        </button>

                        <span className="w-8 text-center text-sm font-medium tabular-nums">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => updateQty(item.variantId, 1)}
                          disabled={item.quantity >= item.stock}
                          className="rounded-md border size-7 flex items-center justify-center hover:bg-accent disabled:opacity-40"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      <span className="text-sm font-semibold tabular-nums">
                        {formatRupiah(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <Separator />

        {/* FIXED BOTTOM */}
        <div className="p-5 space-y-4 mt-auto bg-background">
          {/* Totals */}
          <div className="rounded-lg bg-muted/40 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatRupiah(total)}</span>
            </div>

            <div className="flex justify-between text-sm items-center">
              <span>Diskon</span>
              <Input
                type="number"
                min={0}
                max={total}
                value={discount === 0 ? "" : discount}
                onChange={(e) =>
                  setDiscount(
                    Math.min(total, Math.max(0, parseInt(e.target.value) || 0)),
                  )
                }
                className="h-8 w-28 text-right text-sm tabular-nums"
              />
            </div>

            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary tabular-nums">
                {formatRupiah(grandTotal)}
              </span>
            </div>
          </div>

          {/* Payment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nominal Bayar</label>

            <Input
              min={grandTotal}
              value={payment}
              onChange={(e) => {
                setPayment(e.target.value);
                setResult(null);
              }}
              placeholder="Masukkan nominal..."
              className="h-11 text-right text-lg font-semibold tabular-nums"
            />

            {paymentNum > 0 && (
              <div className="flex justify-between text-sm">
                <span>Kembalian</span>
                <span
                  className={`font-bold tabular-nums ${
                    change < 0 ? "text-destructive" : "text-green-600"
                  }`}
                >
                  {formatRupiah(change)}
                </span>
              </div>
            )}
          </div>

          {/* RESULT MESSAGE */}
          {result && (
            <div
              className={`rounded-lg p-3 text-sm flex items-start gap-2 border ${
                result.success
                  ? "bg-green-500/10 text-green-600 border-green-500/20"
                  : "bg-destructive/10 text-destructive border-destructive/20"
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="size-4 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="size-4 mt-0.5 shrink-0" />
              )}

              <div>
                {result.success ? (
                  <>
                    <p className="font-semibold">Transaksi berhasil!</p>
                    <p className="text-xs opacity-80">{result.invoiceNo}</p>
                  </>
                ) : (
                  <p>{result.message}</p>
                )}
              </div>
            </div>
          )}

          {/* CHECKOUT BUTTON */}
          <Button
            onClick={handleCheckout}
            disabled={
              isPending ||
              cart.length === 0 ||
              paymentNum < grandTotal ||
              grandTotal === 0
            }
            className="w-full h-14 text-lg font-bold shadow-md"
            size="lg"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              "BAYAR"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
