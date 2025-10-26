import { useEffect, useState } from "react";
import { useWalletClient } from "wagmi";
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
  const { data: walletClient } = useWalletClient();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authenticateUser = async () => {
      if (!walletClient) {
        setUser(null);
        return;
      }

      try {
        setIsAuthenticating(true);
        setError(null);

        // Get wallet address
        const addresses = await walletClient.requestAddresses();
        const walletAddress = addresses[0];

        if (!walletAddress) {
          throw new Error("No wallet address found");
        }

        // Authenticate with backend
        const response = await ApiService.authenticateUser(walletAddress);
        
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
  }, [walletClient]);

  return {
    user,
    isAuthenticating,
    error,
    walletAddress: user?._id || null,
  };
}
