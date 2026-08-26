"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "./icon";
import { useAuth } from "./auth-provider";
import { useConfirm } from "./confirm-dialog";
import { can, MAIN_NAV, SALE_CREATE_ROLES, USERS_ROLES } from "@/lib/roles";

function NavLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "flex items-center gap-3 px-6 py-3 border-l-2 border-gold bg-surface-low text-on-surface"
          : "flex items-center gap-3 px-6 py-3 border-l-2 border-transparent text-secondary opacity-70 hover:bg-surface-high hover:translate-x-0.5 transition-all duration-200"
      }
    >
      <Icon
        name={icon}
        filled={active}
        size={20}
        className={active ? "text-gold" : ""}
      />
      <span className="label-caps">{label}</span>
    </Link>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const confirm = useConfirm();
  const role = user?.role;
  const nav = MAIN_NAV.filter((item) => can(role, item.roles));

  async function handleLogout() {
    const ok = await confirm({
      title: "Выйти из аккаунта?",
      description: "Сессия будет завершена. Чтобы продолжить работу, войдите снова.",
      confirmLabel: "Выйти",
      tone: "gold",
      icon: "logout",
    });
    if (!ok) return;
    await logout();
    onNavigate?.();
    router.replace("/");
  }

  return (
    <aside className="flex h-full w-sidebar flex-col border-r border-border bg-background py-6">
      <div className="mb-8 flex items-center gap-3 px-6">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold text-on-primary">
          <Icon name="diamond" filled size={16} />
        </div>
        <div>
          <div className="text-h2 font-bold tracking-tight text-primary">
            PLATINUM
          </div>
          <div className="label-caps text-secondary">Ювелирная CRM</div>
        </div>
      </div>

      {can(role, SALE_CREATE_ROLES) ? (
        <div className="mb-8 px-6">
          <Link
            href="/kassa"
            onClick={onNavigate}
            className="flex w-full items-center justify-center gap-2 rounded bg-gold py-3 text-on-primary transition-colors hover:bg-surface-tint"
          >
            <Icon name="add" size={18} />
            <span className="label-caps">Новая продажа</span>
          </Link>
        </div>
      ) : null}

      <nav className="flex-1 space-y-0.5" onClick={onNavigate}>
        {nav.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
          />
        ))}
      </nav>

      <div className="mt-auto space-y-0.5 border-t border-border pt-4">
        {can(role, USERS_ROLES) ? (
          <div onClick={onNavigate}>
            <NavLink
              href="/settings"
              icon="settings"
              label="Настройки"
              active={pathname === "/settings"}
            />
          </div>
        ) : null}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 border-l-2 border-transparent px-6 py-3 text-secondary opacity-70 transition-all duration-200 hover:translate-x-0.5 hover:bg-surface-high"
        >
          <Icon name="logout" size={20} />
          <span className="label-caps">Выход</span>
        </button>
      </div>
    </aside>
  );
}
