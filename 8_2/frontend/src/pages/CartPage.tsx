import { Link } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { formatCurrency } from "../lib/api";

export function CartPage() {
  const {
    cartLines,
    itemCount,
    subtotal,
    discount,
    updateQuantity,
    removeFromCart,
    setDiscount,
  } = useCart();

  const discountAmount = discount?.valid ? discount.discount_amount ?? 0 : 0;
  const total = Math.max(subtotal - discountAmount, 0);

  if (itemCount === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl">
          🛒
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Your cart is empty</h1>
        <p className="mt-2 text-slate-600">
          Add products from the shop to begin checkout.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Shopping Cart</h1>
        <ul className="mt-6 divide-y divide-slate-100">
          {cartLines.map(({ product, quantity, lineTotal }) => (
            <li key={product.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="h-24 w-24 rounded-xl object-cover ring-1 ring-slate-200"
              />
              <div className="flex-1">
                <h2 className="font-semibold text-slate-900">{product.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{formatCurrency(product.price)} each</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    Qty
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(event) =>
                        updateQuantity(product.id, Number(event.target.value))
                      }
                      className="w-20 rounded-lg border border-slate-300 px-2 py-1"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeFromCart(product.id)}
                    className="text-sm font-medium text-rose-600 hover:text-rose-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(lineTotal)}</p>
            </li>
          ))}
        </ul>
      </section>

      <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Order Summary</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-600">Subtotal</dt>
            <dd className="font-medium text-slate-900">{formatCurrency(subtotal)}</dd>
          </div>
          {discount?.valid && (
            <div className="flex justify-between text-emerald-700">
              <dt>Discount ({discount.code})</dt>
              <dd>-{formatCurrency(discountAmount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-100 pt-3 text-base">
            <dt className="font-semibold text-slate-900">Total</dt>
            <dd className="font-bold text-indigo-600">{formatCurrency(total)}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            to="/checkout"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Proceed to checkout
          </Link>
          <button
            type="button"
            onClick={() => setDiscount(null)}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Clear applied discount
          </button>
        </div>
      </aside>
    </div>
  );
}
