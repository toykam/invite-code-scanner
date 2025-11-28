"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Event = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  codePrefix: string;
  attendantCodePattern: string;
  driverCodePattern: string | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  _count: {
    invites: number;
  };
};

type Stats = {
  totalScanned: number;
  recentScans: Array<{
    inviteQrCode: string;
    createdAt: string;
  }>;
  scansByHour: Array<{
    hour: string;
    count: number;
  }>;
};

export default function EventDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchEventDetails();
      fetchEventStats();
    }
  }, [slug]);

  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`/api/events/${slug}`);
      const data = await response.json();
      if (response.ok) {
        setEvent(data.event);
      }
    } catch (error) {
      console.error("Error fetching event:", error);
    }
  };

  const fetchEventStats = async () => {
    try {
      const response = await fetch(`/api/events/${slug}/stats`);
      const data = await response.json();
      if (response.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <Link href="/admin" className="text-blue-600 hover:underline">
            ← Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Admin
          </Link>
        </div>

        {/* Event Header Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl sm:text-4xl font-bold text-white">{event.name}</h1>
                  <span
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                      event.isActive
                        ? "bg-green-500 text-white ring-2 ring-green-300"
                        : "bg-gray-400 text-white"
                    }`}
                  >
                    {event.isActive ? "● Live" : "○ Inactive"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-blue-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="font-mono text-lg">/{event.slug}</span>
                </div>
              </div>
              
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[140px]">
                <div className="text-5xl font-bold text-white mb-1">
                  {stats?.totalScanned || 0}
                </div>
                <div className="text-blue-100 text-sm font-medium">Total Scans</div>
              </div>
            </div>

            {event.description && (
              <p className="text-blue-50 mt-4 text-lg leading-relaxed">{event.description}</p>
            )}
          </div>

          <div className="p-6 sm:p-8">
            {/* Date Range */}
            {(event.startDate || event.endDate) && (
              <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-gray-200">
                {event.startDate && (
                  <div className="flex items-center gap-3 bg-green-50 px-4 py-3 rounded-lg">
                    <div className="bg-green-500 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-green-600 uppercase">Start Date</div>
                      <div className="text-sm font-medium text-gray-800">
                        {new Date(event.startDate).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
                {event.endDate && (
                  <div className="flex items-center gap-3 bg-red-50 px-4 py-3 rounded-lg">
                    <div className="bg-red-500 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-red-600 uppercase">End Date</div>
                      <div className="text-sm font-medium text-gray-800">
                        {new Date(event.endDate).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Code Patterns */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-800">Code Prefix</h3>
                </div>
                <code className="text-2xl font-bold text-blue-600 bg-white px-4 py-2 rounded-lg block text-center">
                  {event.codePrefix}
                </code>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-purple-500 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-800">Attendant Pattern</h3>
                </div>
                <code className="text-xs font-mono text-gray-700 bg-white px-3 py-2 rounded-lg block break-all">
                  {event.attendantCodePattern}
                </code>
              </div>

              {event.driverCodePattern && (
                <div className="sm:col-span-2 bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-amber-500 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-gray-800">Driver Pattern</h3>
                  </div>
                  <code className="text-xs font-mono text-gray-700 bg-white px-3 py-2 rounded-lg block break-all">
                    {event.driverCodePattern}
                  </code>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Scans */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-500 p-3 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Recent Scans</h2>
              </div>
              {stats.recentScans.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No scans yet</p>
                  <p className="text-gray-400 text-sm mt-1">Scans will appear here once scanning begins</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {stats.recentScans.map((scan, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <code className="bg-white px-3 py-2 rounded-lg font-mono text-sm font-semibold text-gray-800 shadow-sm">
                        {scan.inviteQrCode}
                      </code>
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium">
                          {new Date(scan.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scans by Hour */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-500 p-3 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Scans by Hour</h2>
              </div>
              {stats.scansByHour.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No hourly data</p>
                  <p className="text-gray-400 text-sm mt-1">Statistics will appear after scanning activity</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {stats.scansByHour.map((data, idx) => {
                    const maxCount = Math.max(...stats.scansByHour.map(d => d.count));
                    const percentage = maxCount > 0 ? (data.count / maxCount) * 100 : 0;
                    return (
                      <div key={idx} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-600">
                            {new Date(data.hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-sm font-bold text-indigo-600">{data.count}</span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-8 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-8 rounded-full flex items-center justify-end px-3 transition-all duration-500 group-hover:from-indigo-600 group-hover:to-purple-600"
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          >
                            {data.count > 0 && (
                              <span className="text-white text-xs font-bold">{data.count}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
