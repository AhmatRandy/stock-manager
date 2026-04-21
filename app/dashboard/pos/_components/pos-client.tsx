"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import CurrencyInput from "react-currency-input-field";
import { checkoutAction } from "../_actions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDisplayQty, snapQuantity } from "@/lib/stock";
import {
  CartItem,
  CartItemPayload,
  CheckoutState,
  Product,
  Variant,
} from "@/types/product";
import { formatRupiah } from "@/lib/format";

interface ProductProps {
  products: Product[];
  cashierName: string;
  page?: number;
  take?: number;
  hasNext?: boolean;
  searchQuery?: string;
}

export const PosClient = ({
  products,
  cashierName,
  page = 1,
  take = 100,
  hasNext = false,
  searchQuery = "",
}: ProductProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState<number>(0);
  const [result, setResult] = useState<CheckoutState | null>(null);
  const [isPending, startTransition] = useTransition();

  const addToCart = (product: Product, variant: Variant) => {
    const variantId = variant.id;
    if (!variantId || variant.stock <= 0) return;

    const nextItem: CartItem = {
      variantId,
      productName: product.name,
      variantName: variant.name,
      unit: variant.unit,
      price: variant.price,
      quantity: Math.min(variant.minOrder, variant.stock),
      stock: variant.stock,
      quantityType: variant.quantityType,
      step: variant.step,
      minOrder: variant.minOrder,
    };

    setCart((prev) => {
      const existing = prev.find((i) => i.variantId === variantId);
      if (existing) {
        const newQty = snapQuantity(
          existing.quantity + existing.step,
          existing.quantityType,
          existing.step,
          existing.minOrder,
          existing.stock,
        );
        return prev.map((i) =>
          i.variantId === variantId ? { ...i, quantity: newQty } : i,
        );
      }
      return [...prev, nextItem];
    });
    setResult(null);
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    params.set("take", String(take));
    if (searchQuery) params.set("search", searchQuery);
    router.push(`/dashboard/pos?${params.toString()}`);
  };

  const updateQty = (variantId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.variantId !== variantId) return i;
          const newQty = snapQuantity(
            i.quantity + delta,
            i.quantityType,
            i.step,
            i.minOrder,
            i.stock,
          );
          return { ...i, quantity: newQty };
        })
        .filter((i) => i.quantity >= i.minOrder),
    );
  };

  const setQty = (variantId: string, newQty: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.variantId !== variantId) return i;
          const snapped = snapQuantity(
            newQty,
            i.quantityType,
            i.step,
            i.minOrder,
            i.stock,
          );
          return { ...i, quantity: snapped };
        })
        .filter((i) => i.quantity >= i.minOrder),
    );
  };

  const removeItem = (variantId: string) => {
    setCart((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  const clearCart = () => {
    setCart([]);
    setPayment(0);
    setDiscount(0);
  };

  const total = useMemo(
    () => cart.reduce((s, i) => s + Math.round(i.price * i.quantity), 0),
    [cart],
  );
  const grandTotal = Math.max(0, total - discount);
  const paymentNum = payment || 0;
  const change = paymentNum - grandTotal;

  const categoryTabs = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    products.forEach((p) => {
      if (p.category) {
        const existing = map.get(p.category.id);
        if (existing) {
          existing.count++;
        } else {
          map.set(p.category.id, { name: p.category.name, count: 1 });
        }
      }
    });
    return Array.from(map.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      count: data.count,
    }));
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      const matchSearch = !q || p.name.toLowerCase().includes(q);
      const matchCategory =
        activeCategory === "all" || p.category?.id === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [products, search, activeCategory]);

  const handleCheckout = () => {
    if (cart.length === 0 || paymentNum < grandTotal) return;

    const payload: {
      items: CartItemPayload[];
      payment: number;
      discount: number;
    } = {
      items: cart.map(
        ({ variantId, productName, variantName, unit, price, quantity }) => ({
          variantId,
          productName,
          variantName,
          unit,
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

      setResult(res);
      if (res?.success) {
        clearCart();
        router.refresh();
      }
    });
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)] bg-muted/30 p-4 rounded-xl">
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

        <div className="flex items-center justify-between gap-4">
          <div />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              Sebelumnya
            </Button>
            <div className="text-sm text-muted-foreground">Halaman {page}</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={!hasNext}
            >
              Berikutnya
            </Button>
          </div>
        </div>

        {categoryTabs.length > 0 && (
          <div className="relative">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40">
              <div className="flex gap-3 pb-2 min-w-max px-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveCategory("all")}
                  className={[
                    "group relative shrink-0 rounded-xl px-5 py-3 text-sm font-bold transition-all duration-300 ease-out border-2",
                    activeCategory === "all"
                      ? "bg-linear-to-r from-primary to-primary/90 text-primary-foreground border-primary shadow-xl shadow-primary/30 scale-110 hover:scale-105"
                      : "bg-card border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground hover:scale-105 hover:shadow-lg",
                  ].join(" ")}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <span className="text-base">🏪</span>
                    Semua Produk
                    <span
                      className={[
                        "ml-1 px-2 py-0.5 rounded-full text-xs font-bold transition-colors",
                        activeCategory === "all"
                          ? "bg-white/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                      ].join(" ")}
                    >
                      {products.length}
                    </span>
                  </span>
                  {activeCategory === "all" && (
                    <span className="absolute inset-0 rounded-xl bg-linear-to-r from-primary/30 to-primary/10 blur-xl animate-pulse" />
                  )}
                </Button>
                {categoryTabs.map((cat) => (
                  <Button
                    key={cat.id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveCategory(cat.id)}
                    className={[
                      "group relative shrink-0 rounded-xl px-5 py-3 text-sm font-bold transition-all duration-300 ease-out border-2",
                      activeCategory === cat.id
                        ? "bg-linear-to-r from-primary to-primary/90 text-primary-foreground border-primary shadow-xl shadow-primary/30 scale-110 hover:scale-105"
                        : "bg-card border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground hover:scale-105 hover:shadow-lg",
                    ].join(" ")}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {cat.name}
                      <span
                        className={[
                          "ml-1 px-2 py-0.5 rounded-full text-xs font-bold transition-colors",
                          activeCategory === cat.id
                            ? "bg-white/20 text-primary-foreground"
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                        ].join(" ")}
                      >
                        {cat.count}
                      </span>
                    </span>
                    {activeCategory === cat.id && (
                      <span className="absolute inset-0 rounded-xl bg-linear-to-r from-primary/30 to-primary/10 blur-xl animate-pulse" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 rounded-lg border">
          <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.length === 0 && (
              <div className="col-span-full py-16 text-center text-muted-foreground text-sm">
                Produk tidak ditemukan
              </div>
            )}

            {filtered.map((product) =>
              product.variants.map((variant) => {
                if (!variant.id) return null;

                const variantId = variant.id;
                const inCart = cart.find((c) => c.variantId === variantId);
                const outOfStock = variant.stock <= 0;

                return (
                  <Button
                    key={variantId}
                    type="button"
                    variant="outline"
                    onClick={() => addToCart(product, variant)}
                    disabled={outOfStock}
                    className={[
                      "group h-auto whitespace-normal flex flex-col items-stretch justify-between rounded-xl p-4 text-left transition-all duration-150 shadow-sm",
                      outOfStock
                        ? "opacity-40 cursor-not-allowed"
                        : inCart
                          ? "border-primary bg-primary/10 shadow-md scale-[0.98] hover:bg-primary/10"
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
                        Stok: {formatDisplayQty(variant.stock)} {variant.unit}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Min: {formatDisplayQty(variant.minOrder)}{" "}
                        {variant.quantityType === "continuous" &&
                          `· step ${formatDisplayQty(variant.step)}`}
                      </p>

                      {inCart && (
                        <p className="text-xs font-medium text-primary">
                          + {formatDisplayQty(inCart.quantity)} {inCart.unit} di
                          keranjang
                        </p>
                      )}
                    </div>
                  </Button>
                );
              }),
            )}
          </div>
        </ScrollArea>
      </div>

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
                {cart.length} produk
              </span>
            )}
          </div>
        </div>

        <Separator />

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

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeItem(item.variantId)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          onClick={() => updateQty(item.variantId, -item.step)}
                          disabled={item.quantity <= item.minOrder}
                          className="size-7"
                        >
                          <Minus className="size-3" />
                        </Button>

                        <input
                          type="number"
                          min={item.minOrder}
                          max={item.stock}
                          step={
                            item.quantityType === "continuous" ? item.step : 1
                          }
                          value={formatDisplayQty(item.quantity)}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) setQty(item.variantId, val);
                          }}
                          className="w-20 h-7 text-center text-sm font-medium tabular-nums border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        />

                        <span className="text-xs text-muted-foreground">
                          {item.unit}
                        </span>

                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          onClick={() => updateQty(item.variantId, item.step)}
                          disabled={item.quantity >= item.stock}
                          className="size-7"
                        >
                          <Plus className="size-3" />
                        </Button>
                      </div>

                      <span className="text-sm font-semibold tabular-nums">
                        {formatRupiah(Math.round(item.price * item.quantity))}
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Nominal Bayar</label>

            <CurrencyInput
              value={payment}
              onValueChange={(value) => {
                setPayment(Number(value) || 0);
                setResult(null);
              }}
              placeholder="Masukkan nominal..."
              decimalsLimit={0}
              groupSeparator="."
              decimalSeparator=","
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-right text-lg font-semibold tabular-nums ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
};
