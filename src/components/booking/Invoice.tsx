import { forwardRef } from "react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { formatINR } from "@/lib/booking";

export interface InvoiceData {
  invoiceNo: string;
  issuedOn: string;
  customerName: string;
  customerPhone: string;
  customerLocation: string;
  serviceName: string;
  packageName: string;
  shootDate: string;
  slotLabel: string;
  deliverables: string[];
  totalRupees: number;
  paidRupees: number;
}

/**
 * Print-ready invoice, laid out to match the studio's existing paper invoice:
 * teal header block, customer and service side by side, shoot details, then a
 * deliverables list with the totals bottom-right.
 *
 * Rendered off-screen and shown only to the printer, so "Download invoice"
 * produces a PDF through the browser rather than pulling in a PDF library.
 */
const Invoice = forwardRef<HTMLDivElement, { data: InvoiceData }>(({ data }, ref) => {
  const { config } = useSiteConfig();
  const { contact, branding } = config;
  const due = data.totalRupees - data.paidRupees;

  // Branding links for the invoice footer. Handles are stored bare; build the
  // full URLs here so they stay clickable in the printed PDF and web view.
  const igHandle = (contact.instagram || "").replace(/^@/, "").trim();
  const website = (contact.website || "").trim();
  const websiteHref = website
    ? website.startsWith("http")
      ? website
      : `https://${website}`
    : "";

  return (
    <div ref={ref} className="invoice-sheet">
      <header className="inv-head">
        <h1>{branding.siteName}</h1>
        <p className="inv-sub">A production company</p>
        <div className="inv-rule" />
        <div className="inv-head-row">
          <address>
            {contact.location}
            <br />
            {contact.footerBrandName ? `${contact.footerBrandName}` : ""}
            <br />
            +{contact.whatsappNumber.replace(/\D/g, "")}
            <br />
            {contact.email}
          </address>
          <div className="inv-date">
            <strong>Invoice {data.invoiceNo}</strong>
            <br />
            Date: {data.issuedOn}
          </div>
        </div>
      </header>

      <section className="inv-two">
        <div>
          <h2>Customer details</h2>
          <p>
            Name – {data.customerName}
            <br />
            Location – {data.customerLocation}
            <br />
            Mobile – {data.customerPhone}
          </p>
        </div>
        <div>
          <h2>Service description</h2>
          <p>
            {data.serviceName}
            <br />
            {data.packageName}
          </p>
        </div>
      </section>

      <div className="inv-divider" />

      <section>
        <h2 className="inv-centre">Shoot details</h2>
        <div className="inv-two inv-shoot">
          <div>
            <h3>Event name</h3>
            <p>{data.serviceName}</p>
          </div>
          <div className="inv-right">
            <h3>Shoot date</h3>
            <p>
              {data.shootDate}
              <br />
              <span className="inv-muted">{data.slotLabel}</span>
            </p>
          </div>
        </div>
      </section>

      <div className="inv-divider" />

      <section className="inv-two inv-bottom">
        <div>
          <h2>What to be provided</h2>
          <ul>
            {data.deliverables.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
        <div className="inv-totals">
          <p>Total – {formatINR(data.totalRupees)}/-</p>
          <p>Advance paid – {formatINR(data.paidRupees)}/-</p>
          <p>Due after the shoot – {formatINR(due)}/-</p>
        </div>
      </section>

      <footer className="inv-sign">
        <div>
          <div className="inv-sign-line" />
          <span>Client signature</span>
        </div>
        <div>
          <div className="inv-sign-line" />
          <span>{data.issuedOn}</span>
        </div>
      </footer>

      {(igHandle || website) && (
        <div className="inv-brand">
          {igHandle ? (
            <a href={`https://instagram.com/${igHandle}`}>Instagram&nbsp;@{igHandle}</a>
          ) : null}
          {igHandle && website ? <span className="inv-brand-dot">•</span> : null}
          {website ? (
            <a href={websiteHref}>{website.replace(/^https?:\/\//, "")}</a>
          ) : null}
        </div>
      )}
    </div>
  );
});

Invoice.displayName = "Invoice";

export default Invoice;
