import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { fetchOrder, formatCurrency } from "../lib/api";
import type { Order } from "../types/product";

export function ConfirmationPage() {
  const { orderId } = useParams();
  const { lastOrder } = useCart();
  const [order, setOrder] = useState<Order | null>(lastOrder);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    if (lastOrder?.order_id === orderId) {
      setOrder(lastOrder);
      return;
    }
    fetchOrder(orderId)
      .then(setOrder)
      .catch((err: Error) => setError(err.message));
  }, [orderId, lastOrder]);

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        {error}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-2xl bg-white p-6 text-slate-600 shadow-sm ring-1 ring-slate-200">
        Loading confirmation...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-slate-200">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-8 text-white sm:px-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl">
              ✓
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-emerald-50">
                Order confirmed
              </p>
              <h1 className="mt-1 text-3xl font-bold">Thank you, {order.customer_name}!</h1>
              <p className="mt-2 text-emerald-50">
                Order #{order.order_id} · Paid with card ending in {order.payment_last4}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 py-8 sm:px-8">
          <section className="rounded-2xl bg-slate-50 p-5">
            <h2 className="font-semibold text-slate-900">Email notification sent</h2>
            <p className="mt-1 text-sm text-slate-600">
              A confirmation email was sent to{" "}
              <span className="font-medium text-slate-900">{order.customer_email}</span>
              {order.email_preview ? ` with subject "${order.email_preview.subject}".` : "."}
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900">Items</h2>
            <ul className="mt-3 divide-y divide-slate-100 rounded-2xl ring-1 ring-slate-200">
              {order.items.map((item) => (
                <li
                  key={`${item.product_id}-${item.quantity}`}
                  className="flex items-center justify-between px-4 py-3 text-sm"
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
          </section>

          <dl className="grid gap-3 rounded-2xl bg-slate-50 p-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="font-semibold text-slate-900">{formatCurrency(order.subtotal)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Discount</dt>
              <dd className="font-semibold text-slate-900">
                {order.discount_code
                  ? `${order.discount_code} (-${formatCurrency(order.discount_amount)})`
                  : "None"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Total paid</dt>
              <dd className="text-2xl font-bold text-indigo-600">{formatCurrency(order.total)}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Continue shopping
            </Link>
            <Link
              to="/cart"
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              View cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
