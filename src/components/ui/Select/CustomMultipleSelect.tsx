import { useState, useEffect, useRef } from "react";
import { Key } from "@react-types/shared";
import { FiChevronDown } from "react-icons/fi";

interface ItemChild {
    key: string;
    label: string;
    flag?: string;
}

interface ItemInterface {
    key: string;
    label: string;
    flag?: string;
    children?: ItemChild[];
}

interface CustomMultipleSelectProps {
    items: ItemInterface[];
    label?: string;
    placeholder?: string;
    value?: Set<Key>;
    onChange?: (keys: Set<Key>) => void;
    className?: string;
    baseClassName?: string;
    dropDownClassName?: string;
    itemClassName?: string;
    hideDropdownLabel?: boolean;
    hideDropdownSearch?: boolean;
    enableCheckboxHeader?: boolean;
    enableSelectionDropdown?: boolean;
    hideTagRendering?: boolean;
    showModal?: boolean;
    onClose?: () => void;
    limitValueLength?: number;
}

interface SelectedTag {
    key: Key;
    label: string;
    flag?: string;
}

const CustomMultipleSelect = (props: CustomMultipleSelectProps) => {
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(props.showModal || false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const selectRef = useRef<HTMLDivElement>(null);
    const hideDropdownLabel = props.hideDropdownLabel || false;
    const hideDropdownSearch = props.hideDropdownSearch || false;
    const enableCheckboxHeader = props.enableCheckboxHeader || false;
    const enableSelectionDropdown = props.enableSelectionDropdown || false;
    const hideTagRendering = props.hideTagRendering || false;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowDropdown(false);
                setSearch("");
                props.onClose?.();
            }
        };

        if (isOpen || props.showModal) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, props.showModal]);

    useEffect(() => {
        setIsOpen(props.showModal || false);
    }, [props.showModal]);

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

    const getSelectedTags = (): SelectedTag[] => {
        const selectedKeys = Array.from(props.value || new Set());
        return (selectedKeys as Key[]).map((key: Key) => {
            for (const section of props.items) {
                const child = section.children?.find(child => child.key === key);
                if (child) {
                    return { key: child.key, label: child.label };
                }
            }
            return { key, label: String(key) };
        });
    };

    const handleRemoveTag = (tagKey: Key) => {
        if (props.value) {
            const newSelection = new Set<Key>(props.value);
            newSelection.delete(tagKey);
            props.onChange?.(newSelection);
        }
    };

    const isSelectionLimitReached = () => {
        return props.limitValueLength !== undefined &&
            (props.value?.size || 0) >= props.limitValueLength;
    };

    const renderTags = () => {
        const tags = getSelectedTags();
        const limit = props.limitValueLength;

        if (!hideDropdownLabel && tags.length == 0) {
            return <span className="text-gray-400">{props.placeholder}</span>;
        }

        const displayTags = limit ? tags.slice(0, limit) : tags;

        
        return (
            <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                {displayTags.map(tag => (
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

    const areAllChildrenSelected = (item: ItemInterface) => {
        if (!item.children) return false;
        return item.children.every(child => props.value?.has(child.key));
    };

    const handleHeaderCheckboxChange = (item: ItemInterface) => {
        if (!item.children) return;
        const newSelection = new Set(props.value || new Set<Key>());
        const allSelected = areAllChildrenSelected(item);

        item.children.forEach(child => {
            if (allSelected) {
                newSelection.delete(child.key);
            } else {
                newSelection.add(child.key);
            }
        });
        props.onChange?.(newSelection);
    };

    const toggleSection = (key: string) => {
        const newExpandedSections = new Set(expandedSections);
        if (newExpandedSections.has(key)) {
            newExpandedSections.delete(key);
        } else {
            newExpandedSections.add(key);
        }
        setExpandedSections(newExpandedSections);
    };

    return (
        <div className={`w-full relative ${props.baseClassName}`} ref={selectRef} translate="no">
            <div
                className={`w-full px-4 py-2 border border-gray-300 rounded-md flex items-center justify-between cursor-pointer ${props.className || ''}`}
                onClick={!hideDropdownLabel ? handleClick : undefined}
            >
                {!hideTagRendering && (<div className="flex-1">{renderTags()}</div>)}
                {!hideDropdownLabel ? (<div onClick={(e) => {
                    toggleDropdown();
                }}>
                    <FiChevronDown className={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />

                </div>) : ''}
            </div>
            {isOpen && (
                <div className={`${getDropdownStyles()} ${!isOpen ? 'hidden' : ''} ${props.dropDownClassName}`}>
                    {!hideDropdownSearch ? (<div className="sticky top-0 bg-white p-4 z-10">
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            placeholder="Search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>) : ''}
                    <div className="overflow-y-auto">
                        {filteredItems.map((item, index) => (
                            <div
                                key={item.key}
                                className={`border-b border-[#E5E5E5] last:border-b-0`}
                            >
                                <div
                                    className={`flex items-center gap-2 h-[48px] px-4 ${enableSelectionDropdown ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                                    onClick={() => enableSelectionDropdown && toggleSection(item.key)}
                                >
                                    {enableCheckboxHeader && (
                                        <input
                                            type="checkbox"
                                            className="form-checkbox h-4 w-4 text-[#E36B00]"
                                            checked={areAllChildrenSelected(item)}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                handleHeaderCheckboxChange(item);
                                            }}
                                            readOnly
                                        />
                                    )}
                                    <span className="font-semibold text-[#494D5D]">{item.label}</span>
                                    {enableSelectionDropdown && (
                                        <FiChevronDown
                                            className={`ml-auto transition-transform ${expandedSections.has(item.key) ? 'rotate-180' : ''}`}
                                        />
                                    )}
                                </div>
                                {(!enableSelectionDropdown || expandedSections.has(item.key)) && (
                                    <div className="space-y-0">
                                        {item.children?.map((child) => (
                                            <div
                                                key={child.key}
                                                className={`flex items-center gap-2 h-[40px] px-6 cursor-pointer hover:bg-gray-50 
                                                    ${props.itemClassName} 
                                                    ${isSelectionLimitReached() && !props.value?.has(child.key) ? 'opacity-50 !cursor-default' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const newSelection = new Set(props.value || new Set<Key>());
                                                    if (newSelection.has(child.key)) {
                                                        newSelection.delete(child.key);
                                                        props.onChange?.(newSelection);
                                                    } else if (!isSelectionLimitReached()) {
                                                        newSelection.add(child.key);
                                                        props.onChange?.(newSelection);
                                                    }
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="form-checkbox h-4 w-4 text-[#E36B00]"
                                                    checked={props.value?.has(child.key)}
                                                    readOnly
                                                />
                                                {child.flag && (
                                                    <img
                                                        src={child.flag}
                                                        alt={`${child.label} flag`}
                                                        className="w-4 h-4 rounded-full"
                                                    />
                                                )}
                                                <span className="font-medium">{child.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomMultipleSelect;
