"use client";

import React, { useState, useEffect } from "react";
import { useEpccApi } from "../../hooks/useEpccApi";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";

interface OrderNote {
  id: string;
  type: string;
  order_id: string;
  note: string;
  private: boolean;
  added_by?: string;
  meta: {
    timestamps: {
      created_at: string;
      updated_at: string;
    };
  };
}

interface OrderNotesProps {
  orderId: string;
  selectedOrgId?: string;
  selectedStoreId?: string;
}

export default function OrderNotes({
  orderId,
  selectedOrgId,
  selectedStoreId,
}: OrderNotesProps) {
  const [notes, setNotes] = useState<OrderNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const { showToast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const { fetchOrderNotes, createOrderNote } = useEpccApi(
    selectedOrgId,
    selectedStoreId
  );

  // Fetch notes when component mounts or orderId changes
  useEffect(() => {
    if (orderId) {
      loadNotes();
    }
  }, [orderId]);

  const loadNotes = async () => {
    if (!orderId) return;

    setLoading(true);
    try {
      const response = await fetchOrderNotes(orderId);
      if (response?.data) {
        setNotes(response.data);
      } else {
        setNotes([]);
      }
    } catch (error) {
      console.error("Error loading notes:", error);
      showToast("Failed to load notes", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNote.trim()) {
      showToast("Please enter a note", "error");
      return;
    }

    setCreating(true);
    try {
      console.log("Current user object:", user);
      console.log("Is authenticated:", isAuthenticated);

      let addedBy = "Unknown User";
      if (user) {
        addedBy = user.data.name || user.data.email || "Unknown User";
      }

      console.log("Added by:", addedBy);
      const response = await createOrderNote(
        orderId,
        newNote.trim(),
        addedBy,
        isPrivate
      );
      if (response?.data) {
        showToast("Note created successfully", "success");
        setNewNote("");
        setIsPrivate(false);
        setShowAddForm(false);
        // Refresh the notes list
        await loadNotes();
      } else {
        showToast("Failed to create note", "error");
      }
    } catch (error) {
      console.error("Error creating note:", error);
      showToast("Failed to create note", "error");
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Order Notes</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Note
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Add Note Form */}
        {showAddForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="mb-4">
              <label
                htmlFor="newNote"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Add a new note
              </label>
              <textarea
                id="newNote"
                rows={3}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter your note here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  <span className="font-medium">Private note</span> - Internal
                  use only, not visible to customer
                </span>
              </label>
              {!isPrivate && (
                <p className="mt-1 text-xs text-blue-600">
                  <svg
                    className="inline w-3 h-3 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  This note will be visible to the customer
                </p>
              )}
              {isPrivate && (
                <p className="mt-1 text-xs text-orange-600">
                  <svg
                    className="inline w-3 h-3 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  This note is for internal use only
                </p>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewNote("");
                  setIsPrivate(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNote}
                disabled={creating || !newNote.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Creating...
                  </div>
                ) : (
                  "Create Note"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Notes List */}
        {loading ? (
          <div className="text-center py-8">
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
            <p className="mt-2 text-sm text-gray-600">Loading notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notes</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding a note to this order.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className={`border rounded-lg p-4 transition-colors ${
                  note.private
                    ? "border-orange-200 bg-orange-50 hover:bg-orange-100"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {note.note}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        {note.added_by && (
                          <span>
                            Added by{" "}
                            <span className="font-medium text-gray-700">
                              {note.added_by}
                            </span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {formatDate(note.meta.timestamps.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    {note.private ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Private
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Public
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
