export type CategoryWithCount = {
  id: string;
  name: string;
  createdAt: Date;
  _count: { products: number };
};

export type CategoryOption = {
  id: string;
  name: string;
};

export type ActionResult = {
  success: boolean;
  message?: string;
};
