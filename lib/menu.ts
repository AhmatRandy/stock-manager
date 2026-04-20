import {
  LayoutDashboard,
  Package,
  Tags,
  Users,
  ShoppingCart,
  ClipboardList,
  Settings,
} from "lucide-react";

export const sidebarMenu = [
  {
    group: "Overview",
    items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }],
  },
  {
    group: "Inventori",
    items: [
      { title: "Produk", url: "/dashboard/products", icon: Package }, // model Product
      { title: "Kategori", url: "/dashboard/category", icon: Tags }, // model Category
    ],
  },
  {
    group: "Transaksi",
    items: [
      {
        title: "Kasir (POS)",
        url: "/dashboard/pos",
        icon: ShoppingCart,
      }, // model Transaction & TransactionItem
      {
        title: "Riwayat Transaksi",
        url: "/dashboard/transactions",
        icon: ClipboardList,
      }, // model Transaction
    ],
  },
  {
    group: "Sistem",
    items: [
      { title: "Manajemen User", url: "/dashboard/users", icon: Users }, // model User
      { title: "Pengaturan Toko", url: "/dashboard/settings", icon: Settings }, // model Store
    ],
  },
];
