import { gateway } from "@elasticpath/js-sdk";
import type { ConfigOptions } from "@elasticpath/js-sdk";

/**
 * Authentication data interface
 */
interface AuthenticationData {
  grant_type: "refresh_token" | "password";
  refresh_token?: string;
  username?: string;
  password?: string;
}

/**
 * Custom authenticator response body interface
 */
interface CustomAuthenticatorResponseBody {
  access_token: string;
  token_type: string;
  expires: number;
  expires_in: number;
  refresh_token?: string;
}

/**
 * Authentication service for handling refresh tokens
 */
class AuthenticationService {
  /**
   * Authenticate using refresh token
   */
  async authenticateRefreshToken(
    refreshToken: string
  ): Promise<CustomAuthenticatorResponseBody> {
    return this.attemptRefreshTokenRequest(refreshToken);
  }

  private async attemptRefreshTokenRequest(
    refreshToken: string
  ): Promise<CustomAuthenticatorResponseBody> {
    const body: AuthenticationData = {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    };

    const response = await this.authenticateUser(body);

    if (!response.ok) {
      console.error(`Refresh token is possibly invalid: ${response.status}`);
      throw new Error(`Authentication failed: ${response.status}`);
    }

    const data = await response.json();
    localStorage.setItem("epcc_refresh_token", data.refresh_token || "");
    localStorage.setItem("epcc_access_token", data.access_token || "");
    return data;
  }

  private async authenticateUser(form: AuthenticationData): Promise<Response> {
    const apiUrl =
      process.env.NEXT_PUBLIC_EPCC_ENDPOINT_URL || "api.moltin.com";

    const body = new URLSearchParams();
    Object.entries(form).forEach(([key, value]) => {
      if (value) body.append(key, value);
    });

    return fetch(`https://${apiUrl}/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
  }
}

/**
 * Resolve refresh token from storage
 */
function resolveRefreshToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("epcc_refresh_token");
  }
  return null;
}

/**
 * Create authenticator function using refresh token pattern
 */
export function createAuthenticator(
  authenticationService: AuthenticationService
) {
  return async function authenticator(): Promise<CustomAuthenticatorResponseBody> {
    const refreshToken = resolveRefreshToken();

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    return await authenticationService.authenticateRefreshToken(refreshToken);
  };
}

/**
 * Create authenticated SDK client following Elastic Path patterns
 */
export function createAuthenticatedSDKClient(
  authenticationService: AuthenticationService,
  orgId?: string,
  storeId?: string
) {
  const headers: any = {};

  if (orgId) {
    headers["EP-ORG-ID"] = orgId;
  }

  if (storeId) {
    headers["EP-STORE-ID"] = storeId;
  }

  const configOptions: ConfigOptions = {
    host: process.env.NEXT_PUBLIC_EPCC_ENDPOINT_URL,
    custom_authenticator: createAuthenticator(authenticationService),
    reauth: true, // Enable automatic re-authentication
    disableCart: true,
    headers,
    throttleEnabled: false,
  };

  return gateway(configOptions);
}

/**
 * Create client with refresh token support
 */
export function createClientWithRefreshToken(
  orgId?: string,
  storeId?: string
): any {
  const authenticationService = new AuthenticationService();
  return createAuthenticatedSDKClient(authenticationService, orgId, storeId);
}

/**
 * Fallback: Create client with access token (for backward compatibility)
 */
export function createClientWithAccessToken(
  accessToken: string,
  orgId?: string,
  storeId?: string
) {
  const headers: any = {};

  if (orgId) {
    headers["EP-ORG-ID"] = orgId;
  }

  if (storeId) {
    headers["EP-STORE-ID"] = storeId;
  }
  const configOptions: ConfigOptions = {
    host: process.env.NEXT_PUBLIC_EPCC_ENDPOINT_URL,
    custom_authenticator: () =>
      Promise.resolve({
        access_token: accessToken,
        token_type: "Bearer",
        expires: Date.now() + 3600000,
        expires_in: 999999999,
      }),
    headers,
    reauth: false,
    disableCart: true,
    throttleEnabled: false,
  };

  const client = gateway(configOptions);
  return client;
}

/**
 * Main client creation function - uses refresh token if available, falls back to access token
 */
export const createClient = (
  accessToken: string,
  orgId?: string,
  storeId?: string
) => {
  const refreshToken = resolveRefreshToken();
  // return createClientWithAccessToken(accessToken, orgId, storeId);

  if (refreshToken) {
    return createClientWithRefreshToken(orgId, storeId);
  } else {
    return createClientWithAccessToken(accessToken, orgId, storeId);
  }
};
