import React from 'react';
import { Button } from './atoms/Button';

interface Tab<T extends string> {
    id: T;
    label: string;
    icon: React.ReactNode;
}

interface TabGroupProps<T extends string> {
    tabs: readonly Tab<T>[];
    activeTab: T;
    onTabChange: (tabId: T) => void;
}

export function TabGroup<T extends string>({
    tabs,
    activeTab,
    onTabChange,
}: TabGroupProps<T>) {
    return (
        <div className="w-full flex p-1 gap-0.5 border-b border-zinc-800">
            {tabs.map((tab) => (
                <Button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex w-full rounded-b-none items-center border-radius-lg space-x-2 px-4 py-2 text-sm font-medium transition-colors`}
                    variant={activeTab === tab.id
                        ? 'primary'
                        : 'secondary'
                    }
                >
                    {tab.icon}
                    <span>{tab.label}</span>
                </Button>
            ))}
        </div>
    );
} 