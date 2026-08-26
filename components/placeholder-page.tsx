"use client";

import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";

export default function PlaceholderPage({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <AppShell title={title} showSearch={false}>
      <div className="flex flex-1 items-center justify-center p-page">
        <div className="max-w-md rounded-lg border border-border bg-surface p-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-low text-gold">
            <Icon name={icon} size={24} />
          </div>
          <h2 className="mb-2 text-h2 text-on-surface">{title}</h2>
          <p className="text-body text-secondary">{description}</p>
        </div>
      </div>
    </AppShell>
  );
}
