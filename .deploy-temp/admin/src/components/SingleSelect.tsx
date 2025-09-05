import { useState, useRef, useEffect } from 'react';

export type SingleSelectOption = {
  label: string;
  value: string;
};

type SingleSelectProps = {
  options: SingleSelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onCreateNew?: (label: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
};

export function SingleSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  onCreateNew,
  disabled = false,
  className = '',
}: SingleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [creatingNew, setCreatingNew] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if search term matches any existing option
  const exactMatch = options.find(option =>
    option.label.toLowerCase() === searchTerm.toLowerCase()
  );

  // Show "Create new" option when there's a search term and no exact match
  const showCreateNew = searchTerm.trim() && !exactMatch && onCreateNew && !creatingNew;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleCreateNew = async () => {
    if (!onCreateNew || !searchTerm.trim()) return;
    
    setCreatingNew(true);
    try {
      await onCreateNew(searchTerm.trim());
      onChange(searchTerm.trim());
      setIsOpen(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Failed to create new option:', error);
    } finally {
      setCreatingNew(false);
    }
  };

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
          ${isOpen ? 'ring-2 ring-emerald-500 border-emerald-500' : ''}
        `}
      >
        {selectedOption ? (
          <span className="text-gray-900">{selectedOption.label}</span>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <span className="text-gray-400">▼</span>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {/* Search input */}
          <div className="p-2 border-b">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search or type to create new..."
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Options list */}
          <div className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 focus:outline-none focus:bg-emerald-50
                    ${option.value === value ? 'bg-emerald-100 text-emerald-900' : 'text-gray-900'}
                  `}
                >
                  {option.label}
                </button>
              ))
            ) : searchTerm && !showCreateNew ? (
              <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
            ) : null}

            {/* Create new option */}
            {showCreateNew && (
              <button
                onClick={handleCreateNew}
                disabled={creatingNew}
                className="w-full text-left px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 focus:outline-none focus:bg-emerald-50 disabled:opacity-50 border-t"
              >
                {creatingNew ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    Creating "{searchTerm}"...
                  </span>
                ) : (
                  <span>+ Create "{searchTerm}"</span>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}