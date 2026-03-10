import { AuthClient } from "@dfinity/auth-client";
import { useEffect, useState } from "react";

export function useAuth() {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AuthClient.create().then(async (client) => {
      const authenticated = await client.isAuthenticated();
      setAuthClient(client);
      setIsAuthenticated(authenticated);
      setLoading(false);
    });
  }, []);

  async function login() {
    if (!authClient) return;
    await authClient.login({
      identityProvider: "https://identity.ic0.app",
      onSuccess: () => setIsAuthenticated(true),
    });
  }

  async function logout() {
    if (!authClient) return;
    await authClient.logout();
    setIsAuthenticated(false);
  }

  return { isAuthenticated, loading, login, logout };
}
