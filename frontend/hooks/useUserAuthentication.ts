import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ApiService } from "@/services/api.service";

interface User {
  _id: string;
  color: string;
  stats: {
    totalHexes: number;
    totalRegions: number;
    largestCapture: number;
    totalCaptures: number;
    lastActive: number;
  };
  activeRegions: string[];
  createdAt: number;
}

export function useUserAuthentication() {
  const { address, isConnected } = useAccount();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authenticateUser = async () => {
      if (!isConnected || !address) {
        setUser(null);
        return;
      }

      try {
        setIsAuthenticating(true);
        setError(null);

        // Authenticate with backend
        const response = await ApiService.authenticateUser(address);
        
        if (response.success) {
          setUser(response.user);
          console.log("User authenticated:", response.user);
        } else {
          throw new Error(response.error || "Authentication failed");
        }
      } catch (err: any) {
        console.error("Authentication error:", err);
        setError(err.message);
        setUser(null);
      } finally {
        setIsAuthenticating(false);
      }
    };

    authenticateUser();
  }, [address, isConnected]);

  return {
    user,
    isAuthenticating,
    error,
    walletAddress: address || null,
  };
}
