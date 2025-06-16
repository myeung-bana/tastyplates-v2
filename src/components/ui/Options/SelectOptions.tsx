import { useEffect, useRef } from "react";

export interface SelectOptionsProps {
    isOpen: boolean;
    options: Array<{ key: string; label: string; children?: any[] }>;
    searchValue: string;
    onSelect: (label: string) => void;
    onClose: () => void;
    isLoading?: boolean;
    className?: string;
}

const SelectOptions = ({
    isOpen,
    options,
    searchValue,
    onSelect,
    onClose,
    isLoading = false,
    className = "",
}: SelectOptionsProps) => {
    const dropdownRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(searchValue.toLowerCase())
    );

    return (
        <ul
            ref={dropdownRef}
            className={`bg-white border border-gray-300 rounded-md mt-1 w-full max-h-48 overflow-y-auto shadow-lg rounded-[24px] text-left ${className}`}
        >
            {isLoading ? (
                <li className="px-4 py-2 text-center text-gray-500 font-medium animate-pulse">
                    Loading...
                </li>
            ) : filteredOptions.length === 0 ? (
                <li className="px-4 py-2 text-center text-gray-400 italic">
                    No results found
                </li>
            ) : (
                filteredOptions.map((option) => (
                    <li
                        key={option.key}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer font-semibold text-[#494D5D]"
                        onClick={() => onSelect(option.label)}
                    >
                        {option.label}
                    </li>
                ))
            )}
        </ul>
    );
};

export default SelectOptions;
