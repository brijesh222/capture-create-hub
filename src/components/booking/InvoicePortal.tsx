import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download } from "lucide-react";
import Invoice, { type InvoiceData } from "./Invoice";

/**
 * Renders the invoice into document.body rather than inside the React root.
 *
 * The print stylesheet hides `#root` so only the invoice reaches the page. If
 * the invoice lived inside `#root` it would be hidden along with everything
 * else, and the printout would come out blank.
 */
const InvoicePortal = ({ data }: { data: InvoiceData }) => {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.createElement("div");
    el.setAttribute("data-invoice-host", "");
    document.body.appendChild(el);
    setHost(el);
    return () => {
      el.remove();
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-[0.92rem] font-medium transition-colors hover:border-foreground"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Download invoice
      </button>
      {host ? createPortal(<Invoice ref={sheetRef} data={data} />, host) : null}
    </>
  );
};

export default InvoicePortal;
