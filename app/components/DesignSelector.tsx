"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Design {
  name: string;
}

export default function DesignSelector({ onSelect }: { onSelect: (design: string) => void }) {
  const params = useParams();
  const currentDesign = decodeURIComponent(params.design as string);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        const response = await fetch("/api/designs");
        const data = await response.json();
        setDesigns(data || []);
      } catch (error) {
        console.error("Error fetching designs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDesigns();
  }, []);

  if (loading) {
    return (
      <div className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white shadow-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
        <span>Loading designs...</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <select
        value={currentDesign || ""}
        onChange={(e) => e.target.value && onSelect(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg appearance-none"
      >
        <option value="">Select a design</option>
        {designs.map((design) => (
          <option key={design.name} value={design.name}>
            {design.name}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg
          className="w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
