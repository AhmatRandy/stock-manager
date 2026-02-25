# Data Table Component

Global reusable table component dengan fitur lengkap untuk menampilkan data dalam bentuk tabel.

## Fitur

- ✅ **Sorting**: Kolom bisa di-sort ascending/descending
- ✅ **Pagination**: Navigasi halaman dengan kontrol baris per halaman
- ✅ **Searching**: Filter data berdasarkan kolom tertentu
- ✅ **Column Visibility**: Toggle tampilkan/sembunyikan kolom
- ✅ **Row Selection**: Pilih satu atau banyak baris
- ✅ **Responsive**: Responsive design untuk mobile dan desktop

## Cara Menggunakan

### 1. Import Components

```tsx
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
```

### 2. Define Column Definitions

```tsx
const columns: ColumnDef<YourDataType>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama" />
    ),
    cell: ({ row }) => <div>{row.getValue("name")}</div>,
  },
  {
    accessorKey: "price",
    header: "Harga",
    cell: ({ row }) => formatCurrency(row.getValue("price")),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      // Row actions dropdown
      return <RowActionsMenu row={row} />;
    },
  },
];
```

### 3. Gunakan DataTable Component

```tsx
<DataTable
  columns={columns}
  data={yourData}
  searchKey="name" // Kolom yang digunakan untuk search
  searchPlaceholder="Cari nama..."
/>
```

## Props

### DataTable Props

| Prop                | Type                         | Required | Description                    |
| ------------------- | ---------------------------- | -------- | ------------------------------ |
| `columns`           | `ColumnDef<TData, TValue>[]` | ✅       | Definisi kolom tabel           |
| `data`              | `TData[]`                    | ✅       | Data yang akan ditampilkan     |
| `searchKey`         | `string`                     | ❌       | Key kolom untuk fitur search   |
| `searchPlaceholder` | `string`                     | ❌       | Placeholder untuk input search |
| `filterableColumns` | `array`                      | ❌       | Kolom yang bisa difilter       |

### DataTableColumnHeader Props

| Prop     | Type                    | Required | Description                      |
| -------- | ----------------------- | -------- | -------------------------------- |
| `column` | `Column<TData, TValue>` | ✅       | Column instance dari react-table |
| `title`  | `string`                | ✅       | Judul kolom yang ditampilkan     |

## Contoh Lengkap

Lihat implementasi di:

- `/app/dashboard/products/_components/product-list.tsx`

## Dependencies

- `@tanstack/react-table`: Table logic
- `@radix-ui/react-icons`: Icons
- ShadcN UI components: table, select, dropdown-menu, button, input
