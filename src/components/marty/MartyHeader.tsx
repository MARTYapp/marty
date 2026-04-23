

import MartyMenu, { PanelKey, MenuItem } from "./MartyMenu";

import type { RefObject } from "react";

type MartyHeaderProps = {
  onOpenSidebar: () => void;
  menuOpen: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  menuItems: Record<PanelKey, MenuItem>;
  onToggleMenu: () => void;
  onOpenPanel: (panel: PanelKey) => void;
};

export default function MartyHeader({
  onOpenSidebar,
  menuOpen,
  menuRef,
  menuItems,
  onToggleMenu,
  onOpenPanel,
}: MartyHeaderProps) {
  return (
    <header className="relative z-20 shrink-0 border-b border-white/8 bg-black/10 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="flex items-center justify-between gap-3">
        {/* LEFT SIDE */}
        <div className="flex items-center gap-3">
          {/* Sidebar button (mobile) */}
          <button
            onClick={onOpenSidebar}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/4.5 text-blue-200 transition hover:bg-white/8 hover:text-white lg:hidden"
            aria-label="Open recents"
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
              <path strokeLinecap="round" d="M4 7h16" />
              <path strokeLinecap="round" d="M4 12h16" />
              <path strokeLinecap="round" d="M4 17h16" />
            </svg>
          </button>

          {/* Branding */}
          <div>
            <span className="bg-linear-to-r from-blue-200 via-blue-300 to-blue-500 bg-clip-text text-sm font-bold uppercase tracking-[0.35em] text-transparent">
              MARTY
            </span>
            <p className="mt-1 text-xs tracking-[0.08em] text-white/48 sm:text-sm">
              Not therapy. Not journaling. Not vibes.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE (MENU) */}
        <MartyMenu
          menuOpen={menuOpen}
          menuRef={menuRef}
          menuItems={menuItems}
          onToggleMenu={onToggleMenu}
          onOpenPanel={onOpenPanel}
        />
      </div>
    </header>
  );
}