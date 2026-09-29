"use client";

import { useSlidingIndicator } from "@/hooks/useSlidingIndicator";

export type TabItem = { key: string; label: string };

type Props = {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
  id?: string;
};

/** Pill-style filter tabs with a sliding indicator behind the active one. */
export default function Tabs({ tabs, active, onChange, id }: Props) {
  const { ref, style } = useSlidingIndicator<HTMLDivElement>(active);

  return (
    <div className="tabs" id={id} role="tablist" ref={ref}>
      <span className="tab-indicator" aria-hidden="true" style={style} />
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            className={isActive ? "tab is-active" : "tab"}
            aria-selected={isActive}
            data-active={isActive}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
