"use client";

import { useState } from "react";
import { OrderItem } from "@elasticpath/js-sdk";

interface OrderItemPromotionsProps {
  item: OrderItem;
  promotions: any[];
}

export function OrderItemPromotions({
  item,
  promotions,
}: OrderItemPromotionsProps) {
  const [hoveredPromotion, setHoveredPromotion] = useState<string | null>(null);

  // Get discounts from the order item
  const itemDiscounts = item.discounts || [];

  if (itemDiscounts.length === 0) {
    return null;
  }
  // Format promotions data
  const appliedPromotions = itemDiscounts.map((discount: any) => {
    // Find the promotion that matches this discount ID
    const promotion = promotions.find((promo: any) => promo.id === discount.id);

    return {
      id: discount.id,
      promotionName:
        promotion?.attributes?.name ||
        promotion?.name ||
        `Promotion ${discount.id}`,
      promotionDescription:
        promotion?.attributes?.description || promotion?.description || "",
      amount: {
        amount: discount.amount.amount,
        currency: discount.amount.currency || "USD",
      },
    };
  });

  return (
    <div className="mt-2 relative">
      <div className="text-xs text-indigo-600 font-medium mb-2">
        Applied Promotions:
      </div>
      <div className="flex flex-wrap gap-1">
        {appliedPromotions.map((appliedPromotion) => (
          <span
            key={appliedPromotion.id}
            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-600 cursor-pointer relative group"
            onMouseEnter={() => setHoveredPromotion(appliedPromotion.id)}
            onMouseLeave={() => setHoveredPromotion(null)}
          >
            {appliedPromotion.promotionName}
            {hoveredPromotion === appliedPromotion.id && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-3 bg-white border border-gray-200 text-gray-800 text-xs rounded-xl shadow-2xl z-50 w-80 animate-in fade-in-0 zoom-in-95 duration-200">
                <div className="font-semibold text-indigo-600 mb-1">
                  {appliedPromotion.promotionName}
                </div>
                <div className="text-gray-600 leading-relaxed mb-2">
                  {appliedPromotion.promotionDescription ||
                    "No description available"}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-gray-500 font-medium">
                    Discount Amount:
                  </span>
                  <span className="font-semibold text-red-600">
                    {new Intl.NumberFormat("en", {
                      style: "currency",
                      currency: appliedPromotion.amount.currency,
                    }).format((appliedPromotion.amount.amount || 0) / 100)}
                  </span>
                </div>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-white"></div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-gray-200 -mt-px"></div>
              </div>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
