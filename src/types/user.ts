export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MANAGER" | "CASHIER";
  createdAt: Date;
};

export type ActionResult = {
  success: boolean;
  message?: string;
};
