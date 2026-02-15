import { useState } from "react";
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
import { categories, budgetOptions } from "@/data/categories";
import { toast } from "sonner";

interface BookingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BookingFormDialog = ({ open, onOpenChange }: BookingFormDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    city: "",
    shootType: "",
    customShootType: "",
    budget: "",
    preferredDate: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, show success toast. Admin/backend will handle this later.
    toast.success("Booking request sent! We'll contact you shortly.");
    onOpenChange(false);
    setFormData({
      name: "",
      phone: "",
      city: "",
      shootType: "",
      customShootType: "",
      budget: "",
      preferredDate: "",
      message: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-foreground">
            Book Your Shoot
          </DialogTitle>
          <p className="font-body text-sm text-muted-foreground">
            Fill in the details and we'll get back to you within 24 hours.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="font-body text-foreground">Name</Label>
            <Input
              required
              placeholder="Your full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <Label className="font-body text-foreground">Phone Number</Label>
            <Input
              required
              type="tel"
              placeholder="+91 XXXXX XXXXX"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <Label className="font-body text-foreground">City</Label>
            <Input
              required
              placeholder="Your city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <Label className="font-body text-foreground">Type of Shoot</Label>
            <Select
              value={formData.shootType}
              onValueChange={(value) => setFormData({ ...formData, shootType: value })}
            >
              <SelectTrigger className="border-border bg-secondary text-foreground">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>
                    {cat.name}
                  </SelectItem>
                ))}
                <SelectItem value="other">Other (specify below)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.shootType === "other" && (
            <div>
              <Label className="font-body text-foreground">Specify Category</Label>
              <Input
                required
                placeholder="Your shoot category"
                value={formData.customShootType}
                onChange={(e) =>
                  setFormData({ ...formData, customShootType: e.target.value })
                }
                className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}

          <div>
            <Label className="font-body text-foreground">Budget</Label>
            <Select
              value={formData.budget}
              onValueChange={(value) => setFormData({ ...formData, budget: value })}
            >
              <SelectTrigger className="border-border bg-secondary text-foreground">
                <SelectValue placeholder="Select budget range" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                {budgetOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="font-body text-foreground">Preferred Date</Label>
            <Input
              type="date"
              value={formData.preferredDate}
              onChange={(e) =>
                setFormData({ ...formData, preferredDate: e.target.value })
              }
              className="border-border bg-secondary text-foreground"
            />
          </div>

          <div>
            <Label className="font-body text-foreground">Message</Label>
            <Textarea
              placeholder="Tell us more about your vision..."
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              rows={3}
              className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-gold py-3 font-body text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-gold transition-all hover:opacity-90"
          >
            Submit Booking Request
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingFormDialog;
