"use client";

import { useEffect, useRef, useState } from "react";

interface ConnectedNodeSearchProps {
  sourceNode: string;
  onSelect: (name: string) => void;
  placeholder?: string;
  initialValue?: string;
}

interface SearchResult {
  name: string;
  type: "node";
}

export default function ConnectedNodeSearch({
  sourceNode,
  onSelect,
  placeholder = "Select target node",
  initialValue = "",
}: ConnectedNodeSearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);

  // Update query when initialValue changes
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Handle clicks outside the search component to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions]);

  // Fetch suggestions when query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!sourceNode) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/connected-nodes?source=${encodeURIComponent(sourceNode)}&q=${encodeURIComponent(query)}`
        );
        const data = await response.json();

        if (response.ok) {
          setSuggestions(data.results);
          setShowSuggestions(true);
        } else {
          console.error("Error fetching suggestions:", data.error);
          setSuggestions([]);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, sourceNode, initialValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSuggestionClick = (suggestion: SearchResult) => {
    setQuery(suggestion.name);
    setShowSuggestions(false);
    onSelect(suggestion.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prevIndex) => (prevIndex < suggestions.length - 1 ? prevIndex + 1 : prevIndex));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : prevIndex));
        break;
      case "Tab":
      case "Enter":
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          setQuery(suggestions[selectedIndex].name);
          setShowSuggestions(false);
          onSelect(suggestions[selectedIndex].name);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        break;
    }
  };

  return (
    <div className="w-full" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg"
        />

        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
            <div className="px-4 py-2 bg-gray-100 font-semibold text-gray-700">Connected Nodes</div>
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${index === selectedIndex ? "bg-blue-100" : ""}`}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {suggestion.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
