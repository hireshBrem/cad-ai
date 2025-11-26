import { ToolCardProps, ToolVariant } from "@/types/app";

const toolVariantStyles: Record<
  ToolVariant,
  { badge: string; accent: string; border: string; description: string }
> = {
  call: {
    badge: "bg-purple-100 text-purple-700",
    accent: "text-purple-600",
    border: "border-purple-200",
    description: "Tool Call Input",
  },
  result: {
    badge: "bg-green-100 text-green-700",
    accent: "text-green-600",
    border: "border-green-200",
    description: "Tool Result Output",
  },
};

const ToolCard = ({ toolName, variant, payload, label }: ToolCardProps) => {
  const styles = toolVariantStyles[variant];
  return (
    <div className={`rounded-2xl border ${styles.border} bg-white/95 shadow-sm`}>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex flex-col">
          <p className="text-sm font-semibold text-gray-900">{toolName}</p>
          <p className="text-[11px] uppercase tracking-wide text-gray-500">
            {label ?? styles.description}
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles.badge}`}
        >
          {variant === "call" ? "Input" : "Output"}
        </span>
      </div>
      {payload !== undefined ? (
        <pre className="text-xs text-gray-700 max-h-52 overflow-auto whitespace-pre-wrap px-4 py-3">
          {JSON.stringify(payload, null, 2)}
        </pre>
      ) : (
        <div className="px-4 py-3 text-xs text-gray-500 italic">
          No data returned.
        </div>
      )}
    </div>
  );
};

export default ToolCard;
