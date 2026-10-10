"use client";

import type { ReactNode } from "react";
import { useSlidingIndicator } from "@/hooks/useSlidingIndicator";

export type TabItem = {
  key: string;
  label: string;
  /** Shown instead of the label on narrow screens. */
  icon?: ReactNode;
  count?: number;
};

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
            aria-label={tab.icon ? tab.label : undefined}
            title={tab.icon ? tab.label : undefined}
            data-active={isActive}
            data-icon={tab.icon ? "true" : undefined}
            onClick={() => onChange(tab.key)}
          >
            {tab.icon && (
              <span className="tab-icon" aria-hidden="true">
                {tab.icon}
              </span>
            )}
            <span className="tab-label">{tab.label}</span>
            {tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
