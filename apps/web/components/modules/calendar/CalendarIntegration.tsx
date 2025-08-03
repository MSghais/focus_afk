'use client';

import { useState } from 'react';
import GoogleCalendarConnect from './GoogleCalendarConnect';
import GoogleCalendarManager from './GoogleCalendarManager';

export default function CalendarIntegration() {
  const [activeTab, setActiveTab] = useState<'connect' | 'manage'>('connect');

  return (
    <div className="w-full h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('connect')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'connect'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Connect Calendar
        </button>
        <button
          onClick={() => setActiveTab('manage')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'manage'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Manage Events
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === 'connect' ? (
          <GoogleCalendarConnect />
        ) : (
          <GoogleCalendarManager />
        )}
      </div>
    </div>
  );
} 