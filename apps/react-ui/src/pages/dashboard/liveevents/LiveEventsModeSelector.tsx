import clsx from "clsx";
import { type LiveEventsMode } from "./types";

type LiveEventsModeSelectorProps = {
  mode: LiveEventsMode;
  onChange: (nextMode: LiveEventsMode) => void;
};

const baseButtonClass = "rounded-md px-2 py-1 text-[0.68rem] font-semibold transition-colors";

export default function LiveEventsModeSelector({ mode, onChange }: LiveEventsModeSelectorProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-gray-100 p-1">
      <button
        type="button"
        onClick={() => onChange("table")}
        className={clsx(
          baseButtonClass,
          mode === "table"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:bg-gray-200"
        )}
      >
        Table
      </button>
      <button
        type="button"
        onClick={() => onChange("bowl")}
        className={clsx(
          baseButtonClass,
          mode === "bowl"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:bg-gray-200"
        )}
      >
        Bowl
      </button>
    </div>
  );
}
