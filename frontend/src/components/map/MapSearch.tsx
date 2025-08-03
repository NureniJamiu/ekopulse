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
 * MapSearch Component
 *
 * Provides place search functionality for the map interface.
 * Features:
 * - Responsive design: icon on mobile that expands to full-width search
 * - On desktop: expandable search bar
 * - Real-time search with debouncing
 * - Recent searches with localStorage persistence
 * - Keyboard navigation (arrow keys, enter, escape)
 * - Focus on Nigerian locations with country bias
 * - Smooth animations and transitions
 */
const MapSearch: React.FC = () => {
  const { setCenter, setZoom } = useMap();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('ekopulse-recent-searches');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentSearches(parsed);
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearches = (searches: RecentSearch[]) => {
    localStorage.setItem('ekopulse-recent-searches', JSON.stringify(searches));
  };

  // Add to recent searches
  const addToRecentSearches = (result: SearchResult) => {
    const newSearch: RecentSearch = {
      ...result,
      timestamp: Date.now()
    };

    setRecentSearches(prev => {
      // Remove if already exists
      const filtered = prev.filter(item => item.id !== result.id);
      // Add to beginning and limit to 5 items
      const updated = [newSearch, ...filtered].slice(0, 5);
      saveRecentSearches(updated);
      return updated;
    });
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('ekopulse-recent-searches');
  };

  // Search function using Nominatim API (OpenStreetMap)
  const searchPlaces = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Focus on Nigeria by adding country bias
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(searchQuery + ', Nigeria')}&` +
        `format=json&` +
        `limit=5&` +
        `countrycodes=ng&` +
        `addressdetails=1&` +
        `bounded=1&` +
        `viewbox=2.6,13.9,14.7,4.2&` + // Bounding box for Nigeria
        `extratags=1`,
        {
          headers: {
            'User-Agent': 'EkoPulse/1.0 (Environmental Issue Reporting Platform)'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();

      // Filter out results that don't have proper coordinates
      const validResults = data.filter((item: any) =>
        item.lat && item.lon && !isNaN(parseFloat(item.lat)) && !isNaN(parseFloat(item.lon))
      );

      const formattedResults: SearchResult[] = validResults.map((item: any, index: number) => ({
        id: item.place_id || `${item.lat}-${item.lon}-${index}`,
        name: item.name || item.display_name.split(',')[0],
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type || 'place'
      }));

      setResults(formattedResults);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      // You could add a toast notification here for user feedback
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input change with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        searchPlaces(query);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle result selection
  const handleResultSelect = (result: SearchResult) => {
    setCenter([result.lat, result.lon]);
    // Use different zoom levels for mobile vs desktop for better UX
    setZoom(isMobile ? 14 : 15);
    addToRecentSearches(result);
    setQuery('');
    setShowResults(false);
    setShowRecent(false);
    setSelectedIndex(-1);
    setIsExpanded(false); // Close search on selection
    inputRef.current?.blur();
  };

  // Handle recent search selection
  const handleRecentSelect = (recent: RecentSearch) => {
    setCenter([recent.lat, recent.lon]);
    // Use different zoom levels for mobile vs desktop for better UX
    setZoom(isMobile ? 14 : 15);
    setQuery('');
    setShowResults(false);
    setShowRecent(false);
    setSelectedIndex(-1);
    setIsExpanded(false); // Close search on selection
    inputRef.current?.blur();
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setShowRecent(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search expand/collapse
  const handleSearchToggle = () => {
    setIsExpanded(prev => {
      const newExpanded = !prev;
      if (newExpanded) {
        // Focus input when expanded
        setTimeout(() => inputRef.current?.focus(), 100);
      } else {
        // Clear search when collapsed
        setQuery('');
        setResults([]);
        setShowResults(false);
        setShowRecent(false);
        setSelectedIndex(-1);
      }
      return newExpanded;
    });
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
    if (!query && recentSearches.length > 0) {
      setShowRecent(true);
    } else if (query && results.length > 0) {
      setShowResults(true);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const currentItems = showRecent ? recentSearches : results;
    const maxIndex = currentItems.length - 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, maxIndex));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex <= maxIndex) {
          const selectedItem = currentItems[selectedIndex];
          if (showRecent) {
            handleRecentSelect(selectedItem as RecentSearch);
          } else {
            handleResultSelect(selectedItem as SearchResult);
          }
        }
        break;
      case 'Escape':
        setShowResults(false);
        setShowRecent(false);
        setSelectedIndex(-1);
        if (isExpanded && isMobile) {
          setIsExpanded(false);
        }
        inputRef.current?.blur();
        break;
    }
  };

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results, recentSearches, showResults, showRecent]);

  // Handle click outside to close dropdown and search on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setShowRecent(false);
        if (isMobile && !query) {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, query]);

  return (
    <>
      {/* Mobile: Search Icon (collapsed) */}
      {isMobile && !isExpanded && (
        <div className="absolute top-4 right-4 z-30">
          <button
            onClick={handleSearchToggle}
            className="bg-white rounded-full p-3 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200"
          >
            <Search className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      )}

      {/* Mobile: Expanded Search (full width) */}
      {isMobile && isExpanded && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-20 z-[45]"
            onClick={handleSearchToggle}
          />

          {/* Search Panel */}
          <div
            className={`fixed top-0 left-0 right-0 z-[60] bg-white shadow-lg transform transition-transform duration-300 ease-out ${
              isExpanded ? 'translate-y-0' : '-translate-y-full'
            }`}
            ref={searchRef}
          >
          <div className="p-4">
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
                className="w-full pl-12 pr-12 py-4 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base placeholder-gray-400"
              />
              <button
                onClick={handleSearchToggle}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Loading indicator */}
              {isLoading && (
                <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Search Results */}
          {(showResults || showRecent) && (
            <div className="bg-white border-t border-gray-200 max-h-96 overflow-y-auto">
              {/* Recent Searches */}
              {showRecent && recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center text-sm font-medium text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      Recent Searches
                    </div>
                    <button
                      onClick={clearRecentSearches}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Clear
                    </button>
                  </div>
                  {recentSearches.map((recent, index) => (
                    <button
                      key={recent.id}
                      onClick={() => handleRecentSelect(recent)}
                      className={`w-full px-4 py-4 text-left border-b border-gray-50 last:border-b-0 transition-colors ${
                        showRecent && selectedIndex === index
                          ? 'bg-blue-50 border-blue-100'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-base text-gray-900 truncate">
                            {recent.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {recent.display_name}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Search Results */}
              {showResults && results.length > 0 && (
                <div>
                  {showRecent && recentSearches.length > 0 && (
                    <div className="border-t border-gray-100" />
                  )}
                  {results.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultSelect(result)}
                      className={`w-full px-4 py-4 text-left border-b border-gray-50 last:border-b-0 transition-colors ${
                        showResults && selectedIndex === index
                          ? 'bg-blue-50 border-blue-100'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 mr-3 mt-0.5 text-blue-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-base text-gray-900 truncate">
                            {result.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {result.display_name}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No Results */}
              {showResults && query.length >= 2 && results.length === 0 && !isLoading && (
                <div className="px-4 py-8 text-center text-gray-500">
                  <MapPin className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <div className="text-base">No places found</div>
                  <div className="text-sm">Try searching with a different term</div>
                </div>
              )}
            </div>
          )}
          </div>
        </>
      )}

      {/* Desktop: Expandable Search Bar */}
      {!isMobile && (
        <div
          className={`absolute top-4 left-4 z-30 transition-all duration-300 ease-out ${
            isExpanded ? 'w-96 lg:w-[500px]' : 'w-12 h-12'
          }`}
          ref={searchRef}
        >
          {!isExpanded ? (
            /* Desktop: Search Icon (collapsed) */
            <button
              onClick={handleSearchToggle}
              className="w-12 h-12 bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200 flex items-center justify-center"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>
          ) : (
            /* Desktop: Expanded Search */
            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={handleInputFocus}
                  onKeyDown={handleKeyDown}
                  placeholder="Search for places in Nigeria..."
                  className="w-full pl-10 pr-10 py-3 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-400"
                />
                <button
                  onClick={handleSearchToggle}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Loading indicator */}
                {isLoading && (
                  <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>

              {/* Desktop Search Results */}
              {(showResults || showRecent) && (
                <div className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-80 overflow-y-auto z-[60]">
                  {/* Recent Searches */}
                  {showRecent && recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                        <div className="flex items-center text-xs font-medium text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          Recent Searches
                        </div>
                        <button
                          onClick={clearRecentSearches}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Clear
                        </button>
                      </div>
                      {recentSearches.map((recent, index) => (
                        <button
                          key={recent.id}
                          onClick={() => handleRecentSelect(recent)}
                          className={`w-full px-4 py-3 text-left border-b border-gray-50 last:border-b-0 transition-colors ${
                            showRecent && selectedIndex === index
                              ? 'bg-blue-50 border-blue-100'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start">
                            <MapPin className="w-4 h-4 mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm text-gray-900 truncate">
                                {recent.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {recent.display_name}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Search Results */}
                  {showResults && results.length > 0 && (
                    <div>
                      {showRecent && recentSearches.length > 0 && (
                        <div className="border-t border-gray-100" />
                      )}
                      {results.map((result, index) => (
                        <button
                          key={result.id}
                          onClick={() => handleResultSelect(result)}
                          className={`w-full px-4 py-3 text-left border-b border-gray-50 last:border-b-0 transition-colors ${
                            showResults && selectedIndex === index
                              ? 'bg-blue-50 border-blue-100'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start">
                            <MapPin className="w-4 h-4 mr-3 mt-0.5 text-blue-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm text-gray-900 truncate">
                                {result.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {result.display_name}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* No Results */}
                  {showResults && query.length >= 2 && results.length === 0 && !isLoading && (
                    <div className="px-4 py-6 text-center text-gray-500">
                      <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <div className="text-sm">No places found</div>
                      <div className="text-xs">Try searching with a different term</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default MapSearch;
