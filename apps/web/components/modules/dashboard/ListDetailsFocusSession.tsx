'use client';

import React from 'react';
import { useFocusAFKStore } from '../../../store/store';
import { formatTime } from '../../../lib/format';

interface ListFocusSessionProps {
  limit?: number;
  showSyncStatus?: boolean;
}

export default function ListDetailsFocusSession({ limit = 5, showSyncStatus = true }: ListFocusSessionProps) {
  const { timerSessions } = useFocusAFKStore();

  // Sort sessions by start time (most recent first)
  const sortedSessions = [...timerSessions]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, limit);

  if (sortedSessions.length === 0) {
    return (
      <div className="rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-3">Recent Focus Sessions</h3>
        <div className="text-gray-500 text-center py-8">
          <div className="text-4xl mb-2">⏱️</div>
          <p>No focus sessions yet</p>
          <p className="text-sm">Start a timer to see your sessions here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3">Recent Focus Sessions</h3>
      <div className="space-y-3">
        {sortedSessions.map((session) => (
          <div
            key={`${session.id}-${session.backendId || 'local'}`}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-block w-3 h-3 rounded-full ${
                  session.type === 'focus' ? 'bg-blue-500' :
                  session.type === 'break' ? 'bg-green-500' :
                  'bg-purple-500'
                }`}></span>
                <span className="font-medium text-sm capitalize">
                  {session.type} Session
                </span>
                {showSyncStatus && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    session.syncedToBackend 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {session.syncedToBackend ? '☁️ Synced' : '📱 Local'}
                  </span>
                )}
              </div>
              
              <div className="text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <span>⏱️ {formatTime(session.duration)}</span>
                  <span>📅 {new Date(session.startTime).toLocaleDateString()}</span>
                  <span>🕐 {new Date(session.startTime).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}</span>
                </div>
                
                {session.taskId && (
                  <div className="text-xs text-gray-500 mt-1">
                    📋 Task: {session.taskId}
                  </div>
                )}
                
                {session.goalId && (
                  <div className="text-xs text-gray-500 mt-1">
                    🎯 Goal: {session.goalId}
                  </div>
                )}
                
                {session.notes && session.notes.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    📝 {session.notes.join(', ')}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded ${
                session.completed 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {session.completed ? '✅ Completed' : '❌ Incomplete'}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {timerSessions.length > limit && (
        <div className="mt-4 text-center">
          <button className="text-blue-600 hover:text-blue-800 text-sm">
            View all {timerSessions.length} sessions →
          </button>
        </div>
      )}
    </div>
  );
}