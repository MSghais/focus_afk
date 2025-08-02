'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { useFocusAFKStore } from '../../../store/store';
import { useUIStore } from '../../../store/uiStore';
import { ButtonPrimary } from '../../small/buttons';
import { Icon } from '../../small/icons';
import { isUserAuthenticated } from '../../../lib/auth';
import { Task } from '../../../types';

interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole: string;
}

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  location?: string;
  htmlLink?: string;
  created: string;
  updated: string;
}

export default function GoogleCalendarManager() {
  const { addTask } = useFocusAFKStore();
  const { showToast } = useUIStore();
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<string>('');
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    checkConnectionAndLoadCalendars();
  }, []);

  const checkConnectionAndLoadCalendars = async () => {
    if (!isUserAuthenticated()) return;

    try {
      setLoading(true);
      
      // Check connection status
      const statusResponse = await api.getGoogleCalendarStatus();
      if (statusResponse.success) {
        setIsConnected(statusResponse.data?.isConnected || false);
        
        if (statusResponse.data?.isConnected) {
          // Load calendars
          await loadCalendars();
        }
      }
    } catch (error) {
      console.error('Failed to check connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCalendars = async () => {
    try {
      const response = await api.getCalendars();
      if (response.success && response.data) {
        setCalendars(response.data);
        // Auto-select primary calendar if available
        const primaryCalendar = response.data.find(cal => cal.primary);
        if (primaryCalendar) {
          setSelectedCalendar(primaryCalendar.id);
        }
      }
    } catch (error) {
      console.error('Failed to load calendars:', error);
      showToast({
        message: 'Failed to load calendars',
        description: 'Please try again later',
        type: 'error',
        duration: 5000
      });
    }
  };

  const loadEvents = async () => {
    if (!selectedCalendar) return;

    try {
      setLoadingEvents(true);
      const response = await api.getCalendarEvents({
        timeMin: new Date(dateRange.start).toISOString(),
        timeMax: new Date(dateRange.end + 'T23:59:59').toISOString(),
        maxResults: 50
      });

      if (response.success && response.data) {
        setEvents(response.data);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
      showToast({
        message: 'Failed to load events',
        description: 'Please try again later',
        type: 'error',
        duration: 5000
      });
    } finally {
      setLoadingEvents(false);
    }
  };

  const saveEventAsTask = async (event: GoogleCalendarEvent) => {
    try {
      // Parse event dates
      const startDate = event.start.dateTime || event.start.date;
      const endDate = event.end.dateTime || event.end.date;
      
      if (!startDate) {
        showToast({
          message: 'Cannot save event',
          description: 'Event has no start date',
          type: 'error',
          duration: 3000
        });
        return;
      }

      // Calculate duration in minutes
      let estimatedMinutes = 30; // default
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        estimatedMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      }

      // Create task data
      const taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        title: event.summary || 'Untitled Event',
        description: event.description || `Event from Google Calendar${event.location ? `\nLocation: ${event.location}` : ''}${event.htmlLink ? `\nLink: ${event.htmlLink}` : ''}`,
        completed: false,
        priority: 'medium',
        category: 'Google Calendar',
        dueDate: new Date(startDate),
        estimatedMinutes: estimatedMinutes > 0 ? estimatedMinutes : undefined
      };

      // Add task to Focus AFK
      await addTask(taskData);

      showToast({
        message: 'Event saved as task',
        description: `"${event.summary}" has been added to your tasks`,
        type: 'success',
        duration: 3000
      });
    } catch (error) {
      console.error('Failed to save event as task:', error);
      showToast({
        message: 'Failed to save event',
        description: 'Please try again later',
        type: 'error',
        duration: 5000
      });
    }
  };

  const saveAllEventsAsTasks = async () => {
    try {
      let savedCount = 0;
      
      for (const event of events) {
        try {
          await saveEventAsTask(event);
          savedCount++;
          // Small delay to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Failed to save event ${event.id}:`, error);
        }
      }

      showToast({
        message: 'Events saved',
        description: `${savedCount} events have been saved as tasks`,
        type: 'success',
        duration: 5000
      });
    } catch (error) {
      console.error('Failed to save all events:', error);
      showToast({
        message: 'Failed to save events',
        description: 'Please try again later',
        type: 'error',
        duration: 5000
      });
    }
  };

  const formatEventTime = (event: GoogleCalendarEvent) => {
    if (event.start.dateTime) {
      const start = new Date(event.start.dateTime);
      const end = event.end.dateTime ? new Date(event.end.dateTime) : null;
      
      const startTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const endTime = end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      
      return `${startTime}${endTime ? ` - ${endTime}` : ''}`;
    } else if (event.start.date) {
      return 'All day';
    }
    return 'No time specified';
  };

  const formatEventDate = (event: GoogleCalendarEvent) => {
    const date = event.start.dateTime || event.start.date;
    if (date) {
      return new Date(date).toLocaleDateString();
    }
    return 'No date specified';
  };

  if (!isUserAuthenticated()) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Please login to manage Google Calendar</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Loading calendar data...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Google Calendar not connected</p>
          <p className="text-sm text-gray-600">Please connect your Google Calendar first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col p-2 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Google Calendar Manager</h1>
        <p className="text-sm text-gray-500">
          View your Google Calendar events and save them as tasks in Focus AFK
        </p>
      </div>

      {/* Calendar Selection */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-medium mb-4">Select Calendar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {calendars.map((calendar) => (
            <button
              key={calendar.id}
              onClick={() => setSelectedCalendar(calendar.id)}
              className={`p-3 border rounded-lg text-left transition-colors ${
                selectedCalendar === calendar.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">{calendar.summary}</div>
              {calendar.description && (
                <div className="text-xs text-gray-600 mt-1">{calendar.description}</div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                {calendar.primary ? 'Primary' : calendar.accessRole}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Selection */}
      {selectedCalendar && (
        <div className="mb-6 p-4 border rounded-lg">
          <h2 className="text-lg font-medium mb-4">Date Range</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="p-2 border rounded-md"
              />
            </div>
            <div className="flex items-end">
              <ButtonPrimary
                onClick={loadEvents}
                disabled={loadingEvents}
                className="flex items-center gap-2"
              >
                <Icon name="refresh" />
                {loadingEvents ? 'Loading...' : 'Load Events'}
              </ButtonPrimary>
            </div>
          </div>
        </div>
      )}

      {/* Events List */}
      {selectedCalendar && events.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-medium">
              Events ({events.length})
            </h2>
            <ButtonPrimary
              onClick={saveAllEventsAsTasks}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Icon name="add" />
              Save All as Tasks
            </ButtonPrimary>
          </div>

          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{event.summary}</h3>
                    <div className="text-sm text-gray-600 mt-1">
                      {formatEventDate(event)} • {formatEventTime(event)}
                    </div>
                    {event.location && (
                      <div className="text-sm text-gray-600 mt-1">
                        📍 {event.location}
                      </div>
                    )}
                    {event.description && (
                      <div className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {event.description}
                      </div>
                    )}
                    {event.attendees && event.attendees.length > 0 && (
                      <div className="text-sm text-gray-600 mt-2">
                        👥 {event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => saveEventAsTask(event)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                    >
                      Save as Task
                    </button>
                    {event.htmlLink && (
                      <a
                        href={event.htmlLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition"
                      >
                        Open
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Events Message */}
      {selectedCalendar && !loadingEvents && events.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-lg font-medium mb-2">No Events Found</h3>
            <p className="text-gray-600">
              No events found in the selected date range. Try adjusting the dates or selecting a different calendar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 