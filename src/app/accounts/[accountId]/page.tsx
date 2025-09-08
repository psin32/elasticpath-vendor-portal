"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useEpccApi } from "../../../hooks/useEpccApi";
import { useRouter, useParams } from "next/navigation";
import { useDashboard } from "../../../hooks/useDashboard";
import { useToast } from "@/contexts/ToastContext";
import { AccountMember, AccountMembership } from "@elasticpath/js-sdk";

interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}

export default function AccountDetailPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const accountId = params.accountId as string;

  const [accountMember, setAccountMember] = useState<AccountMember | null>(
    null
  );
  const [accountMemberships, setAccountMemberships] = useState<
    AccountMembership[]
  >([]);
  const [membershipsWithAccounts, setMembershipsWithAccounts] = useState<any[]>(
    []
  );
  const [loadingData, setLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    per_page: 25,
  });
  const { showToast } = useToast();

  // Use the same dashboard state management
  const { selectedOrgId, selectedStoreId } = useDashboard();

  const { fetchAccountMembers, fetchAccountMemberships } = useEpccApi(
    selectedOrgId || undefined,
    selectedStoreId || undefined
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, loading, router]);

  // Load account data when component mounts or accountId changes
  useEffect(() => {
    if (accountId && selectedStoreId) {
      loadAccountData();
    }
  }, [accountId, selectedStoreId]);

  const loadAccountData = async () => {
    if (!selectedStoreId || !accountId) return;

    setLoadingData(true);

    try {
      // First, get all account members to find the specific one
      const accountsData = await fetchAccountMembers({
        page: 0,
        limit: 25, // Get all to find the specific account
      });

      if (accountsData?.data) {
        const foundAccount = accountsData.data.find(
          (account: AccountMember) => account.id === accountId
        );
        if (foundAccount) {
          setAccountMember(foundAccount);
        } else {
          showToast("Account not found", "error");
          router.push("/accounts");
          return;
        }
      }

      // Then fetch account memberships for this account member
      const membershipsData = await fetchAccountMemberships(accountId);
      if (membershipsData?.data) {
        setAccountMemberships(membershipsData.data);

        // Combine memberships with their account data
        const combinedData = membershipsData.data.map((membership: any) => {
          const accountRelationshipId =
            membership.relationships?.account?.data?.id;
          let accountData = null;

          if (accountRelationshipId && membershipsData.included?.accounts) {
            accountData = membershipsData.included.accounts.find(
              (account: any) => account.id === accountRelationshipId
            );
          }

          return {
            ...membership,
            account: accountData,
          };
        });

        setMembershipsWithAccounts(combinedData);

        const totalCount = membershipsData.meta?.results?.total || 0;
        const totalPages = Math.ceil(totalCount / paginationInfo.per_page);

        setPaginationInfo({
          current_page: currentPage,
          total_pages: totalPages,
          total_count: totalCount,
          per_page: paginationInfo.per_page,
        });
      }
    } catch (err) {
      showToast("Failed to load account data", "error");
      console.error("Error loading account data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const filteredMemberships = membershipsWithAccounts.filter(
    (membership: any) =>
      membership.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      membership.account?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      membership.account?.legal_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      membership.account?.registration_id
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      membership.account?.external_ref
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (membership as any).attributes?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (membership as any).attributes?.status
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-primary-600 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="flex flex-1">
        <main className="flex-1 overflow-auto bg-white">
          <div className="p-6 bg-white">
            <div className="w-full">
              {/* Back Button */}
              <div className="mb-6">
                <button
                  onClick={() => router.push("/accounts")}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back to Accounts
                </button>
              </div>

              {/* Account Member Information */}
              {accountMember && (
                <div className="mb-8 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">
                      Account Member Details
                    </h2>
                  </div>
                  <div className="px-6 py-4">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Member ID
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 font-mono">
                          {accountMember.id}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Name
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {(accountMember as any)?.name || "N/A"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Email
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {(accountMember as any)?.email || "N/A"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Created
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {(accountMember as any).attributes?.created_at ||
                          (accountMember as any).meta?.timestamps?.created_at
                            ? formatDate(
                                (accountMember as any).attributes?.created_at ||
                                  (accountMember as any).meta?.timestamps
                                    ?.created_at
                              )
                            : "N/A"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}

              {/* Account Memberships List */}
              {loadingData ? (
                <div className="text-center py-12">
                  <svg
                    className="animate-spin h-8 w-8 text-indigo-600 mx-auto"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <p className="mt-2 text-gray-600">Loading memberships...</p>
                </div>
              ) : !selectedStoreId ? (
                <div className="text-center py-12">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-yellow-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-yellow-800">
                          Please select an organization and store to view
                          memberships
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : filteredMemberships.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No account memberships found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm
                      ? "Try adjusting your search terms."
                      : "No account memberships or associated accounts found for this account member."}
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Account Memberships & Associated Accounts
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      View all account memberships and their associated account
                      details
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-white">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Account Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Legal Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Registration ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            External Ref
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredMemberships.map((membership) => (
                          <tr key={membership.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {membership.account?.name || "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {membership.account?.legal_name || "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {membership.account?.registration_id || "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {membership.account?.external_ref || "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {membership.meta?.timestamps?.created_at
                                  ? formatDate(
                                      membership.meta.timestamps.created_at
                                    )
                                  : "-"}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
