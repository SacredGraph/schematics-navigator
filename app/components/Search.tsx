"use client";

import { SearchProps, SearchResult } from "@/types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Search({
  placeholder = "Search by net or node name",
  onSelect,
  disableRedirect = false,
  filterType = "all",
  initialValue = "",
}: SearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const params = useParams();
  const currentDesign = decodeURIComponent(params.design as string);

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
      setIsLoading(true);
      try {
        const url = `/api/${currentDesign}/search?q=${encodeURIComponent(query)}`;

        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
          // Filter suggestions based on filterType
          const filteredResults = data.results.filter((result: SearchResult) => {
            if (filterType === "all") return true;
            return result.type === filterType;
          });

          setSuggestions(filteredResults);
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
  }, [query, filterType, initialValue, currentDesign]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSuggestionClick = (suggestion: SearchResult) => {
    setQuery(suggestion.name);
    setShowSuggestions(false);

    // Call the onSelect callback if provided
    if (onSelect) {
      onSelect(suggestion.name);
    }

    // Only redirect if disableRedirect is false
    if (!disableRedirect) {
      if (suggestion.type === "net") {
        router.push(`/${currentDesign}/nets/${encodeURIComponent(suggestion.name)}`);
      } else {
        router.push(`/${currentDesign}/nodes/${encodeURIComponent(suggestion.name)}`);
      }
    }
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
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          setQuery(suggestions[selectedIndex].name);
          setShowSuggestions(false);

          // Call the onSelect callback if provided
          if (onSelect) {
            onSelect(suggestions[selectedIndex].name);
          }

          // Only redirect if disableRedirect is false
          if (!disableRedirect) {
            if (suggestions[selectedIndex].type === "net") {
              router.push(`/designs/${currentDesign}/nets/${encodeURIComponent(suggestions[selectedIndex].name)}`);
            } else {
              router.push(`/designs/${currentDesign}/nodes/${encodeURIComponent(suggestions[selectedIndex].name)}`);
            }
          }
        }
        break;
      case "Enter":
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          setQuery(suggestions[selectedIndex].name);
          setShowSuggestions(false);

          // Call the onSelect callback if provided
          if (onSelect) {
            onSelect(suggestions[selectedIndex].name);
          }

          // Only redirect if disableRedirect is false
          if (!disableRedirect) {
            if (suggestions[selectedIndex].type === "net") {
              router.push(`/designs/${currentDesign}/nets/${encodeURIComponent(suggestions[selectedIndex].name)}`);
            } else {
              router.push(`/designs/${currentDesign}/nodes/${encodeURIComponent(suggestions[selectedIndex].name)}`);
            }
          }
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        break;
    }
  };

  // Group suggestions by type
  const groupedSuggestions = suggestions.reduce<Record<string, SearchResult[]>>((acc, suggestion) => {
    if (!acc[suggestion.type]) {
      acc[suggestion.type] = [];
    }
    acc[suggestion.type].push(suggestion);
    return acc;
  }, {});

  // Only show the filtered type in the UI
  const displaySuggestions =
    filterType === "all" ? groupedSuggestions : { [filterType]: groupedSuggestions[filterType] || [] };

  return (
    <div className="w-full max-w-2xl mx-auto" ref={searchRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
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
            {Object.entries(displaySuggestions).map(([type, items]) => (
              <div key={type}>
                <div className="px-4 py-2 bg-gray-100 font-semibold text-gray-700">
                  {type === "net" ? "Nets" : "Nodes"}
                </div>
                {items.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                      suggestions.indexOf(suggestion) === selectedIndex ? "bg-blue-100" : ""
                    }`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseEnter={() => setSelectedIndex(suggestions.indexOf(suggestion))}
                  >
                    {suggestion.name}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
