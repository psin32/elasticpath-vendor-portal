"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  AuthContextType,
  LoginCredentials,
  User,
  AuthResponse,
} from "../types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing token on app load
    const token = localStorage.getItem("epcc_access_token");
    const userData = localStorage.getItem("epcc_user");

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        setAccessToken(token);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("epcc_access_token");
        localStorage.removeItem("epcc_user");
        setAccessToken(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setLoading(true);

      const response = await fetch(
        `https://${process.env.NEXT_PUBLIC_EPCC_ENDPOINT_URL}/oauth/access_token`,
        {
          method: "POST",
          body: new URLSearchParams({
            grant_type: "password",
            username: credentials.email,
            password: credentials.password,
          }),
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const authData: AuthResponse = await response.json();

      // Store both access and refresh tokens
      localStorage.setItem("epcc_access_token", authData.access_token);
      if (authData.refresh_token) {
        localStorage.setItem("epcc_refresh_token", authData.refresh_token);
      }
      setAccessToken(authData.access_token);

      // Fetch user data
      const userResponse = await fetch(
        `https://${process.env.NEXT_PUBLIC_EPCC_ENDPOINT_URL}/v2/user`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authData.access_token}`,
          },
        }
      );

      if (userResponse.ok) {
        const userData: User = await userResponse.json();

        // Fetch organizations
        const orgResponse = await fetch(
          `https://${process.env.NEXT_PUBLIC_EPCC_ENDPOINT_URL}/v2/user/organizations`,
          {
            headers: {
              Authorization: `Bearer ${authData.access_token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (orgResponse.ok) {
          const orgData = await orgResponse.json();
          userData.organizations = orgData.data || [];
        }

        // Fetch stores
        const storesResponse = await fetch(
          `https://${process.env.NEXT_PUBLIC_EPCC_ENDPOINT_URL}/v2/user/stores?page[limit]=100&page[offset]=0&include=store_tier`,
          {
            headers: {
              Authorization: `Bearer ${authData.access_token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (storesResponse.ok) {
          const storesData = await storesResponse.json();
          userData.stores = storesData.data || [];
        }

        setUser(userData);
        localStorage.setItem("epcc_user", JSON.stringify(userData));
        return true;
      }

      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("epcc_access_token");
    localStorage.removeItem("epcc_refresh_token");
    localStorage.removeItem("epcc_user");
    localStorage.removeItem("selected_org_id");
    localStorage.removeItem("selected_store_id");
    localStorage.removeItem("epCredentials");
    localStorage.removeItem("standalone_stores");
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading,
    accessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
