import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Store, User, Clock } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getTransactionById } from "../_actions/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRupiah } from "@/lib/format";
import { fromScaled, formatDisplayQty } from "@/lib/stock";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TransactionDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const transaction = await getTransactionById(id);

  if (!transaction) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/transactions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-mono">
            {transaction.invoiceNo}
          </h1>
          <p className="text-sm text-muted-foreground">Detail Transaksi</p>
        </div>
      </div>

      {/* Meta Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 flex items-start gap-3">
            <Store className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Toko</p>
              <p className="font-medium text-sm">{transaction.store.name}</p>
              {transaction.store.address && (
                <p className="text-xs text-muted-foreground">
                  {transaction.store.address}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 flex items-start gap-3">
            <User className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Kasir</p>
              <p className="font-medium text-sm">{transaction.user.name}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Waktu</p>
              <p className="font-medium text-sm">
                {new Date(transaction.createdAt).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Item yang Dibeli</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Varian</TableHead>
                <TableHead className="text-right">Harga Satuan</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transaction.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.productName}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.variantName}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatRupiah(item.price)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatDisplayQty(fromScaled(item.quantity))}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatRupiah(item.subtotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ringkasan Pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatRupiah(transaction.total)}</span>
          </div>

          {transaction.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Diskon</span>
              <span className="text-destructive">
                -{formatRupiah(transaction.discount)}
              </span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between font-semibold">
            <span>Grand Total</span>
            <span>{formatRupiah(transaction.grandTotal)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Bayar</span>
            <span>{formatRupiah(transaction.payment)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Kembalian</span>
            <span className="font-medium">
              {formatRupiah(transaction.change)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
