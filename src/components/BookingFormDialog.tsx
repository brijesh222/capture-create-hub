import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, MessageCircle } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { toast } from "sonner";
import type { FormFieldConfig, PackageItem } from "@/types/site-config";

/** Opening the form from a package card carries that choice in with it. */
export interface BookingPrefill {
  shootType?: string;
  packageId?: string;
}

interface BookingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill?: BookingPrefill;
}

const NOT_SURE = "not-sure";

function packageOptions(
  packages: PackageItem[],
  shootType: string
): { value: string; label: string }[] {
  // Before a service is chosen there is nothing sensible to list, so offer the
  // escape hatch rather than every package the studio sells.
  const forService = shootType
    ? packages.filter((p) => p.serviceSlug === shootType || !p.serviceSlug)
    : [];

  return [
    ...forService.map((p) => ({
      value: p.id,
      label: p.price ? `${p.name} — ${p.price}` : p.name,
    })),
    { value: NOT_SURE, label: "Let us know your budget" },
  ];
}

function getOptionsForField(
  field: FormFieldConfig,
  categories: { name: string; slug: string; visible?: boolean }[],
  budgetOptions: string[],
  packages: PackageItem[],
  shootType: string
): { value: string; label: string }[] {
  if (field.type !== "select") return [];
  const src = field.optionsSource || "custom";

  if (src === "categories") {
    return [
      ...categories
        .filter((c) => c.visible !== false)
        .map((c) => ({ value: c.slug, label: c.name })),
      { value: "other", label: "Other (specify below)" },
    ];
  }
  if (src === "packages") {
    return packageOptions(packages, shootType);
  }
  if (src === "budget") {
    return budgetOptions.map((o) => ({ value: o, label: o }));
  }
  return (field.options || []).map((o) => ({ value: o, label: o }));
}

const BookingFormDialog = ({ open, onOpenChange, prefill }: BookingFormDialogProps) => {
  const { config } = useSiteConfig();
  const formConfig = config.form;
  const categories = config.categories;
  const budgetOptions = formConfig.budgetOptions || [];
  const packages = config.packages.items;
  const fields = formConfig.fields || [];

  const buildInitial = useMemo(
    () => () => {
      const next: Record<string, string> = {};
      fields.forEach((f) => (next[f.key] = ""));
      if (fields.some((f) => f.key === "shootType")) next["customShootType"] = "";
      if (prefill?.shootType) next["shootType"] = prefill.shootType;
      if (prefill?.packageId) next["package"] = prefill.packageId;
      return next;
    },
    [fields, prefill?.shootType, prefill?.packageId]
  );

  const [formData, setFormData] = useState<Record<string, string>>(buildInitial);
  /** Holds the wa.me link after submitting, which also flips the dialog to the
   *  confirmation view. Kept so the customer can retry if their browser blocked
   *  the new tab. */
  const [sentLink, setSentLink] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFormData(buildInitial());
      setSentLink(null);
    }
  }, [open, buildInitial]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      // A package belongs to one service, so changing the service must not
      // leave a package from the previous one selected.
      if (key === "shootType" && prev.package) next.package = "";
      // A typed budget only belongs to the "let us know" choice; picking a real
      // package, or switching service, must not smuggle it into the message.
      if ((key === "shootType" || key === "package") && next.package !== NOT_SURE) {
        next.customBudget = "";
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const lines: string[] = ["*New Booking Request*", ""];
    fields.forEach((f) => {
      const value = formData[f.key];
      if (!value) return;
      // Send readable text, not internal ids.
      if (f.optionsSource === "packages") {
        const pack = packages.find((p) => p.id === value);
        if (pack) {
          lines.push(`${f.label}: ${pack.name} (${pack.price})`);
        } else {
          const budget = formData["customBudget"]?.trim();
          lines.push(`${f.label}: ${budget ? `Budget — ${budget}` : "Not decided"}`);
        }
        return;
      }
      if (f.optionsSource === "categories") {
        const cat = categories.find((c) => c.slug === value);
        lines.push(`${f.label}: ${cat ? cat.name : value}`);
        return;
      }
      lines.push(`${f.label}: ${value}`);
    });
    if (formData["customShootType"]) {
      lines.push(`Specify category: ${formData["customShootType"]}`);
    }

    const message = lines.join("\n");
    const whatsappNumber =
      config.contact.whatsappNumber.replace(/\D/g, "") || "917023433374";
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    // Opens in a new tab, so this tab stays put and can show the confirmation.
    // A blocked popup returns null — the confirmation offers a manual link.
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    setSentLink(url);
    if (!opened) {
      toast.message("Your browser blocked the WhatsApp window — use the button below.");
    }
  };

  const showOtherSpecify =
    formData["shootType"] === "other" && fields.some((f) => f.key === "shootType");

  // Picking "Let us know your budget" needs somewhere to actually say it.
  const showBudgetField = formData["package"] === NOT_SURE;

  if (sentLink) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <Check className="h-7 w-7 text-primary" aria-hidden="true" />
            </span>
            <DialogTitle className="text-xl font-light tracking-[-0.028em]">
              Request sent
            </DialogTitle>
            <p className="max-w-[22rem] text-[0.95rem] text-[hsl(var(--ink-soft))]">
              Send the WhatsApp message we opened to complete your request — our team
              will get back to you shortly.
            </p>

            <div className="mt-1 flex w-full flex-col gap-2">
              <a
                href={sentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-[0.92rem] font-medium text-primary-foreground transition-colors hover:bg-[hsl(var(--gold-dark))]"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Open WhatsApp again
              </a>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex w-full items-center justify-center rounded-full border border-border px-6 py-3 text-[0.92rem] font-medium transition-colors hover:border-foreground"
              >
                Done
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light tracking-[-0.028em] text-foreground">
            {formConfig.formTitle}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{formConfig.formSubtitle}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => {
            const value = formData[field.key] ?? "";

            if (field.type === "select") {
              const options = getOptionsForField(
                field,
                categories,
                budgetOptions,
                packages,
                formData["shootType"] ?? ""
              );
              const awaitingService =
                field.optionsSource === "packages" && !formData["shootType"];

              return (
                <div key={field.id}>
                  <Label className="text-foreground">
                    {field.label}
                    {field.required && " *"}
                  </Label>
                  <Select
                    value={value}
                    onValueChange={(v) => handleChange(field.key, v)}
                    required={field.required}
                  >
                    <SelectTrigger className="mt-1 border-border bg-background text-foreground">
                      <SelectValue
                        placeholder={
                          awaitingService
                            ? "Choose a shoot type first"
                            : field.placeholder
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card">
                      {options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Follow-up questions sit directly under the answer that
                      raised them, rather than at the end of the form. */}
                  {field.optionsSource === "packages" && showBudgetField ? (
                    <div className="mt-3">
                      <Label className="text-foreground">
                        What budget did you have in mind?
                      </Label>
                      <Input
                        value={formData["customBudget"] ?? ""}
                        onChange={(e) => handleChange("customBudget", e.target.value)}
                        placeholder="e.g. around ₹30,000"
                        className="mt-1 border-border bg-background text-foreground placeholder:text-muted-foreground"
                      />
                      <p className="mt-1.5 text-[0.78rem] text-muted-foreground">
                        A rough range is fine — it helps us suggest the right package.
                      </p>
                    </div>
                  ) : null}

                  {field.key === "shootType" && showOtherSpecify ? (
                    <div className="mt-3">
                      <Label className="text-foreground">Specify category</Label>
                      <Input
                        value={formData["customShootType"] ?? ""}
                        onChange={(e) => handleChange("customShootType", e.target.value)}
                        placeholder="Your shoot category"
                        className="mt-1 border-border bg-background text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  ) : null}
                </div>
              );
            }

            if (field.type === "textarea") {
              return (
                <div key={field.id}>
                  <Label className="text-foreground">
                    {field.label}
                    {field.required && " *"}
                  </Label>
                  <Textarea
                    value={value}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    rows={3}
                    className="mt-1 border-border bg-background text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              );
            }

            return (
              <div key={field.id}>
                <Label className="text-foreground">
                  {field.label}
                  {field.required && " *"}
                </Label>
                <Input
                  type={field.type}
                  value={value}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  className="mt-1 border-border bg-background text-foreground placeholder:text-muted-foreground"
                />
              </div>
            );
          })}

          <button
            type="submit"
            className="w-full rounded-full bg-primary py-3.5 text-[0.92rem] font-medium text-primary-foreground transition-colors hover:bg-[hsl(var(--gold-dark))]"
          >
            {formConfig.submitButtonText}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingFormDialog;
