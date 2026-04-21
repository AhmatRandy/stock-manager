import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package, AlertTriangle, ShoppingCart } from "lucide-react";
import { DateRangeFilter } from "@/components/ui/datepicker-with-range";

interface Props {
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const session = await getSession();
  console.log("Session di DashboardPage:", session);
  if (!session) redirect("/login");

  const { from, to } = await searchParams;

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const defaultFrom = new Date();
  defaultFrom.setHours(0, 0, 0, 0);

  const fromDate = from ? new Date(from + "T00:00:00") : defaultFrom;
  const toDate = to ? new Date(to + "T23:59:59") : today;

  // ===== 7 DAYS CHART =====
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    totalSales,
    totalTransactions,
    totalItems,
    lowStockVariants,
    topVariants,
    last7DaysTransactions,
  ] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { grandTotal: true },
      where: {
        storeId: session.storeId,
        createdAt: { gte: fromDate, lte: toDate },
      },
    }),

    prisma.transaction.count({
      where: {
        storeId: session.storeId,
        createdAt: { gte: fromDate, lte: toDate },
      },
    }),

    prisma.transactionItem.aggregate({
      _sum: { quantity: true },
      where: {
        transaction: {
          storeId: session.storeId,
          createdAt: { gte: fromDate, lte: toDate },
        },
      },
    }),

    prisma.productVariant.findMany({
      where: {
        product: { storeId: session.storeId },
        stock: { lte: 5 },
      },
      include: { product: true },
      take: 5,
      orderBy: { stock: "asc" },
    }),

    prisma.transactionItem.groupBy({
      by: ["variantId", "productName", "variantName"],
      _sum: { quantity: true },
      where: {
        transaction: {
          storeId: session.storeId,
          createdAt: { gte: fromDate, lte: toDate },
        },
      },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),

    // Aggregate daily totals in the database to reduce payload
    prisma.$queryRaw`
      SELECT date_trunc('day', "createdAt")::date AS day, SUM("grandTotal") AS total
      FROM "Transaction"
      WHERE "storeId" = ${session.storeId} AND "createdAt" >= ${sevenDaysAgo} AND "createdAt" <= ${toDate}
      GROUP BY day
      ORDER BY day ASC
    `,
  ]);

  const totalRevenue = totalSales._sum.grandTotal ?? 0;
  const totalQty = totalItems._sum.quantity ?? 0;

  // last7DaysTransactions is an array of { day: Date|string, total: string|number }
  const aggMap = new Map<string, number>();
  (last7DaysTransactions as Array<any>).forEach((r) => {
    const d = new Date(r.day).toDateString();
    aggMap.set(d, Number(r.total ?? 0));
  });

  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(sevenDaysAgo);
    date.setDate(date.getDate() + i);
    const dailyTotal = aggMap.get(date.toDateString()) ?? 0;

    return {
      label: date.toLocaleDateString("id-ID", { weekday: "short" }),
      date: date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      }),
      total: dailyTotal,
    };
  });

  const maxChartValue = Math.max(...chartData.map((d) => d.total), 1);

  const filterLabel = `${fromDate.toLocaleDateString("id-ID")} – ${toDate.toLocaleDateString("id-ID")}`;

  const defaultFromStr = from ?? defaultFrom.toISOString().split("T")[0];
  const defaultToStr = to ?? today.toISOString().split("T")[0];

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

      <DateRangeFilter defaultFrom={defaultFromStr} defaultTo={defaultToStr} />

      <div>
        <p className="text-sm text-muted-foreground mb-3">
          Periode: <span className="font-medium">{filterLabel}</span>
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm">Penjualan</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {totalRevenue.toLocaleString("id-ID")}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm">Transaksi</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTransactions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm">Item Terjual</CardTitle>
              <Package className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQty}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm">Stok Hampir Habis</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {lowStockVariants.length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===== 7 DAY CHART ===== */}
      <Card>
        <CardHeader>
          <CardTitle>Tren Penjualan 7 Hari Terakhir</CardTitle>
          <p className="text-sm text-muted-foreground">
            Data selalu menampilkan 7 hari terakhir secara otomatis
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 h-40">
            {chartData.map((d) => (
              <div key={d.label} className="flex flex-col items-center flex-1">
                <span className="text-xs text-muted-foreground mb-1">
                  {d.total > 0 ? `Rp ${(d.total / 1000).toFixed(0)}k` : ""}
                </span>
                <div
                  className="bg-primary w-full rounded min-h-[4px]"
                  style={{
                    height: `${(d.total / maxChartValue) * 100}%`,
                  }}
                />
                <span className="text-xs mt-2 font-medium">{d.label}</span>
                <span className="text-xs text-muted-foreground">{d.date}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {topVariants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Produk Terlaris</CardTitle>
            <p className="text-sm text-muted-foreground">
              Periode: {filterLabel}
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {topVariants.map((v) => (
                <li key={v.variantId} className="flex justify-between text-sm">
                  <span>
                    {v.productName} - {v.variantName}
                  </span>
                  <span className="font-medium">{v._sum.quantity} pcs</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ===== STOK HAMPIR HABIS ===== */}
      {lowStockVariants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600">
              ⚠ Stok Hampir Habis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {lowStockVariants.map((v) => (
                <li key={v.id} className="flex justify-between text-sm">
                  <span>
                    {v.product.name} - {v.name}
                  </span>
                  <span className="font-medium text-red-500">
                    {v.stock} tersisa
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
