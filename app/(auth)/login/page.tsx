"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: LoginState = {
  success: false,
};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Masuk ke Akun</CardTitle>
          <p className="text-sm text-muted-foreground">
            Masukkan email dan password Anda
          </p>
        </CardHeader>

        <CardContent>
          <form action={formAction} className="space-y-4">
            {/* Pesan error global */}
            {state.message && (
              <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                {state.message}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nama@contoh.com"
                autoComplete="email"
                disabled={isPending}
                className={state.errors?.email ? "border-destructive" : ""}
              />
              {state.errors?.email?.map((err) => (
                <p key={err} className="text-xs text-destructive">
                  {err}
                </p>
              ))}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isPending}
                className={state.errors?.password ? "border-destructive" : ""}
              />
              {state.errors?.password?.map((err) => (
                <p key={err} className="text-xs text-destructive">
                  {err}
                </p>
              ))}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className={`w-full ${isPending ? "animate-spin" : ""}`}
              disabled={isPending}
            >
              {isPending ? "Loading..." : "Masuk"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
