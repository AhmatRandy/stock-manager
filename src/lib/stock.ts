import { QuantityType } from "@/types/product";

export const SCALE = 100;

export function toScaled(display: number): number {
  return Math.round(display * SCALE);
}

export function fromScaled(scaled: number): number {
  return scaled / SCALE;
}

export function snapQuantity(
  raw: number,
  quantityType: QuantityType,
  step: number,
  minOrder: number,
  stock: number,
): number {
  let snapped: number;

  if (quantityType === "discrete") {
    snapped = Math.round(raw);
  } else {
    const scaledRaw = Math.round(raw * SCALE);
    const scaledStep = Math.round(step * SCALE);
    snapped = (Math.round(scaledRaw / scaledStep) * scaledStep) / SCALE;
  }

  return Math.min(Math.max(snapped, minOrder), stock);
}

export type QuantityValidation =
  | { valid: true }
  | { valid: false; message: string };

export function validateQuantity(
  quantity: number,
  opts: {
    quantityType: QuantityType;
    step: number;
    minOrder: number;
    stock: number;
    unit?: string;
  },
): QuantityValidation {
  const { quantityType, step, minOrder, stock, unit = "" } = opts;

  if (quantity > stock) {
    return {
      valid: false,
      message:
        `Stok tidak mencukupi (tersisa ${formatDisplayQty(stock)} ${unit})`.trim(),
    };
  }

  if (quantity < minOrder) {
    return {
      valid: false,
      message:
        `Minimum pembelian adalah ${formatDisplayQty(minOrder)} ${unit}`.trim(),
    };
  }

  if (quantityType === "discrete") {
    if (!Number.isInteger(quantity)) {
      return { valid: false, message: "Jumlah harus bilangan bulat" };
    }
  } else {
    const scaledQty = toScaled(quantity);
    const scaledStep = toScaled(step);
    if (scaledQty % scaledStep !== 0) {
      return {
        valid: false,
        message: `Jumlah harus kelipatan ${step}`,
      };
    }
  }

  return { valid: true };
}

export function reduceStock(
  currentScaledStock: number,
  purchasedDisplayQty: number,
): number {
  return currentScaledStock - toScaled(purchasedDisplayQty);
}

/** Format a display quantity: max 2 decimal places, no trailing zeros. */
export function formatDisplayQty(n: number): string {
  return parseFloat(n.toFixed(2)).toString();
}
