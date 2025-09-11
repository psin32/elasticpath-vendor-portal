"use client";

import { useState, Fragment, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useCartContext } from "@/contexts/CartContext";
import { useToast } from "@/contexts/ToastContext";

interface AddCartCustomDiscountProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddCartCustomDiscount({
  isOpen,
  onClose,
}: AddCartCustomDiscountProps) {
  const { updateCartCustomDiscount } = useCartContext();
  const { showToast } = useToast();
  const cancelButtonRef = useRef(null);
  const [loadingCustomDiscount, setLoadingCustomDiscount] = useState(false);

  const handleCustomDiscount = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    setLoadingCustomDiscount(true);
    event.preventDefault();

    const form = new FormData(event.target as HTMLFormElement);
    const amount = form.get("amount");
    const description = form.get("description");

    if (!amount || !description) {
      showToast("Please fill in all fields", "error");
      setLoadingCustomDiscount(false);
      return;
    }

    // Get username from local storage
    let username = "Admin User"; // Default fallback
    try {
      const epccUser = localStorage.getItem("epcc_user");
      if (epccUser) {
        const userData = JSON.parse(epccUser);
        username =
          userData.data?.name + "(" + userData.data?.email + ")" ||
          "Admin User";
      }
    } catch (error) {
      console.error("Error parsing epcc_user from localStorage:", error);
    }

    try {
      await updateCartCustomDiscount({
        amount: Number(amount),
        description: description.toString(),
        username: username,
      });

      showToast("Custom discount applied successfully", "success");
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to apply custom discount";
      showToast(errorMessage, "error");
      console.error("Error applying custom discount:", err);
    } finally {
      setLoadingCustomDiscount(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        initialFocus={cancelButtonRef}
        onClose={onClose}
      >
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

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
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
                <div className="isolate bg-white">
                  <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                      Apply Cart Level Discount
                    </h2>
                    <p className="text-sm text-gray-500">
                      Apply a discount to the entire cart.
                    </p>
                  </div>
                  <form
                    action="#"
                    method="POST"
                    className="mx-auto mt-10 max-w-xl sm:mt-10"
                    onSubmit={handleCustomDiscount}
                  >
                    <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="amount"
                          className="block text-sm font-semibold leading-6 text-gray-900"
                        >
                          Amount
                        </label>
                        <div className="mt-2.5">
                          <input
                            type="number"
                            name="amount"
                            id="amount"
                            required
                            className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6"
                          />
                        </div>
                        <p className="text-[10px] leading-6 text-gray-600">
                          Enter amount multiplied by 100 e.g. £10.99 should be
                          1099
                        </p>
                      </div>
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="description"
                          className="block text-sm font-semibold leading-6 text-gray-900"
                        >
                          Description
                        </label>
                        <div className="mt-2.5">
                          <input
                            type="text"
                            name="description"
                            id="description"
                            required
                            className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-10 flex gap-3">
                      <button
                        type="button"
                        ref={cancelButtonRef}
                        onClick={onClose}
                        className="flex-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loadingCustomDiscount}
                        className="flex-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingCustomDiscount ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
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
                            Adding...
                          </>
                        ) : (
                          "Add Discount"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
