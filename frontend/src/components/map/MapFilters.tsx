import React, { useState, useRef, useEffect } from "react";
import { useMap } from "../../contexts/MapContext";
import { ISSUE_TYPES, ISSUE_STATUS } from "../../utils/constants";
import {
    Filter,
    X,
    Move,
    Minimize2,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

const MapFilters: React.FC = () => {
    const { filters, setFilters, clearFilters, filteredIssues, issues } =
        useMap();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 16, y: 16 }); // Initial position (top-left)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const filterRef = useRef<HTMLDivElement>(null);

    // Check if we're on mobile
    const isMobile = window.innerWidth < 768;

    const handleStatusFilter = (status: string) => {
        const newStatusFilters = filters.status.includes(status)
            ? filters.status.filter((s) => s !== status)
            : [...filters.status, status];

        setFilters({ ...filters, status: newStatusFilters });
    };

    const handleTypeFilter = (type: string) => {
        const newTypeFilters = filters.type.includes(type)
            ? filters.type.filter((t) => t !== type)
            : [...filters.type, type];

        setFilters({ ...filters, type: newTypeFilters });
    };

    const hasActiveFilters =
        filters.status.length > 0 || filters.type.length > 0;

    // Drag handling
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!filterRef.current) return;

        const rect = filterRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
        setIsDragging(true);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !filterRef.current) return;

        const mapContainer = filterRef.current.parentElement;
        if (!mapContainer) return;

        const mapRect = mapContainer.getBoundingClientRect();
        const filterRect = filterRef.current.getBoundingClientRect();

        let newX = e.clientX - mapRect.left - dragOffset.x;
        let newY = e.clientY - mapRect.top - dragOffset.y;

        // Constrain to map boundaries
        newX = Math.max(0, Math.min(newX, mapRect.width - filterRect.width));
        newY = Math.max(0, Math.min(newY, mapRect.height - filterRect.height));

        setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Touch handling for mobile
    const handleTouchStart = (e: React.TouchEvent) => {
        if (!filterRef.current) return;

        const touch = e.touches[0];
        const rect = filterRef.current.getBoundingClientRect();
        setDragOffset({
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
        });
        setIsDragging(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!isDragging || !filterRef.current) return;
        e.preventDefault();

        const touch = e.touches[0];
        const mapContainer = filterRef.current.parentElement;
        if (!mapContainer) return;

        const mapRect = mapContainer.getBoundingClientRect();
        const filterRect = filterRef.current.getBoundingClientRect();

        let newX = touch.clientX - mapRect.left - dragOffset.x;
        let newY = touch.clientY - mapRect.top - dragOffset.y;

        // Constrain to map boundaries
        newX = Math.max(0, Math.min(newX, mapRect.width - filterRect.width));
        newY = Math.max(0, Math.min(newY, mapRect.height - filterRect.height));

        setPosition({ x: newX, y: newY });
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    // Add event listeners
    useEffect(() => {
        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            document.addEventListener("touchmove", handleTouchMove, {
                passive: false,
            });
            document.addEventListener("touchend", handleTouchEnd);

            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
                document.removeEventListener("touchmove", handleTouchMove);
                document.removeEventListener("touchend", handleTouchEnd);
            };
        }
    }, [isDragging, dragOffset]);

    // Auto-minimize on mobile when there are active filters
    useEffect(() => {
        if (isMobile && hasActiveFilters && !isMinimized) {
            setIsCollapsed(true);
        }
    }, [isMobile, hasActiveFilters]);

    if (isMinimized) {
        return (
            <div
                ref={filterRef}
                className={`bg-white rounded-lg shadow-lg border border-gray-200 cursor-pointer transition-all duration-200 ${
                    isDragging ? "shadow-xl scale-105" : ""
                }`}
                style={{
                    position: "absolute",
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    zIndex: 10,
                }}
                onClick={() => setIsMinimized(false)}
            >
                <div
                    className="p-3 flex items-center justify-center"
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                >
                    <Filter className="h-5 w-5 text-emerald-600" />
                    {hasActiveFilters && (
                        <span className="ml-2 bg-emerald-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {filters.status.length + filters.type.length}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            ref={filterRef}
            className={`bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-200 ${
                isMobile ? "max-w-xs" : "max-w-sm"
            } ${isDragging ? "shadow-xl scale-105" : ""}`}
            style={{
                position: "absolute",
                left: `${position.x}px`,
                top: `${position.y}px`,
                zIndex: 10,
            }}
        >
            {/* Header with drag handle and controls */}
            <div
                className="flex items-center justify-between p-3 bg-gray-50 rounded-t-lg border-b border-gray-200 cursor-move"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                <div className="flex items-center">
                    <Move className="h-4 w-4 text-gray-400 mr-2" />
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                        <Filter className="h-4 w-4 mr-2 text-emerald-600" />
                        Filters
                    </h3>
                    {hasActiveFilters && (
                        <span className="ml-2 bg-emerald-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {filters.status.length + filters.type.length}
                        </span>
                    )}
                </div>

                <div className="flex items-center space-x-1">
                    {/* Collapse/Expand toggle */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                        title={
                            isCollapsed ? "Expand filters" : "Collapse filters"
                        }
                    >
                        {isCollapsed ? (
                            <ChevronDown className="h-4 w-4 text-gray-600" />
                        ) : (
                            <ChevronUp className="h-4 w-4 text-gray-600" />
                        )}
                    </button>

                    {/* Minimize button */}
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                        title="Minimize filters"
                    >
                        <Minimize2 className="h-4 w-4 text-gray-600" />
                    </button>

                    {/* Clear filters button */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="p-1 rounded hover:bg-gray-200 transition-colors"
                            title="Clear all filters"
                        >
                            <X className="h-4 w-4 text-gray-600" />
                        </button>
                    )}
                </div>
            </div>

            {/* Collapsible Content */}
            {!isCollapsed && (
                <div className="p-4">
                    {/* Results Count */}
                    <div className="mb-4 text-sm text-gray-600 bg-gray-50 rounded px-3 py-2">
                        Showing{" "}
                        <span className="font-medium text-emerald-600">
                            {filteredIssues.length}
                        </span>{" "}
                        of <span className="font-medium">{issues.length}</span>{" "}
                        issues
                    </div>

                    {/* Status Filters */}
                    <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                            <div className="w-2 h-2 bg-emerald-600 rounded-full mr-2"></div>
                            Status
                        </h4>
                        <div className="space-y-2">
                            {Object.entries(ISSUE_STATUS).map(
                                ([status, config]) => (
                                    <label
                                        key={status}
                                        className="flex items-center group hover:bg-gray-50 rounded px-2 py-1 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={filters.status.includes(
                                                status
                                            )}
                                            onChange={() =>
                                                handleStatusFilter(status)
                                            }
                                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">
                                            {config.label}
                                        </span>
                                        {filters.status.includes(status) && (
                                            <span className="ml-auto text-xs text-emerald-600 font-medium">
                                                {
                                                    issues.filter(
                                                        (issue) =>
                                                            issue.status ===
                                                            status
                                                    ).length
                                                }
                                            </span>
                                        )}
                                    </label>
                                )
                            )}
                        </div>
                    </div>

                    {/* Type Filters */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                            <div className="w-2 h-2 bg-emerald-600 rounded-full mr-2"></div>
                            Issue Type
                        </h4>
                        <div className="space-y-2">
                            {Object.entries(ISSUE_TYPES).map(
                                ([type, config]) => (
                                    <label
                                        key={type}
                                        className="flex items-center group hover:bg-gray-50 rounded px-2 py-1 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={filters.type.includes(
                                                type
                                            )}
                                            onChange={() =>
                                                handleTypeFilter(type)
                                            }
                                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span className="ml-3 text-sm text-gray-700 flex items-center group-hover:text-gray-900">
                                            <span className="mr-2 text-base">
                                                {config.icon}
                                            </span>
                                            {config.label}
                                        </span>
                                        {filters.type.includes(type) && (
                                            <span className="ml-auto text-xs text-emerald-600 font-medium">
                                                {
                                                    issues.filter(
                                                        (issue) =>
                                                            issue.type === type
                                                    ).length
                                                }
                                            </span>
                                        )}
                                    </label>
                                )
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    {hasActiveFilters && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <button
                                onClick={clearFilters}
                                className="w-full text-sm text-center py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MapFilters;
