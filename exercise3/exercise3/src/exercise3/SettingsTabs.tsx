import React, { useCallback, useEffect, useRef } from 'react';

export const SETTINGS_TABS = [
  { id: 'profile' as const, label: 'Profile' },
  { id: 'notifications' as const, label: 'Notifications' },
  { id: 'privacy' as const, label: 'Privacy' },
  { id: 'appearance' as const, label: 'Appearance' },
] as const;

export type SettingsTabId = (typeof SETTINGS_TABS)[number]['id'];

export type SettingsTabsProps = {
  activeTab: SettingsTabId;
  onTabChange: (tab: SettingsTabId) => void;
};

export function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTab = useCallback((index: number) => {
    const el = tabRefs.current[index];
    el?.focus();
  }, []);

  useEffect(() => {
    tabRefs.current = tabRefs.current.slice(0, SETTINGS_TABS.length);
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = SETTINGS_TABS.length - 1;
    let nextIndex = index;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = index === last ? 0 : index + 1;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = index === 0 ? last : index - 1;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = last;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextTab = SETTINGS_TABS[nextIndex];
    onTabChange(nextTab.id);
    focusTab(nextIndex);
  };

  return (
    <div className="border-b border-slate-200 dark:border-slate-700">
      <div
        role="tablist"
        aria-label="Settings categories"
        className="-mb-px flex gap-1 overflow-x-auto pb-px sm:gap-2"
      >
        {SETTINGS_TABS.map((tab, index) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={el => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`settings-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`settings-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={e => onKeyDown(e, index)}
              className={[
                'whitespace-nowrap rounded-t-md px-3 py-2.5 text-sm font-medium transition-colors sm:px-4',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-slate-900',
                selected
                  ? 'border border-b-0 border-slate-200 bg-white text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-indigo-300'
                  : 'border border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100',
              ].join(' ')}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
