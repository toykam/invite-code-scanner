"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

type Event = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  codePrefix: string;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  _count: {
    invites: number;
  };
};

type Scanner = {
  id: string;
  name: string;
  phoneNumber: string | null;
  email: string | null;
  isActive: boolean;
  _count: {
    invites: number;
    eventAssignments: number;
  };
};

type AdminType = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"events" | "scanners" | "admins">("events");

  useEffect(() => {
    // Check if admin is logged in
    const storedAdmin = localStorage.getItem("admin");
    if (storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
      fetchEvents();
    } else {
      router.push("/admin/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("admin");
    router.push("/admin/login");
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      const data = await response.json();
      if (response.ok) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEventStatus = async (slug: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/events/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        await fetchEvents();
        Swal.fire({
          icon: "success",
          title: "Success",
          text: `Event ${!currentStatus ? "activated" : "deactivated"}`,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update event status",
      });
    }
  };

  const deleteEvent = async (slug: string, hasScans: boolean) => {
    const result = await Swal.fire({
      title: "Delete Event?",
      html: hasScans 
        ? `This event has scans recorded. It will be <strong>deactivated</strong> only.<br><br>To permanently delete, you must first remove all scans.`
        : `<strong>Warning:</strong> This action cannot be undone!<br><br>Are you sure you want to permanently delete this event?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: hasScans ? "Deactivate" : "Yes, delete permanently",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(
        `/api/events/${slug}${!hasScans ? "?permanent=true" : ""}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (response.ok) {
        await fetchEvents();
        Swal.fire({
          icon: "success",
          title: hasScans ? "Deactivated" : "Deleted",
          text: data.message,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete event",
      });
    }
  };

  const deleteScanner = async (scannerId: string, hasScans: boolean, refreshCallback: () => void) => {
    const result = await Swal.fire({
      title: "Delete Scanner?",
      html: hasScans 
        ? `This scanner has recorded scans. It will be <strong>deactivated</strong> only.<br><br>To permanently delete, you must first remove all scans.`
        : `<strong>Warning:</strong> This action cannot be undone!<br><br>Are you sure you want to permanently delete this scanner?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: hasScans ? "Deactivate" : "Yes, delete permanently",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(
        `/api/scanners/${scannerId}${!hasScans ? "?permanent=true" : ""}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (response.ok) {
        refreshCallback();
        Swal.fire({
          icon: "success",
          title: hasScans ? "Deactivated" : "Deleted",
          text: data.message,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete scanner",
      });
    }
  };

  const deleteAdmin = async (adminId: string, currentAdminId: string, refreshCallback: () => void) => {
    if (adminId === currentAdminId) {
      Swal.fire({
        icon: "error",
        title: "Cannot Delete",
        text: "You cannot delete your own account",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Delete Admin?",
      html: `<strong>Warning:</strong> This will permanently delete this admin account!<br><br>Are you sure?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete permanently",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(
        `/api/admin/${adminId}?permanent=true`,
        { 
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentAdminId })
        }
      );

      const data = await response.json();

      if (response.ok) {
        refreshCallback();
        Swal.fire({
          icon: "success",
          title: "Deleted",
          text: data.message,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete admin",
      });
    }
  };

  const createEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const eventData = {
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      codePrefix: formData.get("codePrefix"),
      attendantCodePattern: formData.get("attendantCodePattern"),
      driverCodePattern: formData.get("driverCodePattern") || null,
      startDate: formData.get("startDate") || null,
      endDate: formData.get("endDate") || null,
    };

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Event created successfully",
        });
        setShowCreateForm(false);
        await fetchEvents();
        e.currentTarget.reset();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to create event",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header with Admin Info */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Logged in as</p>
            <p className="font-semibold text-gray-800">{admin.name}</p>
            <p className="text-xs text-gray-500">{admin.email} • {admin.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-2 mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab("events")}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${
              activeTab === "events"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setActiveTab("scanners")}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${
              activeTab === "scanners"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Scanners
          </button>
          {admin.role === "superadmin" && (
            <button
              onClick={() => setActiveTab("admins")}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === "admins"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Admins
            </button>
          )}
        </div>

        {/* Content based on active tab */}
        {activeTab === "events" && (
          <EventsTab
            events={events}
            fetchEvents={fetchEvents}
            showCreateForm={showCreateForm}
            setShowCreateForm={setShowCreateForm}
            createEvent={createEvent}
            toggleEventStatus={toggleEventStatus}
            deleteEvent={deleteEvent}
          />
        )}
        {activeTab === "scanners" && <ScannersTab events={events} deleteScanner={deleteScanner} />}
        {activeTab === "admins" && admin.role === "superadmin" && (
          <AdminsTab currentAdminId={admin.id} deleteAdmin={deleteAdmin} />
        )}
      </div>
    </div>
  );
}

// Events Tab Component
function EventsTab({
  events,
  fetchEvents,
  showCreateForm,
  setShowCreateForm,
  createEvent,
  toggleEventStatus,
  deleteEvent,
}: {
  events: Event[];
  fetchEvents: () => void;
  showCreateForm: boolean;
  setShowCreateForm: (show: boolean) => void;
  createEvent: (e: React.FormEvent<HTMLFormElement>) => void;
  toggleEventStatus: (slug: string, currentStatus: boolean) => void;
  deleteEvent: (slug: string, hasScans: boolean) => void;
}) {
  const [codePrefix, setCodePrefix] = useState("");
  const [expectedAttendants, setExpectedAttendants] = useState("");
  const [expectedDrivers, setExpectedDrivers] = useState("");
  const [generatedAttendantPattern, setGeneratedAttendantPattern] = useState("");
  const [generatedDriverPattern, setGeneratedDriverPattern] = useState("");

  // Generate regex pattern for a numeric range starting from 1000
  const generatePattern = (prefix: string, count: number): string => {
    if (!prefix || !count || count < 1) return "";
    
    const start = 1000;
    const end = start + count - 1;
    
    // Build the regex pattern dynamically
    return `^${prefix}-(${start}|${start + 1}|...|${end})$`;
  };

  // More sophisticated pattern generation
  const generateRangeRegex = (prefix: string, count: number): string => {
    if (!prefix || !count || count < 1) return "";
    
    const start = 1000;
    const end = start + count - 1;
    
    // For small ranges (< 100), list all numbers with alternation
    if (count <= 100) {
      const numbers = Array.from({ length: count }, (_, i) => start + i).join("|");
      return `^${prefix}-(${numbers})$`;
    }
    
    // For larger ranges, use digit-based patterns
    const patterns: string[] = [];
    const startStr = start.toString();
    const endStr = end.toString();
    
    // If same length, create range pattern
    if (startStr.length === endStr.length) {
      const len = startStr.length;
      if (len === 4) {
        // 4-digit numbers
        const startFirst = parseInt(startStr[0]);
        const endFirst = parseInt(endStr[0]);
        
        if (startFirst === endFirst) {
          // Same thousands digit
          patterns.push(`${startFirst}[0-9]{3}`);
        } else {
          // Different thousands digits - need range
          for (let i = startFirst; i <= endFirst; i++) {
            patterns.push(`${i}[0-9]{3}`);
          }
        }
      }
    }
    
    return `^${prefix}-(${patterns.join("|")})$`;
  };

  // Better optimized regex generator
  const generateOptimizedRegex = (prefix: string, count: number): string => {
    if (!prefix || !count || count < 1) return "";
    
    const start = 1000;
    const end = start + count - 1;
    
    return `^${prefix}-(1[0-9]{3}|${Math.floor(end / 1000)}[0-${end % 1000 >= 100 ? 9 : Math.floor(end % 1000 / 100)}][0-9]{2}${end % 100 < 10 ? '' : `|${Math.floor(end / 100)}[0-${end % 10}]`})$`;
  };

  // Simplified and accurate pattern generator
  const generateAccuratePattern = (prefix: string, count: number): string => {
    if (!prefix || !count || count < 1) return "";
    
    const start = 1000;
    const end = start + count - 1;
    const endStr = end.toString();
    
    // Build pattern parts based on the end number
    const patterns: string[] = [];
    
    // Handle full thousands (1000-1999, 2000-2999, etc.)
    const startThousand = 1;
    const endThousand = Math.floor(end / 1000);
    
    for (let t = startThousand; t < endThousand; t++) {
      patterns.push(`${t}[0-9]{3}`);
    }
    
    // Handle the final partial thousand
    const finalThousandStart = endThousand * 1000;
    const finalThousandEnd = end;
    
    if (finalThousandEnd >= finalThousandStart) {
      const lastDigits = finalThousandEnd - finalThousandStart;
      if (lastDigits === 999) {
        // Full thousand
        patterns.push(`${endThousand}[0-9]{3}`);
      } else {
        // Partial thousand - use specific range
        const hundreds = Math.floor(lastDigits / 100);
        const remainder = lastDigits % 100;
        
        if (hundreds > 0) {
          for (let h = 0; h < hundreds; h++) {
            patterns.push(`${endThousand}${h}[0-9]{2}`);
          }
        }
        
        if (remainder >= 0) {
          const tens = Math.floor(remainder / 10);
          const ones = remainder % 10;
          
          if (tens > 0) {
            for (let t = 0; t < tens; t++) {
              patterns.push(`${endThousand}${hundreds}${t}[0-9]`);
            }
          }
          
          // Add final specific range
          patterns.push(`${endThousand}${hundreds}${tens}[0-${ones}]`);
        }
      }
    }
    
    return `^${prefix}-(${patterns.join("|")})$`;
  };

  const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCodePrefix(value);
    
    // Regenerate patterns if counts are set
    if (expectedAttendants && parseInt(expectedAttendants) > 0) {
      const pattern = generateAccuratePattern(value, parseInt(expectedAttendants));
      setGeneratedAttendantPattern(pattern);
    }
    if (expectedDrivers && parseInt(expectedDrivers) > 0) {
      const pattern = generateAccuratePattern(value, parseInt(expectedDrivers));
      setGeneratedDriverPattern(pattern);
    }
  };

  const handleAttendantCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setExpectedAttendants(value);
    
    if (codePrefix && value && parseInt(value) > 0) {
      const pattern = generateAccuratePattern(codePrefix, parseInt(value));
      setGeneratedAttendantPattern(pattern);
    } else {
      setGeneratedAttendantPattern("");
    }
  };

  const handleDriverCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setExpectedDrivers(value);
    
    if (codePrefix && value && parseInt(value) > 0) {
      const pattern = generateAccuratePattern(codePrefix, parseInt(value));
      setGeneratedDriverPattern(pattern);
    } else {
      setGeneratedDriverPattern("");
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Events</h1>
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            ← Back to Home
          </Link>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          {showCreateForm ? "✕ Cancel" : "+ Create New Event"}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-8 border-t-4 border-blue-600">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Event</h2>
          <form onSubmit={createEvent} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition bg-white text-gray-900 placeholder-gray-400"
                  placeholder="e.g., Food Summit 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Slug <span className="text-red-500">*</span>{" "}
                  <span className="text-gray-500 text-xs">(URL-friendly)</span>
                </label>
                <input
                  type="text"
                  name="slug"
                  required
                  pattern="[a-z0-9-]+"
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition bg-white text-gray-900 placeholder-gray-400"
                  placeholder="e.g., food-summit-2025"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lowercase letters, numbers, and hyphens only
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition bg-white text-gray-900 placeholder-gray-400"
                rows={3}
                placeholder="Brief event description"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Code Prefix <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="codePrefix"
                required
                value={codePrefix}
                onChange={handlePrefixChange}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition bg-white text-gray-900 placeholder-gray-400"
                placeholder="e.g., FS25"
              />
              <p className="text-xs text-gray-500 mt-1">Prefix for all invite codes</p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-5 rounded-lg border-2 border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className="text-sm font-bold text-gray-800">Auto-Generate Patterns</p>
              </div>
              <p className="text-xs text-gray-600 mb-4">
                Enter expected participant counts to automatically generate regex patterns. 
                Codes will start from 1000.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Expected Attendants
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={expectedAttendants}
                    onChange={handleAttendantCountChange}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-white text-gray-900 placeholder-gray-400"
                    placeholder="e.g., 2500"
                  />
                  {expectedAttendants && parseInt(expectedAttendants) > 0 && (
                    <p className="text-xs text-green-700 mt-1 font-medium">
                      Codes: {codePrefix || "[PREFIX]"}-1000 to {codePrefix || "[PREFIX]"}-{999 + parseInt(expectedAttendants)}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Expected Drivers <span className="text-gray-500 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={expectedDrivers}
                    onChange={handleDriverCountChange}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-white text-gray-900 placeholder-gray-400"
                    placeholder="e.g., 500"
                  />
                  {expectedDrivers && parseInt(expectedDrivers) > 0 && (
                    <p className="text-xs text-green-700 mt-1 font-medium">
                      Codes: {codePrefix || "[PREFIX]"}-1000 to {codePrefix || "[PREFIX]"}-{999 + parseInt(expectedDrivers)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-800 mb-3">
                Code Validation Patterns (Regex)
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Attendant Code Pattern <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="attendantCodePattern"
                    required
                    value={generatedAttendantPattern}
                    onChange={(e) => setGeneratedAttendantPattern(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition bg-white text-gray-900 placeholder-gray-400"
                    placeholder="^FS25-(1[0-9]{3}|2[0-9]{3}|3[0-4][0-9]{2}|3500)$"
                  />
                  {generatedAttendantPattern ? (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      ✓ Pattern auto-generated
                    </p>
                  ) : (
                    <p className="text-xs text-gray-600 mt-1">
                      Example accepts: FS25-1000 to FS25-3500 (or use auto-generator above)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Driver Code Pattern <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="driverCodePattern"
                    value={generatedDriverPattern}
                    onChange={(e) => setGeneratedDriverPattern(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition bg-white text-gray-900 placeholder-gray-400"
                    placeholder="^FS25-DRIVER-(1[0-9]{3}|2[0-9]{3})$"
                  />
                  {generatedDriverPattern ? (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      ✓ Pattern auto-generated
                    </p>
                  ) : (
                    <p className="text-xs text-gray-600 mt-1">
                      Example accepts: FS25-DRIVER-1000 to FS25-DRIVER-2999 (or use auto-generator above)
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition bg-white text-gray-900"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Create Event
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-300 font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6">
        {events.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-md text-center border-2 border-dashed border-gray-300">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <p className="text-gray-600 text-lg mb-2">No events found</p>
            <p className="text-gray-500 text-sm">Create your first event to get started!</p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-200"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-800">{event.name}</h2>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        event.isActive
                          ? "bg-green-100 text-green-800 ring-2 ring-green-200"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {event.isActive ? "● Active" : "○ Inactive"}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm font-mono bg-gray-50 inline-block px-2 py-1 rounded">
                    /{event.slug}
                  </p>
                  {event.description && (
                    <p className="text-gray-600 mt-3 leading-relaxed">{event.description}</p>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <span className="text-sm font-semibold text-blue-800 block mb-1">
                    Code Prefix
                  </span>
                  <code className="text-lg font-bold text-blue-900">{event.codePrefix}</code>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <span className="text-sm font-semibold text-green-800 block mb-1">
                    Total Scanned
                  </span>
                  <span className="text-3xl font-bold text-green-900">
                    {event._count.invites}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/scan/${event.slug}`}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 font-semibold transition-all shadow hover:shadow-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  Open Scanner
                </Link>
                <Link
                  href={`/admin/events/${event.slug}`}
                  className="bg-gray-600 text-white px-5 py-2.5 rounded-lg hover:bg-gray-700 font-semibold transition-all shadow hover:shadow-lg"
                >
                  View Details
                </Link>
                <button
                  onClick={() => toggleEventStatus(event.slug, event.isActive)}
                  className={`px-5 py-2.5 rounded-lg font-semibold transition-all shadow hover:shadow-lg ${
                    event.isActive
                      ? "bg-yellow-500 text-white hover:bg-yellow-600"
                      : "bg-green-500 text-white hover:bg-green-600"
                  }`}
                >
                  {event.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => deleteEvent(event.slug, event._count.invites > 0)}
                  className="bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 font-semibold transition-all shadow hover:shadow-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

// Scanners Tab Component  
function ScannersTab({ 
  events, 
  deleteScanner 
}: { 
  events: Event[]; 
  deleteScanner: (scannerId: string, hasScans: boolean, refreshCallback: () => void) => void;
}) {
  const [scanners, setScanners] = useState<Scanner[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedScanner, setSelectedScanner] = useState<any>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEventSlugs, setSelectedEventSlugs] = useState<string[]>([]);

  useEffect(() => {
    fetchScanners();
  }, []);

  const fetchScanners = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/scanners`);
      const data = await response.json();
      if (response.ok) {
        setScanners(data.scanners);
      }
    } catch (error) {
      console.error("Error fetching scanners:", error);
    } finally {
      setLoading(false);
    }
  };

  const createScanner = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const scannerData = {
      name: formData.get("name"),
      phoneNumber: formData.get("phoneNumber"),
      email: formData.get("email"),
      pin: formData.get("pin"),
    };

    try {
      const response = await fetch("/api/scanners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scannerData),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Scanner created successfully",
        });
        setShowCreateForm(false);
        await fetchScanners();
        e.currentTarget.reset();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to create scanner",
      });
    }
  };

  const handleAssignEvents = async () => {
    if (!selectedScanner || selectedEventSlugs.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please select at least one event",
      });
      return;
    }

    try {
      const response = await fetch("/api/scanners/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scannerId: selectedScanner.id,
          eventSlugs: selectedEventSlugs,
        }),
      });

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Scanner assigned to events successfully",
        });
        setShowAssignModal(false);
        setSelectedEventSlugs([]);
        await fetchScanners();
      } else {
        const data = await response.json();
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to assign scanner",
      });
    }
  };

  const openAssignModal = (scanner: any) => {
    setSelectedScanner(scanner);
    setSelectedEventSlugs([]);
    setShowAssignModal(true);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Scanner Management</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          {showCreateForm ? "✕ Cancel" : "+ Create Scanner"}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-8 border-t-4 border-blue-600">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Scanner</h2>
          <form onSubmit={createScanner} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Scanner Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition bg-white text-gray-900 placeholder-gray-400"
                  placeholder="e.g., John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  required
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition bg-white text-gray-900 placeholder-gray-400"
                  placeholder="e.g., +1234567890"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="email"
                  name="email"
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition bg-white text-gray-900 placeholder-gray-400"
                  placeholder="scanner@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  PIN <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="pin"
                  required
                  maxLength={6}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition bg-white text-gray-900 placeholder-gray-400"
                  placeholder="6-digit PIN"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Create Scanner
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-300 font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!loading && (
        <div className="grid gap-4">
          {scanners.length === 0 ? (
            <div className="bg-white p-12 rounded-xl shadow-md text-center border-2 border-dashed border-gray-300">
              <p className="text-gray-600 text-lg mb-2">No scanners found</p>
              <p className="text-gray-500 text-sm">Create a scanner to get started!</p>
            </div>
          ) : (
            scanners.map((scanner) => (
              <div
                key={scanner.id}
                className="bg-white p-6 rounded-xl shadow-md border border-gray-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{scanner.name}</h3>
                    <p className="text-gray-600 text-sm">{scanner.phoneNumber}</p>
                    {scanner.email && <p className="text-gray-500 text-xs">{scanner.email}</p>}
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        scanner.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {scanner.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 items-center mb-3">
                  <div className="bg-blue-50 px-4 py-2 rounded-lg">
                    <span className="text-2xl font-bold text-blue-600">
                      {scanner._count?.invites || 0}
                    </span>
                    <p className="text-xs text-gray-600">Total Scans</p>
                  </div>
                  <div className="bg-purple-50 px-4 py-2 rounded-lg">
                    <span className="text-2xl font-bold text-purple-600">
                      {scanner._count?.eventAssignments || 0}
                    </span>
                    <p className="text-xs text-gray-600">Assigned Events</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => openAssignModal(scanner)}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-semibold transition"
                  >
                    Manage Assignments
                  </button>
                  <button
                    onClick={() => deleteScanner(scanner.id, scanner._count?.invites > 0, fetchScanners)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Assign Events to {selectedScanner.name}
            </h2>
            <p className="text-gray-600 mb-4">Select events to assign this scanner to:</p>
            <div className="space-y-2 max-h-64 overflow-y-auto mb-6">
              {events.filter(e => e.isActive).map((event) => (
                <label key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEventSlugs.includes(event.slug)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEventSlugs([...selectedEventSlugs, event.slug]);
                      } else {
                        setSelectedEventSlugs(selectedEventSlugs.filter(s => s !== event.slug));
                      }
                    }}
                    className="w-5 h-5"
                  />
                  <span className="font-medium text-gray-800">{event.name}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAssignEvents}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold transition"
              >
                Assign Events
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedEventSlugs([]);
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Admins Tab Component
function AdminsTab({ 
  currentAdminId,
  deleteAdmin
}: { 
  currentAdminId: string;
  deleteAdmin: (adminId: string, currentAdminId: string, refreshCallback: () => void) => void;
}) {
  const [admins, setAdmins] = useState<AdminType[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await fetch("/api/admin");
      const data = await response.json();
      if (response.ok) {
        setAdmins(data.admins);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const adminData = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role") || "admin",
    };

    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminData),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Admin created successfully",
        });
        setShowCreateForm(false);
        await fetchAdmins();
        e.currentTarget.reset();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to create admin",
      });
    }
  };

  const toggleAdminStatus = async (id: string, currentStatus: boolean) => {
    if (id === currentAdminId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "You cannot deactivate your own account",
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        await fetchAdmins();
        Swal.fire({
          icon: "success",
          title: "Success",
          text: `Admin ${!currentStatus ? "activated" : "deactivated"}`,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update admin status",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Admin Management</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          {showCreateForm ? "✕ Cancel" : "+ Create Admin"}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-8 border-t-4 border-purple-600">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Admin</h2>
          <form onSubmit={createAdmin} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition bg-white text-gray-900 placeholder-gray-400"
                  placeholder="e.g., Jane Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition bg-white text-gray-900 placeholder-gray-400"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition bg-white text-gray-900 placeholder-gray-400"
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition bg-white text-gray-900"
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Create Admin
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-300 font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {admins.map((admin) => (
          <div
            key={admin.id}
            className="bg-white p-6 rounded-xl shadow-md border border-gray-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{admin.name}</h3>
                <p className="text-gray-600 text-sm">{admin.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {admin.role} • Created {new Date(admin.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    admin.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {admin.isActive ? "Active" : "Inactive"}
                </span>
                {admin.id !== currentAdminId && (
                  <>
                    <button
                      onClick={() => toggleAdminStatus(admin.id, admin.isActive)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        admin.isActive
                          ? "bg-yellow-500 text-white hover:bg-yellow-600"
                          : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                    >
                      {admin.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => deleteAdmin(admin.id, currentAdminId, fetchAdmins)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-semibold transition"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
