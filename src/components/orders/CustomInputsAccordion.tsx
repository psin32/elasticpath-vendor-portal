import React, { useState } from "react";

interface CustomInputsAccordionProps {
  customInputs: Record<string, any>;
  excludeKeys?: string[]; // Keys to exclude from display
}

const CustomInputsAccordion: React.FC<CustomInputsAccordionProps> = ({
  customInputs,
  excludeKeys = ["additional_information"], // Default to exclude additional_information
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Filter out excluded keys and convert to key-value pairs
  const filteredInputs = React.useMemo(() => {
    if (!customInputs || typeof customInputs !== "object") {
      return [];
    }

    return Object.entries(customInputs)
      .filter(([key]) => !excludeKeys.includes(key))
      .map(([key, value]) => ({
        key,
        value:
          typeof value === "object"
            ? JSON.stringify(value, null, 2)
            : String(value || ""),
      }))
      .filter(
        ({ value }) =>
          value.trim() !== "" && value !== "null" && value !== "undefined"
      );
  }, [customInputs, excludeKeys]);

  // Don't render if no custom inputs to show
  if (filteredInputs.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg overflow-hidden">
      {/* Accordion Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-green-100 transition-colors duration-200 focus:outline-none"
      >
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-3 h-3 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
          <h4 className="ml-2 text-sm font-semibold text-green-900">
            Custom Inputs
          </h4>
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {filteredInputs.length} field
            {filteredInputs.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Chevron Icon */}
        <div className="flex-shrink-0">
          <svg
            className={`w-4 h-4 text-green-600 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Accordion Content */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen
            ? "max-h-screen opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="px-4 pb-4">
          <div className="space-y-3 pt-2">
            {filteredInputs.map((input, index) => (
              <div
                key={`${input.key}-${index}`}
                className="bg-white rounded-md p-3 shadow-sm border border-green-100"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                      <dt className="text-xs font-medium text-green-700 uppercase tracking-wide min-w-0 sm:w-1/3 flex-shrink-0">
                        {input.key.replace(/_/g, " ")}
                      </dt>
                      <dd className="text-sm text-gray-900 font-medium min-w-0 sm:w-2/3 break-words">
                        {/* Handle JSON objects with proper formatting */}
                        {input.value.startsWith("{") ||
                        input.value.startsWith("[") ? (
                          <pre className="text-xs bg-gray-50 p-2 rounded border overflow-x-auto whitespace-pre-wrap font-mono">
                            {input.value}
                          </pre>
                        ) : (
                          <span>{input.value}</span>
                        )}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomInputsAccordion;
