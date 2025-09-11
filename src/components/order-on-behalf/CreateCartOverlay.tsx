"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { PlusIcon, ShoppingCartIcon } from "@heroicons/react/24/outline";

interface CreateCartOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCart: (cartName: string, cartDescription: string) => Promise<void>;
  isLoading?: boolean;
}

export default function CreateCartOverlay({
  isOpen,
  onClose,
  onCreateCart,
  isLoading = false,
}: CreateCartOverlayProps) {
  const [cartName, setCartName] = useState("");
  const [cartDescription, setCartDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cartName.trim()) return;

    await onCreateCart(cartName.trim(), cartDescription.trim());
    setCartName("");
    setCartDescription("");
  };

  const handleClose = () => {
    setCartName("");
    setCartDescription("");
    onClose();
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ShoppingCartIcon
                      className="h-6 w-6 text-indigo-600"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-base font-semibold leading-6 text-gray-900"
                    >
                      Create New Cart
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Create a new shopping cart for organizing your items.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-6">
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="cartName"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Cart Name *
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="cartName"
                          value={cartName}
                          onChange={(e) => setCartName(e.target.value)}
                          className="block w-full px-4 py-3 text-base rounded-lg border border-gray-300 shadow-sm placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                          placeholder="Enter cart name"
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="cartDescription"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Description (Optional)
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="cartDescription"
                          value={cartDescription}
                          onChange={(e) => setCartDescription(e.target.value)}
                          rows={4}
                          className="block w-full px-4 py-3 text-base rounded-lg border border-gray-300 shadow-sm placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed resize-none"
                          placeholder="Enter cart description"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading || !cartName.trim()}
                    >
                      {isLoading ? (
                        <>
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
                        </>
                      ) : (
                        <>
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Create Cart
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={handleClose}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
