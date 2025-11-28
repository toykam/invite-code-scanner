"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";

type Event = {
  id: string;
  name: string;
  slug: string;
};

export default function ScannerLoginPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingEvent, setFetchingEvent] = useState(true);

  useEffect(() => {
    if (slug) {
      // Check cache first
      const cacheKey = `scanner_event_${slug}`;
      const cachedEvent = localStorage.getItem(cacheKey);
      const cacheTimestamp = localStorage.getItem(`${cacheKey}_time`);
      
      if (cachedEvent && cacheTimestamp) {
        const cacheAge = Date.now() - parseInt(cacheTimestamp);
        // Use cache if less than 10 minutes old
        if (cacheAge < 10 * 60 * 1000) {
          setEvent(JSON.parse(cachedEvent));
          setFetchingEvent(false);
          // Still fetch in background to update
          fetchEvent(true);
          return;
        }
      }
      
      fetchEvent();
    }
  }, [slug]);

  const fetchEvent = async (background = false) => {
    try {
      const response = await fetch(`/api/events/${slug}`, {
        cache: 'no-store'
      });
      const data = await response.json();
      if (response.ok && data.event.isActive) {
        setEvent(data.event);
        // Cache the event
        const cacheKey = `scanner_event_${slug}`;
        localStorage.setItem(cacheKey, JSON.stringify(data.event));
        localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
      } else {
        if (!background) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Event not found or inactive",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching event:", error);
    } finally {
      if (!background) {
        setFetchingEvent(false);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/scanners/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, pin, eventSlug: slug }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store scanner info in localStorage
        localStorage.setItem("scanner", JSON.stringify(data.scanner));
        
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Login successful!",
          timer: 1500,
          showConfirmButton: false,
        });

        // Redirect to scanner page
        router.push(`/scan/${slug}`);
      } else {
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: data.message,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          {/* Icon Skeleton */}
          <div className="bg-gradient-to-br from-indigo-100 to-blue-100 w-16 h-16 rounded-full mx-auto mb-6 shimmer"></div>
          
          {/* Title Skeleton */}
          <div className="space-y-3 mb-8">
            <div className="h-8 shimmer rounded-lg w-48 mx-auto"></div>
            <div className="h-4 shimmer rounded w-64 mx-auto"></div>
          </div>

          {/* Form Skeleton */}
          <div className="space-y-6">
            <div>
              <div className="h-4 shimmer rounded w-24 mb-2"></div>
              <div className="h-12 shimmer rounded-lg w-full"></div>
            </div>
            <div>
              <div className="h-4 shimmer rounded w-16 mb-2"></div>
              <div className="h-12 shimmer rounded-lg w-full"></div>
            </div>
            <div className="h-12 shimmer rounded-lg w-full"></div>
          </div>

          {/* Back Link Skeleton */}
          <div className="mt-6 text-center">
            <div className="h-4 shimmer rounded w-32 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-gray-800 font-semibold text-lg mb-2">Event Not Found</p>
          <p className="text-gray-600 text-sm mb-4">This event may be inactive or does not exist.</p>
          <Link href="/" className="text-indigo-600 hover:underline font-medium">
            ← Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Scanner Login
          </h1>
          <p className="text-gray-600">{event.name}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white text-gray-900 placeholder-gray-400"
              placeholder="Enter your phone number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PIN
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white text-gray-900 placeholder-gray-400"
              placeholder="Enter your PIN"
              required
              maxLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            ← Back to Events
          </Link>
        </div>
      </div>
    </div>
  );
}
