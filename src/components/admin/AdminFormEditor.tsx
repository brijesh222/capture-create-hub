import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSiteConfig } from "@/context/SiteConfigContext";
import type { FormFieldConfig, FormFieldOptionsSource } from "@/types/site-config";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const FIELD_TYPES: FormFieldConfig["type"][] = [
  "text",
  "tel",
  "email",
  "date",
  "textarea",
  "select",
];

export default function AdminFormEditor() {
  const { config, updateConfig } = useSiteConfig();
  const form = config.form;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const setForm = (updates: Partial<typeof form>) => {
    updateConfig("form", { ...form, ...updates });
  };

  const setBudgetOptions = (value: string) => {
    const opts = value
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    setForm({ budgetOptions: opts });
  };

  const updateField = (id: string, updates: Partial<FormFieldConfig>) => {
    const fields = form.fields.map((f) =>
      f.id === id ? { ...f, ...updates } : f
    );
    setForm({ fields });
  };

  const addField = () => {
    const newField: FormFieldConfig = {
      id: `f-${Date.now()}`,
      key: `field_${form.fields.length + 1}`,
      label: "New field",
      placeholder: "",
      type: "text",
      required: false,
    };
    setForm({ fields: [...form.fields, newField] });
    setExpandedId(newField.id);
  };

  const removeField = (id: string) => {
    setForm({ fields: form.fields.filter((f) => f.id !== id) });
    if (expandedId === id) setExpandedId(null);
  };

  const moveField = (index: number, direction: 1 | -1) => {
    const next = [...form.fields];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setForm({ fields: next });
  };

  const setFieldOptions = (id: string, value: string) => {
    const opts = value
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    updateField(id, { options: opts });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book Now form</CardTitle>
        <CardDescription>
          Add, remove, or edit every form field. For select fields choose where options come from (Categories, Budget list, or Custom list).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Form title</Label>
          <Input
            value={form.formTitle}
            onChange={(e) => setForm({ formTitle: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Form subtitle</Label>
          <Input
            value={form.formSubtitle}
            onChange={(e) => setForm({ formSubtitle: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Submit button text</Label>
          <Input
            value={form.submitButtonText}
            onChange={(e) => setForm({ submitButtonText: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <Label className="block mb-2">Budget options (used by any field with dropdown source “Budget”)</Label>
          <textarea
            value={form.budgetOptions.join("\n")}
            onChange={(e) => setBudgetOptions(e.target.value)}
            rows={5}
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Under ₹5,000&#10;₹5,000 - ₹10,000&#10;..."
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Form fields (order = display order)</Label>
            <Button type="button" size="sm" onClick={addField}>
              <Plus className="h-4 w-4 mr-1" /> Add field
            </Button>
          </div>
          <div className="space-y-2">
            {form.fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-lg border border-border bg-muted/30 p-3 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(expandedId === field.id ? null : field.id)
                    }
                    className="flex items-center gap-2 font-medium text-foreground hover:underline text-left flex-1"
                  >
                    <span className="text-muted-foreground">{index + 1}.</span>
                    {field.label || field.key || "Unnamed field"}
                    <span className="text-xs text-muted-foreground">
                      ({field.type})
                    </span>
                  </button>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => moveField(index, -1)}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => moveField(index, 1)}
                      disabled={index === form.fields.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(field.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {expandedId === field.id && (
                  <div className="grid gap-3 pt-2 border-t border-border">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Key (unique, no spaces)</Label>
                        <Input
                          value={field.key}
                          onChange={(e) =>
                            updateField(field.id, { key: e.target.value.replace(/\s/g, "") })
                          }
                          placeholder="e.g. name, phone"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) =>
                            updateField(field.id, { label: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Placeholder</Label>
                      <Input
                        value={field.placeholder}
                        onChange={(e) =>
                          updateField(field.id, { placeholder: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <Label className="text-xs block mb-1">Type</Label>
                        <Select
                          value={field.type}
                          onValueChange={(v: FormFieldConfig["type"]) =>
                            updateField(field.id, { type: v })
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <label className="flex items-center gap-2 mt-6">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) =>
                            updateField(field.id, { required: e.target.checked })
                          }
                          className="rounded border-input"
                        />
                        <span className="text-sm">Required</span>
                      </label>
                    </div>

                    {field.type === "select" && (
                      <div>
                        <Label className="text-xs block mb-1">
                          Dropdown options from
                        </Label>
                        <Select
                          value={field.optionsSource || "custom"}
                          onValueChange={(v: FormFieldOptionsSource) =>
                            updateField(field.id, { optionsSource: v })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="categories">
                              Categories (from site categories)
                            </SelectItem>
                            <SelectItem value="budget">
                              Budget (from list above)
                            </SelectItem>
                            <SelectItem value="custom">
                              Custom (list below)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {(field.optionsSource === "custom" || !field.optionsSource) && (
                          <div className="mt-2">
                            <Label className="text-xs">
                              Custom options (one per line)
                            </Label>
                            <textarea
                              value={(field.options || []).join("\n")}
                              onChange={(e) =>
                                setFieldOptions(field.id, e.target.value)
                              }
                              rows={3}
                              className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              placeholder="Option 1&#10;Option 2"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
