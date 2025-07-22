'use client';

import { useState } from 'react';
import { useFocusAFKStore } from '../../../lib/store';

export default function Settings() {
    const { settings, updateSettings, setTheme, setNotifications } = useFocusAFKStore();
    const [localSettings, setLocalSettings] = useState({
        defaultFocusDuration: settings?.defaultFocusDuration || 25,
        defaultBreakDuration: settings?.defaultBreakDuration || 5,
        autoStartBreaks: settings?.autoStartBreaks || false,
        autoStartSessions: settings?.autoStartSessions || false,
        notifications: settings?.notifications || true,
        theme: settings?.theme || 'auto'
    });

    const handleSaveSettings = async () => {
        await updateSettings({
            defaultFocusDuration: localSettings.defaultFocusDuration,
            defaultBreakDuration: localSettings.defaultBreakDuration,
            autoStartBreaks: localSettings.autoStartBreaks,
            autoStartSessions: localSettings.autoStartSessions,
            notifications: localSettings.notifications,
            theme: localSettings.theme as 'light' | 'dark' | 'auto'
        });
        
        // Update theme and notifications in the store
        setTheme(localSettings.theme as 'light' | 'dark' | 'auto');
        setNotifications(localSettings.notifications);
    };

    const handleResetSettings = () => {
        setLocalSettings({
            defaultFocusDuration: 25,
            defaultBreakDuration: 5,
            autoStartBreaks: false,
            autoStartSessions: false,
            notifications: true,
            theme: 'auto'
        });
    };

    return (
        <div className="w-full h-full flex flex-col p-6 overflow-y-auto">
            <h1 className="text-3xl font-bold mb-6">Settings</h1>

            <div className="max-w-2xl space-y-8">
                {/* Timer Settings */}
                <div className="p-6 rounded-lg border shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Timer Settings</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Default Focus Duration (minutes)
                            </label>
                            <input
                                type="number"
                                value={localSettings.defaultFocusDuration}
                                onChange={(e) => setLocalSettings({
                                    ...localSettings,
                                    defaultFocusDuration: parseInt(e.target.value) || 25
                                })}
                                className="w-full p-2 border rounded-md"
                                min="1"
                                max="120"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Default Break Duration (minutes)
                            </label>
                            <input
                                type="number"
                                value={localSettings.defaultBreakDuration}
                                onChange={(e) => setLocalSettings({
                                    ...localSettings,
                                    defaultBreakDuration: parseInt(e.target.value) || 5
                                })}
                                className="w-full p-2 border rounded-md"
                                min="1"
                                max="30"
                            />
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium">Auto-start breaks</label>
                                <p className="text-xs text-gray-500">Automatically start break timer after focus sessions</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={localSettings.autoStartBreaks}
                                onChange={(e) => setLocalSettings({
                                    ...localSettings,
                                    autoStartBreaks: e.target.checked
                                })}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium">Auto-start sessions</label>
                                <p className="text-xs text-gray-500">Automatically start focus timer after breaks</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={localSettings.autoStartSessions}
                                onChange={(e) => setLocalSettings({
                                    ...localSettings,
                                    autoStartSessions: e.target.checked
                                })}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="p-6 rounded-lg border shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Notifications</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium">Enable notifications</label>
                                <p className="text-xs text-gray-500">Get notified when focus sessions complete</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={localSettings.notifications}
                                onChange={(e) => setLocalSettings({
                                    ...localSettings,
                                    notifications: e.target.checked
                                })}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                        </div>
                        
                        {localSettings.notifications && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    💡 Make sure to allow notifications in your browser settings for the best experience.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Theme Settings */}
                <div className="p-6 rounded-lg border shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Appearance</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Theme</label>
                            <select
                                value={localSettings.theme}
                                onChange={(e) => setLocalSettings({
                                    ...localSettings,
                                    theme: e.target.value as 'light' | 'dark' | 'auto'
                                })}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="auto">Auto (System)</option>
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Data Management */}
                <div className="p-6 rounded-lg border shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Data Management</h2>
                    <div className="space-y-4">
                        <div className="p-3 bg-yellow-50 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                ⚠️ All data is stored locally in your browser. Clearing browser data will remove all your tasks, goals, and settings.
                            </p>
                        </div>
                        
                        <div className="flex gap-4">
                            <button
                                onClick={handleResetSettings}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                            >
                                Reset to Defaults
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm('This will clear all your data. Are you sure?')) {
                                        // Clear IndexedDB
                                        indexedDB.deleteDatabase('FocusAFKDatabase');
                                        window.location.reload();
                                    }
                                }}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                            >
                                Clear All Data
                            </button>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSaveSettings}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}