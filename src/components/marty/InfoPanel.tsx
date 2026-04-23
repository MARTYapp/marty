

import type { MenuItem, PanelKey } from "./MartyMenu";

type InfoPanelProps = {
  activePanel: PanelKey | null;
  menuItems: Record<PanelKey, MenuItem>;
  onClose: () => void;
};

export default function InfoPanel({
  activePanel,
  menuItems,
  onClose,
}: InfoPanelProps) {
  if (!activePanel) return null;

  const item = menuItems[activePanel];

  return (
    <div className="absolute inset-0 z-80 flex items-start justify-center bg-[#03050b]/72 px-4 py-6 backdrop-blur-md sm:px-6 sm:py-8">
      <div className="w-full max-w-xl overflow-hidden rounded-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(12,17,29,0.98)_0%,rgba(8,12,21,0.98)_100%)] shadow-[0_24px_100px_rgba(0,0,0,0.56),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-5 sm:px-6">
          <div>
            <p className="bg-linear-to-r from-blue-200 via-blue-300 to-blue-500 bg-clip-text text-[11px] font-medium uppercase tracking-[0.28em] text-transparent">
              MARTY
            </p>
            <h2 className="mt-3 text-2xl font-semibold leading-tight text-white">
              {item.label}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/48">
              {item.description}
            </p>
          </div>

          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/4.5 text-blue-200 transition hover:border-white/14 hover:bg-white/8 hover:text-white"
            aria-label="Close panel"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" d="M6 6l12 12" />
              <path strokeLinecap="round" d="M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 px-5 py-5 text-[15px] leading-7 text-white/82 sm:px-6 sm:py-6 sm:text-base">
          {item.content}
        </div>
      </div>
    </div>
  );
}