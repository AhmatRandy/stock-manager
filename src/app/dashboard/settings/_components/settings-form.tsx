"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { updateStoreSettings } from "../_actions/actions";
import type { StoreData } from "@/types/store";
import type { ActionResult } from "@/types/store";

const CURRENCIES = [
  { value: "IDR", label: "IDR — Rupiah" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
  { value: "MYR", label: "MYR — Malaysian Ringgit" },
];

interface Props {
  store: StoreData;
}

export function SettingsForm({ store }: Props) {
  const [currency, setCurrency] = useState(store.currency ?? "IDR");
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(updateStoreSettings, null);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Pengaturan Toko</h1>
        <p className="text-sm text-muted-foreground">
          Kelola informasi dan preferensi toko Anda
        </p>
      </div>

      <form action={formAction} className="space-y-8">
        {/* ── Identitas Toko ─────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold border-b pb-2">
            Identitas Toko
          </h2>

          <div className="space-y-2">
            <Label htmlFor="name">Nama Toko</Label>
            <Input
              id="name"
              name="name"
              defaultValue={store.name}
              placeholder="contoh: Warung Bu Sari"
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Textarea
              id="address"
              name="address"
              defaultValue={store.address ?? ""}
              placeholder="Jl. Contoh No. 1, Kelurahan, Kecamatan, Kota"
              disabled={isPending}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Nomor Telepon</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={store.phone ?? ""}
              placeholder="08xxxxxxxxxx"
              disabled={isPending}
            />
          </div>
        </section>

        {/* ── Preferensi POS ─────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold border-b pb-2">
            Preferensi POS
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Mata Uang</Label>
              <Input type="hidden" name="currency" value={currency} />
              <Select
                value={currency}
                onValueChange={setCurrency}
                disabled={isPending}
              >
                <SelectTrigger id="currency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxPercent">Pajak (%)</Label>
              <Input
                id="taxPercent"
                name="taxPercent"
                type="number"
                defaultValue={store.taxPercent}
                min={0}
                max={100}
                placeholder="0"
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                0 berarti tidak ada pajak. Akan ditampilkan di struk.
              </p>
            </div>
          </div>
        </section>

        {/* ── Template Struk ─────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold border-b pb-2">
            Template Struk
          </h2>

          <div className="space-y-2">
            <Label htmlFor="receiptHeader">Header Struk</Label>
            <Textarea
              id="receiptHeader"
              name="receiptHeader"
              defaultValue={store.receiptHeader ?? ""}
              placeholder="contoh: Terima kasih sudah berbelanja!"
              disabled={isPending}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Teks yang muncul di bagian atas struk.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receiptFooter">Footer Struk</Label>
            <Textarea
              id="receiptFooter"
              name="receiptFooter"
              defaultValue={store.receiptFooter ?? ""}
              placeholder="contoh: Barang yang sudah dibeli tidak dapat dikembalikan."
              disabled={isPending}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Teks yang muncul di bagian bawah struk.
            </p>
          </div>
        </section>

        {/* ── Feedback ───────────────────────────────────── */}
        {state && !state.success && state.message && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {state.message}
          </div>
        )}
        {state?.success && state.message && (
          <div className="bg-green-50 text-green-700 text-sm p-3 rounded-md">
            {state.message}
          </div>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
      </form>
    </div>
  );
}
