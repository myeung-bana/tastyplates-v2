// CustomMultipleSelect.tsx
"use client";
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
    onSelectionChangeWithHeader?: (selectedKeys: Set<Key>, selectedLabel: string | null) => void;
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
        const autoPositionDropdown = () => {
            if (selectRef.current) {
                const selectRect = selectRef.current.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                const dropdownHeight = 320; // Approximate max height of dropdown

                if (selectRect.bottom + dropdownHeight > windowHeight) {
                    setDropdownPosition('top');
                } else {
                    setDropdownPosition('bottom');
                }
            }
        }

        autoPositionDropdown();

        window.addEventListener('resize', autoPositionDropdown);
        return () => {
            window.removeEventListener('resize', autoPositionDropdown);
        }
    }, []);

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
        if (selectedKeys.length === 0) return [];

        const selectedKey = selectedKeys[0]; // Since limitValueLength is 1 now

        // Check if it's a header key
        const headerItem = props.items.find(item => item.key === selectedKey);
        if (headerItem) {
            // If header is selected, display header itself.
            // If you want to show ALL children labels here when header is selected,
            // you'd modify this part to map headerItem.children.
            // For now, it just shows the header's label in the tag.
            return [{ key: headerItem.key, label: headerItem.label }];
        }

        // Check if it's a child key
        for (const section of props.items) {
            const child = section.children?.find(child => child.key === selectedKey);
            if (child) {
                return [{ key: child.key, label: child.label }];
            }
        }
        return []; // Should not happen if value is correctly set
    };

    const handleRemoveTag = (tagKey: Key) => {
        // Since we're enforcing single selection, removing any tag means clearing all.
        const newSelection = new Set<Key>();
        props.onChange?.(newSelection);
        props.onSelectionChangeWithHeader?.(newSelection, null);
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
        setShowDropdown(!showDropdown);
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

    // Helper to check if a child is logically selected, considering if its header is selected
    const isChildLogicallySelected = (childKey: Key, parentHeader: ItemInterface) => {
        // If the header itself is selected, all its children are considered selected.
        if (props.value?.has(parentHeader.key)) {
            return true;
        }
        // Otherwise, check if the specific child is selected.
        return props.value?.has(childKey) || false;
    };

    // Modified: Header checkbox now checks if its own key is selected
    const isHeaderSelected = (item: ItemInterface) => {
        return props.value?.has(item.key) || false;
    };

    const handleHeaderCheckboxChange = (item: ItemInterface) => {
        let newSelection = new Set<Key>();
        let selectedLabel: string | null = null;

        // Determine if the header should be selected or deselected
        const headerIsCurrentlySelected = isHeaderSelected(item);

        if (!headerIsCurrentlySelected) { // If header is not currently selected, select it
            newSelection.add(item.key);
            selectedLabel = item.label;
            // No need to add children keys to newSelection, as we only pass the header key
            // The display logic will infer that children are selected.
        }
        // If it's already selected, clicking will deselect it, leaving newSelection empty and selectedLabel null.

        props.onChange?.(newSelection);
        props.onSelectionChangeWithHeader?.(newSelection, selectedLabel);
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

    const handleChildClick = (e: React.MouseEvent, childKey: Key, childLabel: string, parentHeader: ItemInterface) => {
        e.stopPropagation();

        let newSelection = new Set<Key>();
        let selectedLabel: string | null = null;

        const isCurrentlySelected = isChildLogicallySelected(childKey, parentHeader); // Use logical check

        if (isCurrentlySelected) {
            // If already selected (either directly or via header), deselect all.
            // This assumes single-select model (limitValueLength = 1) where deselecting anything clears all.
            newSelection = new Set<Key>();
            selectedLabel = null;
        } else {
            // If not selected and limit allows, select this child.
            if (!isSelectionLimitReached()) {
                newSelection.add(childKey);
                selectedLabel = childLabel;
            }
        }
        
        props.onChange?.(newSelection);
        props.onSelectionChangeWithHeader?.(newSelection, selectedLabel);
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
                                            checked={isHeaderSelected(item)} // Checks if header's own key is selected
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                handleHeaderCheckboxChange(item);
                                            }}
                                            readOnly // Keep readOnly as the change is handled by onClick of the parent div
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
                                                    ${isSelectionLimitReached() && !isChildLogicallySelected(child.key, item) ? 'opacity-50 !cursor-default' : ''}`} // Adjust opacity based on logical selection
                                                onClick={(e) => handleChildClick(e, child.key, child.label, item)} // Pass the parent header item
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="form-checkbox h-4 w-4 text-[#E36B00]"
                                                    checked={isChildLogicallySelected(child.key, item)} // Use logical check
                                                    readOnly // Keep readOnly as the change is handled by onClick of the parent div
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