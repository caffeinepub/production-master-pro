import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Factory, Lock, User } from "lucide-react";
import { useState } from "react";

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const savedUsername = localStorage.getItem("app_username") ?? "A";
    const savedPassword = localStorage.getItem("app_password") ?? "a";

    if (username === savedUsername && password === savedPassword) {
      setError("");
      onLogin();
    } else {
      setError("Invalid Username or Password");
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "oklch(var(--background))" }}
    >
      <div className="w-full" style={{ maxWidth: "360px" }}>
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "oklch(var(--primary))" }}
          >
            <Factory className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h1
            className="font-heading font-bold text-center"
            style={{
              fontSize: "22px",
              letterSpacing: "-0.02em",
              color: "oklch(var(--foreground))",
            }}
          >
            Production Master Pro
          </h1>
          <p
            className="text-center mt-1"
            style={{
              fontSize: "13px",
              color: "oklch(var(--muted-foreground))",
            }}
          >
            Garment Factory Management
          </p>
        </div>

        <Card
          style={{
            border: "1px solid oklch(var(--border))",
            boxShadow: "0 4px 24px oklch(0.2 0.04 220 / 0.12)",
          }}
        >
          <CardHeader className="pb-2">
            <p
              className="font-semibold text-center"
              style={{
                fontSize: "16px",
                color: "oklch(var(--foreground))",
              }}
            >
              Sign In
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="username"
                  style={{ color: "oklch(var(--foreground))" }}
                >
                  Username
                </Label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  />
                  <Input
                    id="username"
                    data-ocid="login.input"
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError("");
                    }}
                    className="pl-10"
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="password"
                  style={{ color: "oklch(var(--foreground))" }}
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  />
                  <Input
                    id="password"
                    data-ocid="login.password_input"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    className="pl-10"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && (
                <div
                  data-ocid="login.error_state"
                  className="rounded-lg px-3 py-2 text-sm text-center"
                  style={{
                    background: "oklch(var(--destructive) / 0.1)",
                    color: "oklch(var(--destructive))",
                    border: "1px solid oklch(var(--destructive) / 0.3)",
                  }}
                >
                  {error}
                </div>
              )}

              <Button
                data-ocid="login.submit_button"
                type="submit"
                className="w-full mt-1"
                style={{ background: "oklch(var(--primary))" }}
              >
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
