'use client';

import { ToolCardProps, ToolVariant } from "@/types/app";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

const toolVariantStyles: Record<
  ToolVariant,
  {
    badge: string
    border: string
    headerBg: string
    description: string
  }
> = {
  call: {
    badge: "bg-gray-100 text-gray-700 border border-gray-200",
    border: "border-gray-200",
    headerBg: "bg-gray-50/50",
    description: "Tool Invocation",
  },
  result: {
    badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    border: "border-emerald-200",
    headerBg: "bg-emerald-50/40",
    description: "Tool Response",
  },
};

const ToolCard = ({ toolName, variant, payload, label }: ToolCardProps) => {
  const [isOpen, setIsOpen] = useState(variant === "result");
  const styles = toolVariantStyles[variant];
  const isCallVariant = variant === "call";
    console.log('toolName', toolName);
    console.log('variant', variant);
    console.log('payload', payload);
    console.log('label', label);
  return (
    <div className="group/card relative">
      <div className={`relative rounded-xl border ${styles.border} bg-white transition-all duration-300 overflow-hidden`}>
        {/* Header */}
        <button
          onClick={() => isCallVariant && setIsOpen(!isOpen)}
          disabled={!isCallVariant}
          className={`w-full flex items-center justify-between px-4 py-3 ${styles.headerBg} transition-colors duration-300 ${
            isCallVariant ? "hover:bg-gray-100/50 cursor-pointer" : "cursor-default"
          }`}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {isCallVariant && (
              <ChevronDownIcon
                className={`w-4 h-4 text-gray-600 flex-shrink-0 transition-transform duration-200 ${
                  isOpen ? "rotate-0" : "-rotate-90"
                }`}
              />
            )}
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">text-to-cad: {toolName}</p>
              <p className="text-xs text-gray-500 font-medium tracking-wide"></p>
            </div>
          </div>

          <span className={`ml-2 flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${styles.badge} whitespace-nowrap`}>
            {variant === "call" ? "Input" : "Output"}
          </span>
        </button>

        {/* Content - Only show for open call or always for results */}
        {(isOpen || !isCallVariant) && (
          <div className="relative border-t border-gray-100/50">
            {payload !== undefined ? (
              <pre className="tool-card-scrollbar text-xs text-gray-700 max-h-56 overflow-auto whitespace-pre-wrap px-4 py-3 font-mono bg-gray-50/30 leading-relaxed">
                {JSON.stringify(payload, null, 2)}
              </pre>
            ) : (
              <div className="px-4 py-4 text-xs text-gray-400 font-medium italic flex items-center justify-center min-h-12">
                ∅ No data
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolCard;
