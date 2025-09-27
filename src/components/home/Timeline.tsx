import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { DailyEntry } from '../../types';
import { ChevronLeft, ChevronRight, Calendar, Star, Target, MessageCircle } from 'lucide-react';

interface TimelineProps {
  onClose: () => void;
}

export default function Timeline({ onClose }: TimelineProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);

  const fetchEntries = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEntryForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return entries.find(entry => entry.entry_date === dateString);
  };

  const formatDate = (date: string) => {
    // Add 'T00:00:00' to ensure it's treated as local date, not UTC
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const days = getDaysInMonth(currentMonth);
  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Your Journey</h2>
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('calendar')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  view === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Timeline
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {view === 'calendar' ? (
              <div className="p-6">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-xl font-semibold text-gray-900">{monthYear}</h3>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, index) => {
                    if (!day) {
                      return <div key={index} className="p-2"></div>;
                    }

                    const entry = getEntryForDate(day);
                    const isToday = day.toDateString() === new Date().toDateString();
                    const hasEntry = !!entry;

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => entry && setSelectedEntry(entry)}
                        className={`p-2 text-sm rounded-lg transition-all relative ${
                          isToday
                            ? 'bg-emerald-100 text-emerald-800 font-bold'
                            : hasEntry
                            ? 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {day.getDate()}
                        {hasEntry && (
                          <div className="absolute top-1 right-1 flex gap-0.5">
                            {entry.morning_completed && (
                              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                            )}
                            {entry.evening_completed && (
                              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                            )}
                          </div>
                        )}
                        {entry?.stars_earned && entry.stars_earned > 0 && (
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                            <div className="bg-yellow-400 text-yellow-900 text-xs font-bold px-1 py-0.5 rounded-full shadow-sm border border-yellow-500">
                              {entry.stars_earned}⭐
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {entries.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No entries yet. Start your journey today!</p>
                  </div>
                ) : (
                  entries.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {formatDate(entry.entry_date)}
                        </h4>
                        <div className="flex items-center gap-2">
                          {entry.stars_earned && entry.stars_earned > 0 && (
                            <span className="text-yellow-600 font-bold text-sm">
                              {entry.stars_earned}★
                            </span>
                          )}
                          <div className="flex gap-1">
                            {entry.morning_completed && (
                              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            )}
                            {entry.evening_completed && (
                              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                      {entry.morning_intention && (
                        <p className="text-sm text-gray-600 truncate">
                          Intention: {entry.morning_intention}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Entry Detail Sidebar */}
          {selectedEntry && (
            <div className="w-80 border-l bg-gray-50 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formatDate(selectedEntry.entry_date)}
                  </h3>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Stars Earned */}
                  {selectedEntry.stars_earned && selectedEntry.stars_earned > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <Star className="w-5 h-5 text-yellow-600" />
                      <div>
                        <div className="font-semibold text-yellow-800">
                          {selectedEntry.stars_earned} Stars Earned
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Morning Intention */}
                  {selectedEntry.morning_intention && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-yellow-600" />
                        <h4 className="font-semibold text-gray-700">Morning Intention</h4>
                        {selectedEntry.morning_completed && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Completed
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 bg-white p-3 rounded-lg border italic">
                        "{selectedEntry.morning_intention}"
                      </p>
                      {selectedEntry.morning_completed_at && (
                        <p className="text-xs text-gray-500">
                          Completed at {new Date(selectedEntry.morning_completed_at).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Evening Reflection */}
                  {selectedEntry.reflection_text && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-purple-600" />
                        <h4 className="font-semibold text-gray-700">Evening Reflection</h4>
                        {selectedEntry.evening_completed && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Completed
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 bg-white p-3 rounded-lg border italic">
                        "{selectedEntry.reflection_text}"
                      </p>
                      {selectedEntry.rating && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Day rating:</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= selectedEntry.rating!
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">({selectedEntry.rating}/5)</span>
                        </div>
                      )}
                      {selectedEntry.evening_completed_at && (
                        <p className="text-xs text-gray-500">
                          Completed at {new Date(selectedEntry.evening_completed_at).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Empty State */}
                  {!selectedEntry.morning_intention && !selectedEntry.reflection_text && (
                    <div className="text-center py-8">
                      <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No activities recorded for this day</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}