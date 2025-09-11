"use client";

import { useState, useEffect } from "react";
import { useEpccApi } from "@/hooks/useEpccApi";
import { useDashboard } from "@/hooks/useDashboard";
import { useToast } from "@/contexts/ToastContext";
import OrdersList from "@/components/orders/OrdersList";
import { Order } from "@elasticpath/js-sdk";

interface OrdersComponentProps {
  selectedAccountToken: string;
  accountId: string;
}

// Cast function to handle SDK type mismatch
const castToOrder = (sdkOrder: any): Order => {
  return sdkOrder as Order;
};

export default function OrdersComponent({
  selectedAccountToken,
  accountId,
}: OrdersComponentProps) {
  const { selectedOrgId, selectedStoreId } = useDashboard();
  const { fetchAccountOrders } = useEpccApi(
    selectedOrgId || undefined,
    selectedStoreId || undefined
  );
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedAccountToken && accountId) {
      loadOrders();
    }
  }, [selectedAccountToken, selectedOrgId, selectedStoreId, accountId]);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAccountOrders(
        accountId,
        selectedAccountToken,
        selectedOrgId || "",
        selectedStoreId || ""
      );

      if (response?.data) {
        const ordersArray = (response.data || []).map(castToOrder);
        setOrders(ordersArray);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load orders";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}

      {/* Orders List */}
      <OrdersList
        orders={orders}
        loading={loading}
        error={error}
        onRefresh={loadOrders}
        title="Account Orders"
        subtitle="Orders for this account"
        emptyMessage="No orders found for this account"
        emptySubMessage="Orders will appear here once they are placed."
        showPagination={false}
      />
    </div>
  );
}
