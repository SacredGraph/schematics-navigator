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
    <div className="w-full relative">
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
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400 bg-white rounded-full p-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
}
