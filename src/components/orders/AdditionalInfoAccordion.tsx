import React, { useState } from "react";

interface AdditionalInfoAccordionProps {
  additionalInfo: Array<{ key: string; value: string }>;
}

const AdditionalInfoAccordion: React.FC<AdditionalInfoAccordionProps> = ({
  additionalInfo,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!additionalInfo || additionalInfo.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg overflow-hidden">
      {/* Accordion Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-100 transition-colors duration-200 focus:outline-none"
      >
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-3 h-3 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <h4 className="ml-2 text-sm font-semibold text-blue-900">
            Additional Information
          </h4>
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {additionalInfo.length} item{additionalInfo.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Chevron Icon */}
        <div className="flex-shrink-0">
          <svg
            className={`w-4 h-4 text-blue-600 transition-transform duration-200 ${
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
            {additionalInfo.map((info) => (
              <div
                key={info.key}
                className="bg-white rounded-md p-3 shadow-sm border border-blue-100"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                      <dt className="text-xs font-medium text-blue-700 uppercase tracking-wide min-w-0 sm:w-1/3">
                        {info.key}
                      </dt>
                      <dd className="text-sm text-gray-900 font-medium min-w-0 sm:w-2/3 break-words">
                        {info.value}
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

export default AdditionalInfoAccordion;
