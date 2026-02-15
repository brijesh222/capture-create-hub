import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSiteConfig } from "@/context/SiteConfigContext";

export default function AdminContactEditor() {
  const { config, updateConfig } = useSiteConfig();
  const contact = config.contact;

  const set = (updates: Partial<typeof contact>) => {
    updateConfig("contact", { ...contact, ...updates });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact & Footer</CardTitle>
        <CardDescription>Contact details and footer content.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>WhatsApp number (with country code, no +)</Label>
          <Input
            value={contact.whatsappNumber}
            onChange={(e) => set({ whatsappNumber: e.target.value })}
            placeholder="917023433374"
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={contact.email}
            onChange={(e) => set({ email: e.target.value })}
          />
        </div>
        <div>
          <Label>Location</Label>
          <Input
            value={contact.location}
            onChange={(e) => set({ location: e.target.value })}
            placeholder="Rajasthan, India"
          />
        </div>
        <div>
          <Label>Footer brand name</Label>
          <Input
            value={contact.footerBrandName}
            onChange={(e) => set({ footerBrandName: e.target.value })}
          />
        </div>
        <div>
          <Label>Footer tagline</Label>
          <Textarea
            value={contact.footerTagline}
            onChange={(e) => set({ footerTagline: e.target.value })}
            rows={2}
          />
        </div>
        <div>
          <Label>Copyright prefix (e.g. "BP Productions")</Label>
          <Input
            value={contact.footerCopyrightPrefix}
            onChange={(e) => set({ footerCopyrightPrefix: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
