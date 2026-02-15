import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSiteConfig } from "@/context/SiteConfigContext";

export default function AdminRedirectionsEditor() {
  const { config, updateConfig } = useSiteConfig();
  const redir = config.redirections;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Redirections</CardTitle>
        <CardDescription>Override WhatsApp link and optional redirect after booking.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>WhatsApp link (full URL)</Label>
          <Input
            value={redir.whatsappLink}
            onChange={(e) =>
              updateConfig("redirections", { ...redir, whatsappLink: e.target.value })
            }
            placeholder="https://wa.me/917023433374"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Usually auto from Contact WhatsApp number; override here if needed.
          </p>
        </div>
        <div>
          <Label>Book now redirect URL (optional)</Label>
          <Input
            value={redir.bookNowRedirectUrl}
            onChange={(e) =>
              updateConfig("redirections", { ...redir, bookNowRedirectUrl: e.target.value })
            }
            placeholder="https://..."
          />
        </div>
      </CardContent>
    </Card>
  );
}
