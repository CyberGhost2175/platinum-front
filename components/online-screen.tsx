"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Notice, PageLoading } from "@/components/notice";
import { api, errorMessage } from "@/lib/api";
import { formatDateTime, formatKopecks } from "@/lib/format";
import { ORDER_STATUS_LABEL } from "@/lib/labels";
import type { Order } from "@/lib/types";

export function OnlineScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.orders
      .list()
      .then(setOrders)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell title="Онлайн" showSearch={false}>
      <div className="p-page">
        {error ? <Notice>{error}</Notice> : null}
        {loading ? <PageLoading /> : (
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-surface-low">
                  <th className="px-6 py-3 label-caps text-secondary">Дата</th>
                  <th className="px-6 py-3 label-caps text-secondary">Клиент</th>
                  <th className="px-6 py-3 label-caps text-secondary">Статус</th>
                  <th className="px-6 py-3 text-right label-caps text-secondary">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-body text-secondary">
                      Онлайн-заказов пока нет
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="border-b border-border hover:bg-surface-lowest">
                      <td className="px-6 py-3 text-body text-secondary">{formatDateTime(order.createdAt)}</td>
                      <td className="px-6 py-3 text-body">{order.customer?.fullName ?? order.customerId}</td>
                      <td className="px-6 py-3 text-body">{ORDER_STATUS_LABEL[order.status]}</td>
                      <td className="px-6 py-3 text-right text-table tabular">{formatKopecks(order.totalAmount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
