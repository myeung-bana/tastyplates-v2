import { useRef, useEffect } from 'react';

interface DropdownProps {
    isOpen: boolean;
    onClose: () => void;
    searchValue: string;
    onSearchChange: (value: string) => void;
    children: React.ReactNode;
}

const Dropdown = ({ isOpen, onClose, searchValue, onSearchChange, children }: DropdownProps) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            ref={dropdownRef}
            className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50"
        >
            <div className="p-2 border-b border-gray-200">
                <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div className="max-h-[200px] overflow-y-auto">
                {children}
            </div>
        </div>
    );
};

export default Dropdown;
