import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { formatCurrency, submitCheckout, validateDiscount } from "../lib/api";

export function CheckoutPage() {
  const navigate = useNavigate();
  const {
    cartLines,
    itemCount,
    subtotal,
    discount,
    setDiscount,
    clearCart,
    setLastOrder,
  } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validatingDiscount, setValidatingDiscount] = useState(false);

  const discountAmount = discount?.valid ? discount.discount_amount ?? 0 : 0;
  const total = useMemo(
    () => Math.max(subtotal - discountAmount, 0),
    [subtotal, discountAmount]
  );

  const handleApplyDiscount = async () => {
    setError(null);
    setMessage(null);
    setValidatingDiscount(true);
    try {
      const result = await validateDiscount(discountCode, subtotal);
      setDiscount(result);
      setMessage(result.message);
    } catch (err) {
      setDiscount(null);
      setError(err instanceof Error ? err.message : "Invalid discount code.");
    } finally {
      setValidatingDiscount(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (itemCount === 0) {
      setError("Your cart is empty. Add items before checking out.");
      return;
    }

    setLoading(true);
    try {
      const response = await submitCheckout({
        customer_name: customerName,
        customer_email: customerEmail,
        discount_code: discount?.valid ? discount.code : undefined,
        items: cartLines.map((line) => ({
          product_id: line.product.id,
          quantity: line.quantity,
        })),
        payment: {
          card_number: cardNumber,
          expiry,
          cvv,
          cardholder_name: cardholderName || customerName,
        },
      });
      setLastOrder(response.order);
      clearCart();
      navigate(`/confirmation/${response.order.order_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setLoading(false);
    }
  };

  if (itemCount === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Nothing to checkout</h1>
        <p className="mt-2 text-slate-600">Your cart is empty.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
          <p className="mt-1 text-sm text-slate-600">
            Secure payment validation with test cards. Use{" "}
            <code className="rounded bg-slate-100 px-1">4111111111111111</code> for success.
          </p>
        </div>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Contact
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Full name</span>
              <input
                required
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                placeholder="Jane Doe"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Email</span>
              <input
                required
                type="email"
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                placeholder="jane@example.com"
              />
            </label>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Discount code
          </h2>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              value={discountCode}
              onChange={(event) => setDiscountCode(event.target.value.toUpperCase())}
              className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 uppercase"
              placeholder="SAVE10, WELCOME20, FLAT15"
            />
            <button
              type="button"
              onClick={handleApplyDiscount}
              disabled={validatingDiscount || !discountCode}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {validatingDiscount ? "Applying..." : "Apply"}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Try invalid codes like <code className="rounded bg-slate-100 px-1">EXPIRED</code> or{" "}
            <code className="rounded bg-slate-100 px-1">NOTREAL</code>.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Payment
          </h2>
          <div className="mt-3 grid gap-4">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Card number</span>
              <input
                required
                inputMode="numeric"
                autoComplete="cc-number"
                value={cardNumber}
                onChange={(event) => setCardNumber(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                placeholder="4111 1111 1111 1111"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-sm sm:col-span-1">
                <span className="mb-1 block font-medium text-slate-700">Expiry</span>
                <input
                  required
                  value={expiry}
                  onChange={(event) => setExpiry(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                  placeholder="MM/YY"
                />
              </label>
              <label className="block text-sm sm:col-span-1">
                <span className="mb-1 block font-medium text-slate-700">CVV</span>
                <input
                  required
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  value={cvv}
                  onChange={(event) => setCvv(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                  placeholder="123"
                />
              </label>
              <label className="block text-sm sm:col-span-1">
                <span className="mb-1 block font-medium text-slate-700">Name on card</span>
                <input
                  value={cardholderName}
                  onChange={(event) => setCardholderName(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                  placeholder="Jane Doe"
                />
              </label>
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Processing payment..." : `Pay ${formatCurrency(total)}`}
        </button>
      </form>

      <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {cartLines.map(({ product, quantity, lineTotal }) => (
            <li key={product.id} className="flex justify-between gap-3">
              <span className="text-slate-600">
                {product.title} × {quantity}
              </span>
              <span className="font-medium text-slate-900">{formatCurrency(lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-600">Subtotal</dt>
            <dd>{formatCurrency(subtotal)}</dd>
          </div>
          {discount?.valid && (
            <div className="flex justify-between text-emerald-700">
              <dt>Discount</dt>
              <dd>-{formatCurrency(discountAmount)}</dd>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-indigo-600">
            <dt>Total</dt>
            <dd>{formatCurrency(total)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
