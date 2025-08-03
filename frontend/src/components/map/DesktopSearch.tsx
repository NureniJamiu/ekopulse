import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Clock } from 'lucide-react';
import { useMap } from '../../contexts/MapContext';

interface SearchResult {
  id: string;
  name: string;
  display_name: string;
  lat: number;
  lon: number;
  type: string;
}

interface RecentSearch {
  id: string;
  name: string;
  display_name: string;
  lat: number;
  lon: number;
  timestamp: number;
}

/**
 * DesktopSearch Component
 *
 * A desktop-only search component that appears as a search icon above the
 * "Report Here" button and expands to the left when clicked.
 */
const DesktopSearch: React.FC = () => {
  const { setCenter, setZoom } = useMap();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isExpanded, setIsExpanded] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (search: Omit<RecentSearch, 'timestamp'>) => {
    const newSearch: RecentSearch = {
      ...search,
      timestamp: Date.now(),
    };

    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.id !== search.id);
      const updated = [newSearch, ...filtered].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  // Debounced search function
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&countrycodes=ng&limit=5&addressdetails=1`
        );
        const data = await response.json();

        const formattedResults: SearchResult[] = data.map((item: any) => ({
          id: item.place_id.toString(),
          name: item.name || item.display_name.split(',')[0],
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          type: item.type || 'place',
        }));

        setResults(formattedResults);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  // Handle search result selection
  const selectLocation = (location: SearchResult) => {
    setCenter([location.lat, location.lon]);
    setZoom(15);
    setQuery('');
    setIsExpanded(false);
    setShowResults(false);

    saveRecentSearch({
      id: location.id,
      name: location.name,
      display_name: location.display_name,
      lat: location.lat,
      lon: location.lon,
    });
  };

  // Handle recent search selection
  const selectRecentLocation = (location: RecentSearch) => {
    setCenter([location.lat, location.lon]);
    setZoom(15);
    setQuery('');
    setIsExpanded(false);
    setShowRecent(false);
  };

  // Toggle search expansion
  const handleSearchToggle = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setShowResults(false);
      setShowRecent(false);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (!query && recentSearches.length > 0) {
      setShowRecent(true);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentList = showResults ? results : (showRecent ? recentSearches : []);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < currentList.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        if (showResults) {
          selectLocation(results[selectedIndex]);
        } else if (showRecent) {
          selectRecentLocation(recentSearches[selectedIndex]);
        }
      }
    } else if (e.key === 'Escape') {
      setIsExpanded(false);
      setQuery('');
      setShowResults(false);
      setShowRecent(false);
    }
  };

  // Reset selected index when switching between results and recent
  useEffect(() => {
    setSelectedIndex(-1);
  }, [showResults, showRecent]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setQuery('');
        setShowResults(false);
        setShowRecent(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  // Clear search state when collapsing
  useEffect(() => {
    if (!isExpanded) {
      setQuery('');
      setShowResults(false);
      setShowRecent(false);
    }
  }, [isExpanded]);

  return (
    <div className="hidden md:block">
      {/* Search Icon (collapsed) */}
      {!isExpanded && (
        <div className="absolute bottom-[80px] right-6 z-30 animate-bounce">
          <button
            onClick={handleSearchToggle}
            className="bg-white rounded-full p-3 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200 hover:scale-105"
            title="Search locations"
          >
            <Search className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      )}

      {/* Expanded Search */}
      {isExpanded && (
        <div className="absolute bottom-[80px] right-6 z-30" ref={searchRef}>
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-96 transform transition-all duration-300 ease-out">
            {/* Search Input */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={handleInputFocus}
                  onKeyDown={handleKeyDown}
                  placeholder="Search for places in Nigeria..."
                  className="w-full pl-12 pr-10 py-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-400"
                />
                <button
                  onClick={handleSearchToggle}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Loading indicator */}
            {isLoading && (
              <div className="p-4 text-center">
                <div className="inline-flex items-center gap-2 text-gray-500">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-sm">Searching...</span>
                </div>
              </div>
            )}

            {/* Search Results */}
            {showResults && results.length > 0 && (
              <div className="max-h-60 overflow-y-auto">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => selectLocation(result)}
                    className={`w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                      index === selectedIndex ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {result.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {result.display_name}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {showResults && results.length === 0 && !isLoading && query && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No locations found for "{query}"
              </div>
            )}

            {/* Recent Searches */}
            {showRecent && recentSearches.length > 0 && (
              <div className="max-h-60 overflow-y-auto">
                <div className="flex items-center justify-between p-3 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Recent Searches
                  </span>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Clear
                  </button>
                </div>
                {recentSearches.map((recent, index) => (
                  <button
                    key={recent.id}
                    onClick={() => selectRecentLocation(recent)}
                    className={`w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                      index === selectedIndex ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {recent.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {recent.display_name}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Empty Recent */}
            {showRecent && recentSearches.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No recent searches
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DesktopSearch;
