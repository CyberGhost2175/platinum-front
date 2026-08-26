"use client";

import { AuthProvider } from "./auth-provider";
import { ConfirmProvider } from "./confirm-dialog";
import { ThemeProvider } from "./theme-provider";
import { ToastProvider } from "./toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>{children}</AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
