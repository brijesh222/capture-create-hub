import { getSupabase } from "./supabase";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

/** Payments are live only once a key is configured. */
export function isPaymentEnabled(): boolean {
  return Boolean(import.meta.env.VITE_RAZORPAY_KEY_ID);
}

let scriptPromise: Promise<boolean> | null = null;

/** Loads Razorpay's checkout script once, on demand. */
function loadCheckout(): Promise<boolean> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    if (document.querySelector(`script[src="${RAZORPAY_SCRIPT}"]`)) {
      resolve(true);
      return;
    }
    const el = document.createElement("script");
    el.src = RAZORPAY_SCRIPT;
    el.onload = () => resolve(true);
    el.onerror = () => {
      // Let a later attempt retry rather than caching the failure forever.
      scriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(el);
  });
  return scriptPromise;
}

export interface PaymentRequest {
  serviceSlug: string;
  packageRef: string;
  day: string;
  slotId: string;
  payMode: "advance" | "full";
  name: string;
  phone: string;
  email: string;
  location: string;
  notes: string;
  /** Shown inside Razorpay's window. */
  brandName: string;
  description: string;
}

export type PaymentOutcome =
  | { status: "paid"; paymentId: string; bookingId: string }
  | { status: "dismissed" }
  | { status: "taken"; message: string }
  | { status: "error"; message: string };

/**
 * Creates the order server-side, then opens Razorpay.
 *
 * The amount is never sent from here — the Edge Function derives it from the
 * studio's saved prices. Anything the browser claimed about price could be
 * edited by the customer.
 */
export async function startPayment(req: PaymentRequest): Promise<PaymentOutcome> {
  const supabase = getSupabase();
  if (!supabase) {
    return { status: "error", message: "Payments aren't connected yet." };
  }

  const { data, error } = await supabase.functions.invoke("create-booking-order", {
    body: req,
  });

  if (error) {
    // The function returns 409 when the slot was taken between the calendar
    // loading and the customer reaching payment.
    const context = (error as { context?: { status?: number } }).context;
    if (context?.status === 409) {
      return {
        status: "taken",
        message: "That slot was just booked. Please pick another date.",
      };
    }
    return {
      status: "error",
      message: "Couldn't start the payment. Please try again.",
    };
  }

  const order = data as {
    orderId: string;
    amountPaise: number;
    currency: string;
    keyId: string;
    bookingId: string;
  };

  const ready = await loadCheckout();
  if (!ready) {
    return {
      status: "error",
      message: "Couldn't load the payment window. Check your connection.",
    };
  }

  return new Promise<PaymentOutcome>((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Razorpay = (window as any).Razorpay;
    if (!Razorpay) {
      resolve({ status: "error", message: "Payment window unavailable." });
      return;
    }

    const checkout = new Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amountPaise,
      currency: order.currency,
      name: req.brandName,
      description: req.description,
      prefill: { name: req.name, contact: req.phone, email: req.email },
      theme: { color: "#235143" },
      modal: {
        ondismiss: () => resolve({ status: "dismissed" }),
      },
      // Razorpay calls this when the customer's payment succeeds. It is a
      // convenience for the UI only — the booking is confirmed by the webhook,
      // because this callback never fires if they close the tab first.
      handler: (response: { razorpay_payment_id: string }) =>
        resolve({
          status: "paid",
          paymentId: response.razorpay_payment_id,
          bookingId: order.bookingId,
        }),
    });

    checkout.on("payment.failed", () =>
      resolve({
        status: "error",
        message: "The payment didn't go through. You can try again.",
      })
    );

    checkout.open();
  });
}
