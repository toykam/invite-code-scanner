
"use client"; // This marks the component as client-side only, since camera access requires browser APIs.

import { useEffect, useState, useRef } from "react";
import { useDevices } from "@yudiel/react-qr-scanner";
import { Scanner } from "@yudiel/react-qr-scanner"
import Swal from "sweetalert2";


export default function ScanComponent() {
  const [result, setResult] = useState<string | null | undefined>(null);
  const [scanningPaused, setScanningPaused] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<string | undefined>(undefined);
  const [fullscreen, setFullscreen] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const cameras = useDevices();
  const [totalScanned, setTotalScanned] = useState<number>(0);

  // Handler for when a QR code is scanned
  const handleScan = async () => {
    try {
      if (result !== null && result !== undefined && result !== "") {
        Swal.showLoading();
        setScanningPaused(true); // Pause scanning to prevent multiple scans
        // call the confirm invite endpoint, check response and act accordingly
        const response = await fetch("/api/confirm-invite", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inviteCode: result ?? "" }),
        });
        const responseData = await response.json();
        if (response.ok) {
          setTotalScanned(responseData.totalScanned);
          Swal.fire({
            title: "Success",
            text: responseData.message,
            icon: "success",
            confirmButtonText: "OK",
            didClose: () => {
              setScanningPaused(false);
            },
          });
        } else {
          Swal.fire({
            title: "Error",
            text: responseData.message,
            icon: "error",
            confirmButtonText: "OK",
            didClose: () => {
              setScanningPaused(false);
            },
          });
        }
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: `Error: ${error}`,
        icon: "error",
        confirmButtonText: "OK",
        didClose: () => {
          setScanningPaused(false);
        },
      });
    }
  };

  // Handler for errors (e.g., camera access issues)
  const handleError = (error: any) => {
    console.error(error);
    Swal.fire({
        title: "Error",
        text: `Error: ${error}`,
        icon: "error",
        confirmButtonText: "OK"
    });
  };

  useEffect(() => {
    handleScan();
    return () => {};
  }, [result]);

  useEffect(() => {
    const fetchTotalScanned = async () => {
      try {
        const response = await fetch("/api/total-scanned-invites");
        const data = await response.json();
        if (response.ok) {
          setTotalScanned(data.totalScanned);
        } else {
          console.error("Error fetching total scanned invites:", data.message);
        }
      } catch (error) {
        console.error("Error fetching total scanned invites:", error);
      }
    };
    fetchTotalScanned();
  }, []);

  // Set default camera when cameras list changes
  useEffect(() => {
    if (cameras && cameras.length > 0 && !selectedCamera) {
      setSelectedCamera(cameras[0].deviceId);
    }
  }, [cameras, selectedCamera]);

  // Fullscreen handler
  useEffect(() => {
    if (fullscreen && scannerRef.current) {
      scannerRef.current.requestFullscreen?.();
    } else if (!fullscreen && document.fullscreenElement) {
      document.exitFullscreen?.();
    }
  }, [fullscreen]);

  return (
    <div
      ref={scannerRef}
      className={`max-w-lg mx-auto p-6 rounded-xl shadow-lg bg-white mt-10 ${fullscreen ? 'fixed inset-0 z-50 bg-black flex flex-col justify-center items-center' : ''}`}
    >
      <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">QR Code Scanner</h1>
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex gap-2 justify-center">
          <button
            className={`px-4 py-2 rounded bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition ${scanningPaused ? '' : 'ring-2 ring-blue-300'}`}
            onClick={() => setScanningPaused(!scanningPaused)}
          >
            {scanningPaused ? 'Start Scanning' : 'Pause Scanning'}
          </button>
          {/* <button
            className="px-4 py-2 rounded bg-gray-600 text-white font-semibold shadow hover:bg-gray-700 transition"
            onClick={() => setFullscreen(f => !f)}
          >
            {fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button> */}
          <button
            className="px-4 py-2 rounded bg-red-500 text-white font-semibold shadow hover:bg-red-600 transition"
            onClick={() => setResult(null)}
            disabled={!result}
          >
            Clear
          </button>
        </div>
        <div className="flex gap-2 items-center justify-center">
          <label htmlFor="camera" className="font-medium text-gray-700">Camera:</label>
          <select
            id="camera"
            className="px-2 py-1 rounded border border-gray-300"
            value={selectedCamera}
            onChange={e => setSelectedCamera(e.target.value)}
          >
            {cameras.map(cam => (
              <option key={cam.deviceId} value={cam.deviceId}>{cam.label || cam.deviceId}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="rounded-lg overflow-hidden border border-gray-200 shadow mb-4">
        <Scanner
          onScan={(value) => {
            if (value.length > 0) {
              setResult(`${value[0].rawValue}`);
            }
          }}
          allowMultiple={false}
          sound={true}
          formats={["qr_code"]}
          onError={handleError}
          paused={scanningPaused}
          constraints={selectedCamera ? { deviceId: { exact: selectedCamera } } : undefined}
        />
      </div>
      <div className="text-center">
        <span className="font-semibold text-gray-700">Scanned Invites:</span>
        <span className="ml-2 text-lg text-blue-700 break-all">{totalScanned || <span className="italic text-gray-400">No Scan Have been made</span>}</span>
      </div>
      <div className="text-center">
        <span className="font-semibold text-gray-700">Invite Code:</span>
        <span className="ml-2 text-lg text-blue-700 break-all">{result || <span className="italic text-gray-400">No code scanned</span>}</span>
      </div>
    </div>
  );

}