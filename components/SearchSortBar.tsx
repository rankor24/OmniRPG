
import React from 'react';
import { SearchIcon, XIcon } from './icons';

export interface SortOption {
  value: string;
  label: string;
}

interface SearchSortBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortOption?: string;
  onSortChange?: (value: string) => void;
  sortOptions?: SortOption[];
  placeholder?: string;
  className?: string;
  children?: React.ReactNode; // For additional filters/buttons
}

const SearchSortBar: React.FC<SearchSortBarProps> = ({
  searchTerm,
  onSearchChange,
  sortOption,
  onSortChange,
  sortOptions,
  placeholder = "Search...",
  className = "",
  children
}) => {
  return (
    <div className={`mb-6 flex flex-col md:flex-row gap-4 ${className}`}>
      <div className="relative flex-grow z-10">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-text-secondary" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-10 py-2 border border-tertiary rounded-lg leading-5 bg-tertiary text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent sm:text-sm transition-all duration-200 shadow-sm"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-text-primary cursor-pointer"
            aria-label="Clear search"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 z-10">
        {children}
        
        {sortOptions && onSortChange && (
          <div className="relative min-w-[160px]">
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value)}
              className="block w-full pl-3 pr-8 py-2 text-base border border-tertiary rounded-lg bg-tertiary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent sm:text-sm appearance-none transition-all duration-200 cursor-pointer shadow-sm"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
               <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchSortBar;
