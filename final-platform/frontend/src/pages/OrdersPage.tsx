import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { OrderCard } from "../components/OrderCard";
import { useAuth } from "../context/AuthContext";
import { fetchOrders } from "../lib/api";
import type { Order } from "../types/product";

export function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetchOrders()
      .then((data) => {
        if (active) setOrders(data);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {isAdmin ? "All orders" : "My orders"}
        </h1>
        <p className="mt-2 text-slate-600">
          {isAdmin
            ? "View and manage every customer order in the store."
            : "Orders linked to your account. Checkout while signed in to see them here."}
        </p>
      </div>

      {loading && (
        <div className="rounded-2xl bg-white p-8 text-center text-slate-600 shadow-sm ring-1 ring-slate-200">
          Loading orders…
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <p className="text-lg font-medium text-slate-900">No orders yet</p>
          <p className="mt-2 text-sm text-slate-600">
            {isAdmin
              ? "No orders have been placed in the system."
              : "Place an order from checkout while signed in, or use POST /api/orders."}
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Start shopping
          </Link>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <>
          <p className="mb-4 text-sm text-slate-500">
            {orders.length} order{orders.length !== 1 ? "s" : ""}
            {isAdmin ? " (all customers)" : ""}
          </p>
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order.order_id}
                order={order}
                showCustomer={isAdmin}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
