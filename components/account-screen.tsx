"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
import { useConfirm } from "@/components/confirm-dialog";
import { LocationSelect } from "@/components/location-select";
import { Notice, PageLoading } from "@/components/notice";
import { useToast } from "@/components/toast";
import { api, errorMessage } from "@/lib/api";
import { deviceLabel, formatDateTime } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/labels";
import type { AuthHistoryEvent, Location } from "@/lib/types";

const fieldClass = "w-full rounded border border-border bg-surface-lowest px-3 py-2 text-body";

export function AccountScreen() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState(user?.locationId ?? "");
  const [newLocationName, setNewLocationName] = useState("");
  const [events, setEvents] = useState<AuthHistoryEvent[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    void api.locations.list().then(setLocations).catch(() => setLocations([]));
  }, [isAdmin]);

  useEffect(() => {
    setLocationId(user?.locationId ?? "");
  }, [user?.locationId]);

  useEffect(() => {
    let cancelled = false;
    setHistoryLoading(true);
    void api.auth.history()
      .then((rows) => {
        if (!cancelled) setEvents(rows);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) return null;
  const account = user;

  async function onChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const repeat = String(form.get("confirm") || "");
    if (password !== repeat) {
      setError("Пароли не совпадают");
      toast.error("Пароли не совпадают");
      return;
    }
    const ok = await confirm({
      title: "Сменить пароль?",
      description: "Все сессии будут завершены. Нужно будет войти с новым паролем.",
      confirmLabel: "Сменить",
      tone: "gold",
      icon: "lock_reset",
    });
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await api.auth.changePassword(password);
      event.currentTarget.reset();
      toast.success("Пароль изменён. Войдите снова.");
      await logout();
      router.replace("/");
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      toast.error(message);
      setBusy(false);
    }
  }

  async function onSaveLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.users.update(account.id, { locationId: locationId || null });
      await refreshUser();
      toast.success("Точка сохранена");
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function onCreateLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newLocationName.trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    try {
      const created = await api.locations.create({ name, type: "store" });
      await api.users.update(account.id, { locationId: created.id });
      setLocations((current) =>
        [...current, created].sort((a, b) => a.name.localeCompare(b.name, "ru")),
      );
      setNewLocationName("");
      await refreshUser();
      toast.success(`Точка «${created.name}» назначена`);
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Аккаунт" showSearch={false}>
      <div className="p-page space-y-6">
        {error ? <Notice onClose={() => setError(null)}>{error}</Notice> : null}

        <div className="max-w-xl rounded-lg border border-border bg-surface p-8">
          <h2 className="mb-6 text-h2">Профиль</h2>
          <dl className="space-y-4 text-body">
            <Row label="Имя" value={`${user.firstName} ${user.lastName}`.trim()} />
            <Row label="Электронная почта" value={user.email} />
            <Row label="Роль" value={ROLE_LABEL[user.role]} />
            {!isAdmin ? (
              <Row label="Точка" value={user.location?.name ?? "Не указана"} />
            ) : null}
          </dl>
        </div>

        {isAdmin ? (
          <div className="max-w-xl space-y-6 rounded-lg border border-border bg-surface p-8">
            <div>
              <h2 className="text-h2">Точка продаж</h2>
              <p className="mt-1 text-[12px] text-secondary">
                Название, например «ТЦ Евразия», будет видно в шапке.
              </p>
            </div>
            <form onSubmit={onSaveLocation} className="space-y-3">
              <LocationSelect
                value={locationId}
                onChange={setLocationId}
                locations={locations}
                emptyLabel="Не выбрана"
                className={fieldClass}
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded bg-gold px-4 py-2 label-caps text-on-primary disabled:opacity-50"
              >
                Сохранить точку
              </button>
            </form>
            <form onSubmit={onCreateLocation} className="space-y-3 border-t border-border pt-6">
              <p className="label-caps text-secondary">Новая точка</p>
              <input
                value={newLocationName}
                onChange={(event) => setNewLocationName(event.target.value)}
                placeholder="ТЦ Евразия"
                className={fieldClass}
              />
              <button
                type="submit"
                disabled={busy || !newLocationName.trim()}
                className="rounded border border-border px-4 py-2 label-caps text-on-surface hover:border-gold disabled:opacity-50"
              >
                Создать и назначить
              </button>
            </form>
          </div>
        ) : null}

        <form
          onSubmit={onChangePassword}
          className="max-w-xl space-y-3 rounded-lg border border-border bg-surface p-8"
        >
          <h2 className="text-h2">Сменить пароль</h2>
          <p className="text-[12px] text-secondary">После смены нужно войти заново.</p>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Новый пароль, не короче 8 символов"
            className={fieldClass}
          />
          <input
            name="confirm"
            type="password"
            required
            minLength={8}
            placeholder="Повторите пароль"
            className={fieldClass}
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-gold px-4 py-2 label-caps text-on-primary disabled:opacity-50"
          >
            Сохранить пароль
          </button>
        </form>

        <div className="max-w-xl overflow-hidden rounded-lg border border-border bg-surface">
          <div className="border-b border-border px-8 py-6">
            <h2 className="text-h2">История входов</h2>
            <p className="mt-1 text-[12px] text-secondary">Входы и выходы из этого аккаунта</p>
          </div>
          {historyLoading ? (
            <PageLoading />
          ) : events.length === 0 ? (
            <p className="px-8 py-8 text-body text-secondary">Пока нет записей. Они появятся после следующего входа.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-surface-lowest">
                    <th className="px-8 py-3 font-medium label-caps text-secondary">Когда</th>
                    <th className="px-6 py-3 font-medium label-caps text-secondary">Событие</th>
                    <th className="px-6 py-3 font-medium label-caps text-secondary">Устройство</th>
                    <th className="px-8 py-3 font-medium label-caps text-secondary">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-b border-border last:border-0">
                      <td className="px-8 py-3 text-table tabular">{formatDateTime(event.createdAt)}</td>
                      <td className="px-6 py-3 text-body">
                        {event.action === "logout" ? "Выход" : "Вход"}
                      </td>
                      <td className="px-6 py-3 text-body text-secondary">
                        {deviceLabel(event.payload?.userAgent)}
                      </td>
                      <td className="px-8 py-3 text-table tabular text-secondary">
                        {event.payload?.ip || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-3">
      <dt className="label-caps text-secondary">{label}</dt>
      <dd className="text-on-surface">{value}</dd>
    </div>
  );
}
