export type TransactionRow = {
  id: string;
  invoiceNo: string;
  total: number;
  discount: number;
  grandTotal: number;
  payment: number;
  change: number;
  createdAt: Date;
  user: { name: string };
  _count: { items: number };
};

export type TransactionDetail = {
  id: string;
  invoiceNo: string;
  total: number;
  discount: number;
  grandTotal: number;
  payment: number;
  change: number;
  createdAt: Date;
  user: { name: string };
  store: { name: string; address: string | null; phone: string | null };
  items: {
    id: string;
    productName: string;
    variantName: string;
    price: number;
    quantity: number;
    subtotal: number;
  }[];
};
