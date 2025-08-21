"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BulkUploadRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/upload/bulk");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to new URL...</p>
      </div>
    </div>
  );
}
