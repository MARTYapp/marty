

import type { ReactNode, RefObject } from "react";

export type PanelKey =
  | "what-this-is"
  | "how-to-use-this"
  | "privacy"
  | "give-feedback";

export type MenuItem = {
  label: string;
  description: string;
  content: ReactNode;
};

type MartyMenuProps = {
  menuOpen: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  menuItems: Record<PanelKey, MenuItem>;
  onToggleMenu: () => void;
  onOpenPanel: (panel: PanelKey) => void;
};

export default function MartyMenu({
  menuOpen,
  menuRef,
  menuItems,
  onToggleMenu,
  onOpenPanel,
}: MartyMenuProps) {
  return (
    <div ref={menuRef} className="relative z-70">
      <button
        onClick={onToggleMenu}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/4.5 text-blue-200 transition hover:border-white/14 hover:bg-white/8 hover:text-white"
        aria-label="Open MARTY menu"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
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
          <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
        </svg>
      </button>

      {menuOpen && (
        <div
          className="absolute right-0 top-[calc(100%+0.75rem)] z-75 w-70 overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(13,18,30,0.98)_0%,rgba(8,12,21,0.98)_100%)] p-2 shadow-[0_20px_80px_rgba(0,0,0,0.52),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl"
          role="menu"
        >
          {(
            [
              "what-this-is",
              "how-to-use-this",
              "privacy",
              "give-feedback",
            ] as PanelKey[]
          ).map((itemKey) => {
            const item = menuItems[itemKey];

            return (
              <button
                key={itemKey}
                onClick={() => onOpenPanel(itemKey)}
                className="flex w-full items-start justify-between gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-white/6"
                role="menuitem"
                type="button"
              >
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-white/45">
                    {item.description}
                  </p>
                </div>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="mt-0.5 h-4 w-4 shrink-0 text-white/35"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m9 6 6 6-6 6"
                  />
                </svg>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}