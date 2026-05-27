import { useState } from "react";
import { Link } from "react-router-dom";

import { formatCurrency } from "../lib/api";
import type { Order } from "../types/product";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  shipped: "bg-blue-100 text-blue-800",
  cancelled: "bg-slate-200 text-slate-700",
};

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function OrderCard({
  order,
  showCustomer = false,
  defaultExpanded = false,
}: {
  order: Order;
  showCustomer?: boolean;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const statusClass =
    STATUS_STYLES[order.status] ?? "bg-slate-100 text-slate-700";

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full flex-col gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900">
              Order #{order.order_id}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusClass}`}
            >
              {order.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {formatDate(order.created_at)} · {order.items.length} item
            {order.items.length !== 1 ? "s" : ""}
          </p>
          {showCustomer && (
            <p className="mt-1 text-sm text-slate-600">
              {order.customer_name} · {order.customer_email}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-indigo-600">
            {formatCurrency(order.total)}
          </span>
          <span className="text-slate-400">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4">
          <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-100">
            {order.items.map((item) => (
              <li
                key={`${order.order_id}-${item.product_id}`}
                className="flex justify-between px-4 py-2.5 text-sm"
              >
                <span className="text-slate-700">
                  {item.title} × {item.quantity}
                </span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(item.unit_price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="font-medium">{formatCurrency(order.subtotal)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Discount</dt>
              <dd className="font-medium">
                {order.discount_code
                  ? `${order.discount_code} (-${formatCurrency(order.discount_amount)})`
                  : "None"}
              </dd>
            </div>
            {order.payment_last4 && order.payment_last4 !== "0000" && (
              <div>
                <dt className="text-slate-500">Payment</dt>
                <dd className="font-medium">Card ···· {order.payment_last4}</dd>
              </div>
            )}
          </dl>

          <Link
            to={`/confirmation/${order.order_id}`}
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View full confirmation →
          </Link>
        </div>
      )}
    </article>
  );
}
