export type StoreData = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  currency: string;
  taxPercent: number;
  receiptHeader: string | null;
  receiptFooter: string | null;
};

export type ActionResult = {
  success: boolean;
  message?: string;
};
