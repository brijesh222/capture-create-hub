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
import { useSiteConfig } from "@/context/SiteConfigContext";
import { getWhatsAppLink } from "@/lib/site-config-utils";
import { toast } from "sonner";
import type { FormFieldConfig } from "@/types/site-config";

interface BookingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getOptionsForField(
  field: FormFieldConfig,
  categories: { name: string; slug: string }[],
  budgetOptions: string[]
): { value: string; label: string }[] {
  if (field.type !== "select") return [];
  const src = field.optionsSource || "custom";
  if (src === "categories") {
    return [
      ...categories.map((c) => ({ value: c.slug, label: c.name })),
      { value: "other", label: "Other (specify below)" },
    ];
  }
  if (src === "budget") {
    return budgetOptions.map((o) => ({ value: o, label: o }));
  }
  return (field.options || []).map((o) => ({ value: o, label: o }));
}

const BookingFormDialog = ({ open, onOpenChange }: BookingFormDialogProps) => {
  const { config } = useSiteConfig();
  const formConfig = config.form;
  const categories = config.categories;
  const budgetOptions = formConfig.budgetOptions || [];
  const fields = formConfig.fields || [];

  const initialValues = useMemo(() => {
    const acc: Record<string, string> = {};
    fields.forEach((f) => (acc[f.key] = ""));
    if (fields.some((f) => f.key === "shootType")) acc["customShootType"] = "";
    return acc;
  }, [fields]);

  const [formData, setFormData] = useState<Record<string, string>>(initialValues);

  useEffect(() => {
    if (open) {
      const next: Record<string, string> = {};
      fields.forEach((f) => (next[f.key] = ""));
      if (fields.some((f) => f.key === "shootType")) next["customShootType"] = "";
      setFormData(next);
    }
  }, [open, fields]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const lines: string[] = ["*New Booking Request*", ""];
    fields.forEach((f) => {
      const value = formData[f.key];
      if (value) lines.push(`${f.label}: ${value}`);
    });
    if (formData["customShootType"]) {
      lines.push(`Specify category: ${formData["customShootType"]}`);
    }
    const message = lines.join("\n");
    const whatsappNumber = config.contact.whatsappNumber.replace(/\D/g, "") || "917023433374";
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
    toast.success("Opening WhatsApp with your details. Send the message to complete your booking.");
    onOpenChange(false);
    setFormData(initialValues);
  };

  const showOtherSpecify =
    formData["shootType"] === "other" &&
    fields.some((f) => f.key === "shootType");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-foreground">
            {formConfig.formTitle}
          </DialogTitle>
          <p className="font-body text-sm text-muted-foreground">
            {formConfig.formSubtitle}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => {
            const value = formData[field.key] ?? "";
            if (field.type === "select") {
              const options = getOptionsForField(
                field,
                categories,
                budgetOptions
              );
              return (
                <div key={field.id}>
                  <Label className="font-body text-foreground">
                    {field.label}
                    {field.required && " *"}
                  </Label>
                  <Select
                    value={value}
                    onValueChange={(v) => handleChange(field.key, v)}
                    required={field.required}
                  >
                    <SelectTrigger className="mt-1 border-border bg-secondary text-foreground">
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card">
                      {options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            }
            if (field.type === "textarea") {
              return (
                <div key={field.id}>
                  <Label className="font-body text-foreground">
                    {field.label}
                    {field.required && " *"}
                  </Label>
                  <Textarea
                    value={value}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    rows={3}
                    className="mt-1 border-border bg-secondary text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              );
            }
            return (
              <div key={field.id}>
                <Label className="font-body text-foreground">
                  {field.label}
                  {field.required && " *"}
                </Label>
                <Input
                  type={field.type}
                  value={value}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  className="mt-1 border-border bg-secondary text-foreground placeholder:text-muted-foreground"
                />
              </div>
            );
          })}

          {showOtherSpecify && (
            <div>
              <Label className="font-body text-foreground">
                Specify category
              </Label>
              <Input
                value={formData["customShootType"] ?? ""}
                onChange={(e) => handleChange("customShootType", e.target.value)}
                placeholder="Your shoot category"
                className="mt-1 border-border bg-secondary text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-gold py-3 font-body text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-gold transition-all hover:opacity-90"
          >
            {formConfig.submitButtonText}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingFormDialog;
