"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ScanComponent from "@/components/Scanner";
import Link from "next/link";

type Event = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

type Scanner = {
  id: string;
  name: string;
  phoneNumber: string | null;
  eventId: string;
};

export default function ScanPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [scanner, setScanner] = useState<Scanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      // Check if scanner is logged in
      const storedScanner = localStorage.getItem("scanner");
      if (storedScanner) {
        const scannerData = JSON.parse(storedScanner);
        setScanner(scannerData);
        fetchEvent(scannerData.eventId);
      } else {
        // Redirect to login page
        router.push(`/scan/${slug}/login`);
      }
    }
  }, [slug, router]);

  const fetchEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${slug}`);
      const data = await response.json();
      
      if (response.ok) {
        if (!data.event.isActive) {
          setError("This event is not active");
        } else if (data.event.id !== eventId) {
          setError("Scanner not authorized for this event");
          localStorage.removeItem("scanner");
          router.push(`/scan/${slug}/login`);
        } else {
          setEvent(data.event);
        }
      } else {
        setError(data.message || "Event not found");
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      setError("Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("scanner");
    router.push(`/scan/${slug}/login`);
  };

  if (loading || !scanner) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
        <p className="mb-4">{error || "Event not found"}</p>
        <Link href="/" className="text-blue-600 hover:underline">
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen p-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Logged in as</p>
            <p className="font-semibold text-gray-800">{scanner.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
        <ScanComponent 
          eventSlug={event.slug} 
          eventName={event.name} 
          scannerId={scanner.id}
        />
      </div>
    </div>
  );
}
