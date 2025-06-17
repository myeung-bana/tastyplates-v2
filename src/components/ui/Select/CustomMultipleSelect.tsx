import { useState, useEffect, useRef } from "react";
import { Key } from "@react-types/shared";
import Dropdown from './Dropdown';
import { FiChevronDown } from "react-icons/fi";

interface ItemChild {
    key: string;
    label: string;
}

interface ItemInterface {
    key: string;
    label: string;
    children?: ItemChild[];
}

interface CustomMultipleSelectProps {
    items: ItemInterface[];
    label?: string;
    placeholder?: string;
    value?: Set<Key>;
    onChange?: (keys: Set<Key>) => void;
    className?: string;
}

interface SelectedTag {
    key: Key;
    label: string;
}

const CustomMultipleSelect = (props: CustomMultipleSelectProps) => {
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');
    const containerRef = useRef<HTMLDivElement>(null);
    const selectRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowDropdown(false);
                setSearch("");
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && selectRef.current) {
            const selectRect = selectRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const dropdownHeight = 320; // Approximate max height of dropdown

            // If there's not enough space below, position above
            if (selectRect.bottom + dropdownHeight > windowHeight) {
                setDropdownPosition('top');
            } else {
                setDropdownPosition('bottom');
            }
        }
    }, [isOpen]);

    const filteredItems = props.items
        .map((section) => ({
            ...section,
            children: section.children?.filter((item) =>
                item.label.toLowerCase().includes(search.toLowerCase())
            ),
        }))
        .filter((section) => section.children && section.children.length > 0);

    const handleSelectionChange = (keys: any) => {
        if (keys instanceof Set) {
            props.onChange?.(keys);
        }
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setSearch("");
        }
    };

    const getSelectedTags = (): SelectedTag[] => {
        const tags: SelectedTag[] = [];
        props.items.forEach(section => {
            section.children?.forEach(child => {
                if (props.value?.has(child.key)) {
                    tags.push({ key: child.key, label: child.label });
                }
            });
        });
        return tags;
    };

    const handleRemoveTag = (tagKey: Key) => {
        if (props.value) {
            const newSelection = new Set<Key>(props.value);
            newSelection.delete(tagKey);
            props.onChange?.(newSelection);
        }
    };

    const renderTags = () => {
        const tags = getSelectedTags();

        if (tags.length == 0) {
            return <span className="text-gray-400">{props.placeholder}</span>;
        }

        return (
            <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                {tags.map(tag => (
                    <div
                        key={tag.key}
                        className="flex items-center gap-2 px-2 py-1 bg-[#F1F1F1] rounded-[50px] text-sm group"
                    >
                        <span className="text-[12px]">{tag.label}</span>
                        <span
                            role="button"
                            tabIndex={0}
                            className="text-gray-500 hover:text-gray-700 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTag(tag.key);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleRemoveTag(tag.key);
                                }
                            }}
                        >
                            ×
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    const handleSearchFocus = () => {
        setShowDropdown(!showDropdown);
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
        setShowDropdown(!showDropdown);  // Add this line
    };

    const getDropdownStyles = () => {
        const baseStyles = "absolute left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto !rounded-[24px]";
        return dropdownPosition === 'top'
            ? `${baseStyles} bottom-full mb-1`
            : `${baseStyles} top-full mt-1`;
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleDropdown();
    };

    return (
        <div className="w-full relative" ref={selectRef} translate="no">
            <div
                className={`w-full px-4 py-2 border border-gray-300 rounded-md min-h-[48px] flex items-center justify-between cursor-pointer ${props.className || ''}`}
                onClick={handleClick}
            >
                <div className="flex-1">{renderTags()}</div>
                <div onClick={(e) => {
                    toggleDropdown();
                }}>
                    <FiChevronDown className={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>
            {isOpen && (
                <div 
                    className={`${getDropdownStyles()} ${!isOpen ? 'hidden' : ''}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="sticky top-0 bg-white p-4 z-10">
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            placeholder="Search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="overflow-y-auto">
                        {filteredItems.map((item) => (
                            <div key={item.key} className="py-2 px-4">
                                <div className="font-semibold mb-2">{item.label}</div>
                                {item.children?.map((child) => (
                                    <div
                                        key={child.key}
                                        className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-gray-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const newSelection = new Set(props.value || new Set<Key>());
                                            if (newSelection.has(child.key)) {
                                                newSelection.delete(child.key);
                                            } else {
                                                newSelection.add(child.key);
                                            }
                                            props.onChange?.(newSelection);
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            className="form-checkbox h-4 w-4 text-[#E36B00]"
                                            checked={props.value?.has(child.key)}
                                            readOnly
                                        />
                                        <span className="font-medium">{child.label}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomMultipleSelect;
