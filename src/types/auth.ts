export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires: number;
  expires_in: number;
  refresh_token?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  organizations?: Organization[];
  stores?: Store[];
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  slug: string;
  type: string;
}

export interface Store {
  id: string;
  name: string;
  description?: string;
  slug: string;
  type: string;
  organization_id?: string;
  relationships?: {
    organization?: {
      data: {
        id: string;
        type: string;
      };
    };
  };
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  accessToken: string | null;
}
