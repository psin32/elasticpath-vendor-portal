# EPCC Client Hooks Usage Examples

This document provides examples of how to use the EPCC client hooks with the Elastic Path JS SDK in your React components.

## Authentication Strategy

The client uses a hybrid authentication approach:

- **Refresh Token Authentication**: When a refresh token is available, the client uses it for automatic token refresh
- **Access Token Fallback**: When no refresh token is available, it falls back to using the current access token
- **Automatic Re-authentication**: The SDK handles token refresh automatically when `reauth: true`

## Basic Usage

### 1. Simple Client Hook

```tsx
import { useEpccClient } from "../hooks/useEpccClient";

function MyComponent() {
  const client = useEpccClient();

  const fetchData = async () => {
    if (!client) return;

    try {
      // Using the JS SDK's ShopperCatalog for products
      const products = await client.ShopperCatalog.Products.All();

      // Or using request method for custom endpoints
      const organizations = await client.request.send(
        "/v2/user/organizations",
        "GET"
      );
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  return (
    <div>
      <button onClick={fetchData} disabled={!client}>
        Fetch Products
      </button>
    </div>
  );
}
```

### 2. Client Hook with State Management

```tsx
import { useEpccClientWithState } from "../hooks/useEpccClient";

function MyComponent() {
  const { client, loading, error, isReady } = useEpccClientWithState();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!isReady) return <div>Client not ready</div>;

  return <div>{/* Your component content */}</div>;
}
```

### 3. Advanced API Hook

```tsx
import { useEpccApi } from "../hooks/useEpccApi";
import { useEffect, useState } from "react";

function ProductsList() {
  const {
    fetchProducts,
    fetchUserRole,
    isLoading,
    hasError,
    error,
    clearApiError,
  } = useEpccApi();

  const [products, setProducts] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const result = await fetchProducts({ limit: 25 });
    if (result) {
      setProducts(result);
    }
  };

  // Example: Fetch user role with different contexts
  const loadUserRole = async () => {
    // With organization context only
    const orgRole = await fetchUserRole("user-123", "org-123");

    // With both organization and store context
    const storeRole = await fetchUserRole("user-123", "org-123", "store-456");

    // Without any context (just user role)
    const userRole = await fetchUserRole("user-123");
  };

  if (isLoading) return <div>Loading products...</div>;

  if (hasError) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={clearApiError}>Clear Error</button>
        <button onClick={loadProducts}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      {products?.data?.map((product) => (
        <div key={product.id}>
          <h3>{product.attributes.name}</h3>
          <p>{product.attributes.description}</p>
        </div>
      ))}
    </div>
  );
}
```

## Available API Methods

The `useEpccApi` hook provides the following methods:

- `fetchOrganizations()` - Get all organizations
- `fetchStores()` - Get all stores
- `fetchOrganization(orgId)` - Get specific organization
- `fetchStore(storeId)` - Get specific store
- `fetchProducts(options)` - Get products with pagination
- `fetchCatalogs()` - Get all catalogs
- `fetchUserProfile()` - Get current user profile
- `fetchUserRole(userId, orgId?, storeId?)` - Get user role with organization/store context
- `apiCall(apiFunction, errorMessage)` - Generic API caller

## Custom API Calls

You can make custom API calls using the generic `apiCall` method:

```tsx
const { apiCall } = useEpccApi();

const fetchCustomData = async () => {
  const result = await apiCall(
    (client) => client.request.send("/v2/custom-endpoint", "GET"),
    "Failed to fetch custom data"
  );

  if (result) {
    console.log(result);
  }
};
```

## Error Handling

All hooks provide comprehensive error handling:

```tsx
const { isLoading, hasError, error, clearApiError, clientError, apiError } =
  useEpccApi();

// Check for different types of errors
if (clientError) {
  // Handle client initialization errors
}

if (apiError) {
  // Handle API call errors
}

// Clear errors
const handleClearErrors = () => {
  clearApiError();
};
```

## Integration with Auth Context

The hooks automatically integrate with the authentication context:

- Client is only created when user is authenticated
- Access token is automatically included in requests
- Client is destroyed when user logs out
- Loading states reflect authentication status

## Best Practices

1. **Always check if client is ready** before making API calls
2. **Handle loading states** to provide good UX
3. **Implement error handling** for failed API calls
4. **Use the appropriate hook** for your use case:
   - `useEpccClient()` for simple usage
   - `useEpccClientWithState()` for state management
   - `useEpccApi()` for comprehensive API interactions
5. **Clear errors** when appropriate to reset error states
