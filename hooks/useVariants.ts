"use client";

import { useCallback, useState } from "react";
import type { Variant } from "@/types/product";

export type LocalVariant = Variant & {
  tempId: string;
  quantityType: "discrete" | "continuous";
  step: number;
  minOrder: number;
  name: string;
  unit: string;
  price: number;
  stock: number;
};

const makeTempId = () =>
  typeof crypto !== "undefined" ? crypto.randomUUID() : String(Math.random());

export const DEFAULT_VARIANT: LocalVariant = {
  tempId: makeTempId(),
  id: undefined,
  name: "",
  unit: "pcs",
  price: 0,
  stock: 0,
  quantityType: "discrete",
  step: 1,
  minOrder: 1,
};

export function useVariants(initial?: Variant[] | null) {
  const [variants, setVariants] = useState<LocalVariant[]>(() =>
    initial && initial.length
      ? initial.map((v) => ({
          tempId: makeTempId(),
          id: v.id,
          name: v.name ?? "",
          unit: v.unit ?? "pcs",
          price: v.price ?? 0,
          stock: v.stock ?? 0,
          quantityType: v.quantityType ?? "discrete",
          step: v.step ?? 1,
          minOrder: v.minOrder ?? 1,
        }))
      : [DEFAULT_VARIANT],
  );

  const addVariant = useCallback(() => {
    setVariants((prev) => [
      ...prev,
      {
        tempId: makeTempId(),
        id: undefined,
        name: "",
        unit: "pcs",
        price: 0,
        stock: 0,
        quantityType: "discrete",
        step: 1,
        minOrder: 1,
      },
    ]);
  }, []);

  const removeVariant = useCallback((index: number) => {
    setVariants((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
    );
  }, []);

  const updateVariant = useCallback(
    (index: number, patch: Partial<LocalVariant>) => {
      setVariants((prev) =>
        prev.map((v, i) => (i === index ? { ...v, ...patch } : v)),
      );
    },
    [],
  );

  const reset = useCallback(() => setVariants([DEFAULT_VARIANT]), []);

  const initFrom = useCallback((items?: Variant[] | null) => {
    if (items && items.length)
      setVariants(
        items.map((v) => ({
          tempId: makeTempId(),
          id: v.id,
          name: v.name ?? "",
          unit: v.unit ?? "pcs",
          price: v.price ?? 0,
          stock: v.stock ?? 0,
          quantityType: v.quantityType ?? "discrete",
          step: v.step ?? 1,
          minOrder: v.minOrder ?? 1,
        })),
      );
    else setVariants([DEFAULT_VARIANT]);
  }, []);

  return {
    variants,
    setVariants,
    addVariant,
    removeVariant,
    updateVariant,
    reset,
    initFrom,
  } as const;
}
