import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ACCESS, requirePageSession } from "@/lib/auth";
import { getStockHistory } from "@/server/queries/product";
import { formatDisplayQty } from "@/lib/stock";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  params: Promise<{ id: string }>;
}

const TYPE_LABEL: Record<string, { label: string; className: string }> = {
  INITIAL: { label: "Stok awal", className: "bg-blue-100 text-blue-700" },
  SALE: { label: "Penjualan", className: "bg-orange-100 text-orange-700" },
  ADJUSTMENT: { label: "Penyesuaian", className: "bg-secondary text-secondary-foreground" },
};

const formatSigned = (n: number) => (n > 0 ? `+${formatDisplayQty(n)}` : formatDisplayQty(n));

export default async function StockHistoryPage({ params }: Props) {
  const session = await requirePageSession(ACCESS.products);
  const { id } = await params;

  const history = await getStockHistory(session.storeId, id);
  if (!history) notFound();
  const { product, movements } = history;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Riwayat Stok</h1>
          <p className="text-sm text-muted-foreground">
            {product.name}
            {product.deletedAt && " (produk sudah dihapus)"}
          </p>
        </div>
      </div>

      {product.variants.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {product.variants.map((v) => (
            <Card key={v.id}>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">{v.name}</p>
                <p className="text-lg font-semibold">
                  {formatDisplayQty(v.stock)}{" "}
                  <span className="text-xs text-muted-foreground">{v.unit}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Pergerakan stok{movements.length >= 200 && " (200 terakhir)"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Varian</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead className="text-right">Perubahan</TableHead>
                <TableHead className="text-right">Stok akhir</TableHead>
                <TableHead>Oleh</TableHead>
                <TableHead>Keterangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Belum ada pergerakan stok.
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((m) => {
                  const type = TYPE_LABEL[m.type] ?? { label: m.type, className: "" };
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {m.createdAt.toLocaleString("id-ID", {
                          timeZone: "Asia/Jakarta",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-sm">{m.variant.name}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${type.className}`}
                        >
                          {type.label}
                        </span>
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm font-medium ${
                          m.quantity < 0 ? "text-destructive" : "text-green-600"
                        }`}
                      >
                        {formatSigned(m.quantity)} {m.variant.unit}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatDisplayQty(m.stockAfter)} {m.variant.unit}
                      </TableCell>
                      <TableCell className="text-sm">{m.user?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {m.transaction ? (
                          <Link
                            href={`/dashboard/transactions/${m.transaction.id}`}
                            className="font-mono underline-offset-2 hover:underline"
                          >
                            {m.transaction.invoiceNo}
                          </Link>
                        ) : (
                          (m.note ?? "—")
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
