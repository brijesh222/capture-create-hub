import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isAdminAllowed, setAdminSession } from "@/lib/admin-auth";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!isAdminAllowed(email.trim())) {
      setError("Access denied. Only the portfolio owner can sign in.");
      return;
    }
    setAdminSession();
    navigate("/admin", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
        <h1 className="mb-2 text-center font-display text-2xl font-bold text-foreground">
          Admin Login
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Sign in with your portfolio owner email
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 border-border bg-secondary"
              autoComplete="email"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full bg-primary text-primary-foreground">
            Sign In
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <a href="/" className="hover:text-primary">← Back to site</a>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
