"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
import { useConfirm } from "@/components/confirm-dialog";
import { LocationSelect } from "@/components/location-select";
import { PageLoading } from "@/components/notice";
import { useToast } from "@/components/toast";
import { api, errorMessage } from "@/lib/api";
import { LOCATION_TYPE_LABEL, ROLE_LABEL } from "@/lib/labels";
import type { Location, StaffUser, Supplier, UserRole } from "@/lib/types";

const inputClass = "rounded border border-border bg-surface-lowest px-3 py-2 text-body text-on-surface";

export function SettingsScreen() {
  const [tab, setTab] = useState<"users" | "suppliers" | "locations">("users");

  return (
    <AppShell title="Настройки" showSearch={false}>
      <div className="p-page space-y-6">
        <div className="flex flex-wrap gap-2">
          <TabButton active={tab === "users"} onClick={() => setTab("users")}>Сотрудники</TabButton>
          <TabButton active={tab === "locations"} onClick={() => setTab("locations")}>Точки</TabButton>
          <TabButton active={tab === "suppliers"} onClick={() => setTab("suppliers")}>Поставщики</TabButton>
        </div>
        {tab === "users" ? <UsersPanel /> : null}
        {tab === "locations" ? <LocationsPanel /> : null}
        {tab === "suppliers" ? <SuppliersPanel /> : null}
      </div>
    </AppShell>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded border border-gold bg-surface-low px-4 py-2 label-caps text-on-surface"
          : "rounded border border-border px-4 py-2 label-caps text-secondary hover:border-gold"
      }
    >
      {children}
    </button>
  );
}

function UsersPanel() {
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [nextUsers, nextLocations] = await Promise.all([
        api.users.list(),
        api.locations.list(),
      ]);
      setUsers(nextUsers);
      setLocations(nextLocations);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    try {
      await api.users.create({
        email: String(form.get("email")),
        password: String(form.get("password")),
        firstName: String(form.get("firstName")),
        lastName: String(form.get("lastName")),
        role: String(form.get("role")) as UserRole,
        phone: String(form.get("phone") || "") || undefined,
        locationId: String(form.get("locationId") || "") || undefined,
      });
      formEl.reset();
      toast.success("Сотрудник создан");
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function afterSave(targetId: string, passwordChanged: boolean) {
    if (passwordChanged && targetId === user?.id) {
      toast.success("Пароль изменён. Войдите снова.");
      await logout();
      router.replace("/");
      return;
    }
    await load();
    if (targetId === user?.id) await refreshUser();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onCreate} className="grid gap-3 rounded-lg border border-border bg-surface p-6 md:grid-cols-3">
        <h3 className="text-h2 md:col-span-3">Новый сотрудник</h3>
        <input name="firstName" required placeholder="Имя" className={inputClass} />
        <input name="lastName" required placeholder="Фамилия" className={inputClass} />
        <input name="email" type="email" required placeholder="Электронная почта" className={inputClass} />
        <input name="password" type="password" required minLength={8} placeholder="Пароль, не короче 8 символов" className={inputClass} />
        <input name="phone" placeholder="Телефон" className={inputClass} />
        <select name="role" className={inputClass}>
          {(Object.keys(ROLE_LABEL) as UserRole[]).map((role) => (
            <option key={role} value={role}>{ROLE_LABEL[role]}</option>
          ))}
        </select>
        <LocationSelect
          locations={locations}
          emptyLabel="Точка не назначена"
          className={`${inputClass} md:col-span-2`}
        />
        <button type="submit" className="rounded bg-gold px-4 py-2 label-caps text-on-primary">Создать</button>
      </form>

      {loading ? <PageLoading /> : (
        <div className="space-y-4">
          <h3 className="text-h2">Сотрудники</h3>
          {users.map((item) => (
            <UserCard
              key={`${item.id}-${item.email}-${item.role}-${item.status}-${item.firstName}-${item.lastName}-${item.phone}-${item.locationId}`}
              user={item}
              locations={locations}
              isSelf={item.id === user?.id}
              onSaved={afterSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UserCard({
  user,
  locations,
  isSelf,
  onSaved,
}: {
  user: StaffUser;
  locations: Location[];
  isSelf: boolean;
  onSaved: (id: string, passwordChanged: boolean) => Promise<void>;
}) {
  const confirm = useConfirm();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextPassword = String(form.get("password") || "");
    setBusy(true);
    try {
      await api.users.update(user.id, {
        firstName: String(form.get("firstName")),
        lastName: String(form.get("lastName")),
        email: String(form.get("email")),
        phone: String(form.get("phone") || "") || null,
        role: String(form.get("role")) as UserRole,
        status: String(form.get("status")) as "active" | "blocked",
        locationId: String(form.get("locationId") || "") || null,
      });
      if (nextPassword) {
        await api.users.setPassword(user.id, nextPassword);
        setPassword("");
      }
      toast.success(nextPassword ? "Данные и пароль сохранены" : "Сотрудник сохранён");
      await onSaved(user.id, Boolean(nextPassword));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (isSelf) return;
    const ok = await confirm({
      title: "Удалить сотрудника?",
      description: `${user.firstName} ${user.lastName} (${user.email}) будет удалён. Если есть продажи или смены, удаление не пройдёт — тогда заблокируйте аккаунт.`,
      confirmLabel: "Удалить",
      tone: "danger",
      icon: "person_remove",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api.users.remove(user.id);
      toast.success("Сотрудник удалён");
      await onSaved(user.id, false);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSave} className="grid gap-3 rounded-lg border border-border bg-surface p-6 md:grid-cols-3">
      <div className="md:col-span-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-body">
            {user.firstName} {user.lastName}
            {isSelf ? <span className="ml-2 text-[12px] text-secondary">вы</span> : null}
          </div>
          <div className="text-[12px] text-secondary">
            {ROLE_LABEL[user.role]} · {user.status === "active" ? "активен" : "блок"}
            {user.location?.name ? ` · ${user.location.name}` : ""}
          </div>
        </div>
        {!isSelf ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onDelete()}
            className="rounded border border-danger/40 px-3 py-2 text-[12px] text-danger disabled:opacity-50"
          >
            Удалить
          </button>
        ) : null}
      </div>
      <input name="firstName" required defaultValue={user.firstName} placeholder="Имя" className={inputClass} />
      <input name="lastName" required defaultValue={user.lastName} placeholder="Фамилия" className={inputClass} />
      <input name="email" type="email" required defaultValue={user.email} placeholder="Электронная почта" className={inputClass} />
      <input name="phone" defaultValue={user.phone ?? ""} placeholder="Телефон" className={inputClass} />
      <select name="role" defaultValue={user.role} className={inputClass}>
        {(Object.keys(ROLE_LABEL) as UserRole[]).map((role) => (
          <option key={role} value={role}>{ROLE_LABEL[role]}</option>
        ))}
      </select>
      <select name="status" defaultValue={user.status} className={inputClass}>
        <option value="active">Активен</option>
        <option value="blocked">Заблокирован</option>
      </select>
      <LocationSelect
        defaultValue={user.locationId ?? ""}
        locations={locations}
        emptyLabel="Точка не назначена"
        className={inputClass}
      />
      <input
        name="password"
        type="password"
        minLength={8}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder={isSelf ? "Новый пароль себе, не короче 8 символов" : "Новый пароль, не короче 8 символов"}
        className={inputClass}
      />
      <button type="submit" disabled={busy} className="rounded bg-gold px-4 py-2 label-caps text-on-primary disabled:opacity-50">
        Сохранить
      </button>
    </form>
  );
}

function SuppliersPanel() {
  const toast = useToast();
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setItems(await api.suppliers.list(true));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    try {
      await api.suppliers.create({
        name: String(form.get("name")),
        phone: String(form.get("phone") || "") || undefined,
        email: String(form.get("email") || "") || undefined,
      });
      formEl.reset();
      toast.success("Поставщик создан");
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onCreate} className="grid gap-3 rounded-lg border border-border bg-surface p-6 md:grid-cols-3">
        <h3 className="text-h2 md:col-span-3">Новый поставщик</h3>
        <input name="name" required placeholder="Название" className={inputClass} />
        <input name="phone" placeholder="Телефон" className={inputClass} />
        <input name="email" type="email" placeholder="Электронная почта" className={inputClass} />
        <button type="submit" className="rounded bg-gold px-4 py-2 label-caps text-on-primary">Создать</button>
      </form>
      {loading ? <PageLoading /> : (
        <div className="space-y-4">
          <h3 className="text-h2">Поставщики</h3>
          {items.map((item) => (
            <SupplierCard key={item.id} supplier={item} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function SupplierCard({
  supplier,
  onChanged,
}: {
  supplier: Supplier;
  onChanged: () => Promise<void>;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await api.suppliers.update(supplier.id, {
        name: String(form.get("name")),
        phone: String(form.get("phone") || "") || null,
        email: String(form.get("email") || "") || null,
        isActive: String(form.get("isActive")) === "true",
      });
      toast.success("Поставщик сохранён");
      await onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    const ok = await confirm({
      title: "Удалить поставщика?",
      description: `${supplier.name} будет удалён, если на складе нет его товаров. Если по товарам уже были продажи — сделайте карточку неактивной.`,
      confirmLabel: "Удалить",
      tone: "danger",
      icon: "delete",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api.suppliers.remove(supplier.id);
      toast.success("Поставщик удалён");
      await onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSave} className="grid gap-3 rounded-lg border border-border bg-surface p-6 md:grid-cols-4">
      <div className="md:col-span-4 flex items-center justify-between">
        <div>
          <div className="text-body">{supplier.name}</div>
          <div className="text-[12px] text-secondary">{supplier.isActive ? "активен" : "неактивен"}</div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onDelete()}
          className="rounded border border-danger/40 px-3 py-2 text-[12px] text-danger disabled:opacity-50"
        >
          Удалить
        </button>
      </div>
      <input name="name" required defaultValue={supplier.name} placeholder="Название" className={inputClass} />
      <input name="phone" defaultValue={supplier.phone ?? ""} placeholder="Телефон" className={inputClass} />
      <input name="email" type="email" defaultValue={supplier.email ?? ""} placeholder="Электронная почта" className={inputClass} />
      <select name="isActive" defaultValue={supplier.isActive ? "true" : "false"} className={inputClass}>
        <option value="true">Активен</option>
        <option value="false">Неактивен</option>
      </select>
      <button type="submit" disabled={busy} className="rounded bg-gold px-4 py-2 label-caps text-on-primary disabled:opacity-50 md:col-span-4">
        Сохранить
      </button>
    </form>
  );
}

function LocationsPanel() {
  const { user, patchUser } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setItems(await api.locations.list());
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const parentId = String(form.get("parentId") || "");
    try {
      await api.locations.create({
        name: String(form.get("name")).trim(),
        type: String(form.get("type")) as Location["type"],
        parentId: parentId || undefined,
      });
      formEl.reset();
      toast.success("Точка создана");
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onCreate} className="grid gap-3 rounded-lg border border-border bg-surface p-6 md:grid-cols-3">
        <h3 className="text-h2 md:col-span-3">Новая точка</h3>
        <input name="name" required placeholder="Название, например ТЦ Евразия" className={inputClass} />
        <select name="type" defaultValue="store" className={inputClass}>
          {(Object.entries(LOCATION_TYPE_LABEL) as Array<[Location["type"], string]>).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
        <select name="parentId" defaultValue="" className={inputClass}>
          <option value="">Без родителя</option>
          {items.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name} · {LOCATION_TYPE_LABEL[location.type]}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded bg-gold px-4 py-2 label-caps text-on-primary md:col-span-3">
          Создать
        </button>
      </form>
      {loading ? <PageLoading /> : (
        <div className="space-y-4">
          <h3 className="text-h2">Точки продаж</h3>
          {items.length === 0 ? (
            <p className="text-body text-secondary">Пока нет точек. Создайте салон, чтобы он появился в шапке.</p>
          ) : items.map((item) => (
            <LocationCard
              key={`${item.id}-${item.name}-${item.type}-${item.parentId ?? ""}`}
              location={item}
              locations={items}
              isAssigned={user?.locationId === item.id}
              onChanged={load}
              onSaved={(updated) => {
                if (user?.locationId === updated.id) {
                  patchUser({ locationId: updated.id, location: updated });
                }
              }}
              onAssignedRemoved={() => {
                if (user?.locationId === item.id) {
                  patchUser({ locationId: null, location: null });
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LocationCard({
  location,
  locations,
  isAssigned,
  onChanged,
  onSaved,
  onAssignedRemoved,
}: {
  location: Location;
  locations: Location[];
  isAssigned: boolean;
  onChanged: () => Promise<void>;
  onSaved: (location: Location) => void;
  onAssignedRemoved: () => void;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const parents = locations.filter((item) => item.id !== location.id);

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const updated = await api.locations.update(location.id, {
        name: String(form.get("name")).trim(),
        type: String(form.get("type")) as Location["type"],
        parentId: String(form.get("parentId") || "") || null,
      });
      toast.success("Точка сохранена");
      await onChanged();
      onSaved(updated);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    const ok = await confirm({
      title: "Удалить точку?",
      description: isAssigned
        ? `«${location.name}» назначена вам. Удалить можно только пустую точку без сотрудников и продаж.`
        : `«${location.name}» будет удалена, если к ней не привязаны сотрудники, товары или продажи.`,
      confirmLabel: "Удалить",
      tone: "danger",
      icon: "delete",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api.locations.remove(location.id);
      toast.success("Точка удалена");
      onAssignedRemoved();
      await onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSave} className="grid gap-3 rounded-lg border border-border bg-surface p-6 md:grid-cols-3">
      <div className="md:col-span-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-body">{location.name}</div>
          <div className="text-[12px] text-secondary">
            {LOCATION_TYPE_LABEL[location.type]}
            {isAssigned ? " · ваша точка" : ""}
          </div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onDelete()}
          className="rounded border border-danger/40 px-3 py-2 text-[12px] text-danger disabled:opacity-50"
        >
          Удалить
        </button>
      </div>
      <input name="name" required defaultValue={location.name} placeholder="Название" className={inputClass} />
      <select name="type" defaultValue={location.type} className={inputClass}>
        {(Object.entries(LOCATION_TYPE_LABEL) as Array<[Location["type"], string]>).map(([id, label]) => (
          <option key={id} value={id}>{label}</option>
        ))}
      </select>
      <select name="parentId" defaultValue={location.parentId ?? ""} className={inputClass}>
        <option value="">Без родителя</option>
        {parents.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} · {LOCATION_TYPE_LABEL[item.type]}
          </option>
        ))}
      </select>
      <button type="submit" disabled={busy} className="rounded bg-gold px-4 py-2 label-caps text-on-primary disabled:opacity-50 md:col-span-3">
        Сохранить
      </button>
    </form>
  );
}
