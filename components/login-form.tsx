"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Icon } from "@/components/icon";
import { Notice } from "@/components/notice";
import { api, errorMessage } from "@/lib/api";
import { homePath } from "@/lib/roles";

type Step = "credentials" | "forgot" | "reset";

export function LoginForm() {
  const router = useRouter();
  const { applySession } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function finish(tokens: { accessToken: string; refreshToken: string; expiresIn: number }) {
    const me = await applySession(tokens);
    router.replace(homePath(me.role));
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const result = await api.auth.login(email, password);
      if (result.status !== "ok") {
        setError("Двухфакторная защита сейчас выключена. Обратитесь к администратору.");
        return;
      }
      await finish(result);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await api.auth.forgotPassword(email);
      setNotice("Если такой email есть в системе, код сброса отправлен.");
      if (result.devToken) {
        setResetToken(result.devToken);
        setStep("reset");
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.auth.resetPassword(resetToken, newPassword);
      setNotice("Пароль обновлён. Войдите с новым паролем.");
      setPassword(newPassword);
      setStep("credentials");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (step === "forgot") {
    return (
      <form className="space-y-6" onSubmit={handleForgot}>
        {error ? <Notice onClose={() => setError(null)}>{error}</Notice> : null}
        {notice ? (
          <Notice kind="ok" onClose={() => setNotice(null)}>
            {notice}
          </Notice>
        ) : null}
        <div>
          <label className="label-caps mb-1 block text-secondary" htmlFor="email">
            Электронная почта
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded border border-border bg-transparent px-4 py-2 text-body text-on-surface transition-colors focus:border-gold"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="group flex w-full items-center justify-center gap-2 rounded bg-gold py-4 text-on-primary transition-colors hover:bg-surface-tint disabled:opacity-50"
        >
          <span className="label-caps">{busy ? "Отправка…" : "Отправить код"}</span>
        </button>
        <button
          type="button"
          className="w-full label-caps text-secondary hover:text-gold"
          onClick={() => setStep("credentials")}
        >
          Назад ко входу
        </button>
      </form>
    );
  }

  if (step === "reset") {
    return (
      <form className="space-y-6" onSubmit={handleReset}>
        {error ? <Notice onClose={() => setError(null)}>{error}</Notice> : null}
        {notice ? (
          <Notice kind="ok" onClose={() => setNotice(null)}>
            {notice}
          </Notice>
        ) : null}
        <div>
          <label className="label-caps mb-1 block text-secondary" htmlFor="token">
            Токен сброса
          </label>
          <input
            id="token"
            required
            value={resetToken}
            onChange={(event) => setResetToken(event.target.value)}
            className="w-full rounded border border-border bg-transparent px-4 py-2 text-body"
          />
        </div>
        <div>
          <label className="label-caps mb-1 block text-secondary" htmlFor="new-password">
            Новый пароль
          </label>
          <input
            id="new-password"
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full rounded border border-border bg-transparent px-4 py-2 text-body"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center rounded bg-gold py-4 label-caps text-on-primary disabled:opacity-50"
        >
          Сохранить пароль
        </button>
      </form>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleLogin}>
      {error ? <Notice onClose={() => setError(null)}>{error}</Notice> : null}
      {notice ? (
        <Notice kind="ok" onClose={() => setNotice(null)}>
          {notice}
        </Notice>
      ) : null}

      <div>
        <label className="label-caps mb-1 block text-secondary" htmlFor="email">
          Электронная почта
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded border border-border bg-transparent px-4 py-2 text-body text-on-surface transition-colors focus:border-gold"
        />
      </div>
      <div>
        <label className="label-caps mb-1 block text-secondary" htmlFor="password">
          Пароль
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded border border-border bg-transparent px-4 py-2 pr-10 text-body text-on-surface transition-colors focus:border-gold"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-secondary transition-colors hover:text-gold"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
          >
            <Icon name={showPassword ? "visibility" : "visibility_off"} size={20} />
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="group mt-8 flex w-full items-center justify-center gap-2 rounded bg-gold py-4 text-on-primary transition-colors hover:bg-surface-tint disabled:opacity-50"
      >
        <span className="label-caps">{busy ? "Вход…" : "Войти в систему"}</span>
        <Icon
          name="arrow_forward"
          size={18}
          className="transition-transform duration-200 group-hover:translate-x-1"
        />
      </button>

      <button
        type="button"
        className="w-full label-caps text-secondary underline-offset-4 hover:text-gold hover:underline"
        onClick={() => {
          setError(null);
          setNotice(null);
          setStep("forgot");
        }}
      >
        Забыли пароль?
      </button>
    </form>
  );
}
