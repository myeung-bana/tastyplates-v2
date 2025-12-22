// CustomMultipleSelect.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { Key } from "@react-types/shared";
import { FiChevronDown } from "react-icons/fi";
import Image from "next/image";

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
    const selectionLimit = props.limitValueLength ?? Infinity;

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
    }, [isOpen, props.showModal, props]);

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
        const tags: SelectedTag[] = [];

        for (const selectedKey of selectedKeys) {
            const headerItem = props.items.find(item => item.key === selectedKey);
            if (headerItem) {
                tags.push({ key: headerItem.key, label: headerItem.label, flag: headerItem.flag });
                continue; 
            }
            for (const section of props.items) {
                const child = section.children?.find(c => c.key === selectedKey);
                if (child) {
                    tags.push({ key: child.key, label: child.label, flag: child.flag });
                    break;
                }
            }
        }
        return tags;
    };

    const handleRemoveTag = (tagKey: Key) => {
        const newSelection = new Set(props.value);
        newSelection.delete(tagKey);

        let selectedLabel: string | null = null;
        if (newSelection.size > 0) {
            const firstKey = newSelection.values().next().value;
            for (const item of props.items) {
                if (item.key === firstKey) {
                    selectedLabel = item.label;
                    break;
                }
                if (item.children) {
                    const child = item.children.find(c => c.key === firstKey);
                    if (child) {
                        selectedLabel = child.label;
                        break;
                    }
                }
            }
        }

        props.onChange?.(newSelection);
        props.onSelectionChangeWithHeader?.(newSelection, selectedLabel);
    };

    const isSelectionLimitReached = () => {
        return (props.value?.size || 0) >= selectionLimit;
    };

    const renderTags = () => {
        const tags = getSelectedTags();

        if (!hideDropdownLabel && tags.length === 0) {
            return <span className="text-gray-400">{props.placeholder}</span>;
        }

        const displayTags = selectionLimit !== Infinity ? tags.slice(0, selectionLimit) : tags;

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
        // A child is logically selected if its specific key is in the set
        // OR if its parent header's key is in the set (implying all children are selected visually).
        return props.value?.has(childKey) || props.value?.has(parentHeader.key) || false;
    };

    // Header checkbox `checked` state
    const isHeaderSelected = (item: ItemInterface) => {
        return props.value?.has(item.key) || false;
    };

    const handleHeaderCheckboxChange = (item: ItemInterface) => {
        const currentSelection = new Set(props.value);
        const newSelection = new Set(currentSelection); // Start with current selection
        let selectedLabel: string | null = null;

        const headerIsCurrentlySelected = currentSelection.has(item.key);

        if (headerIsCurrentlySelected) {
            // If header is currently selected, deselect it.
            newSelection.delete(item.key);
        } else {
            // If header is not currently selected, attempt to select it.
            // Only add if there's space.
            if (newSelection.size < selectionLimit) {
                newSelection.add(item.key);
            }
        }

        // Determine selectedLabel for callback
        if (newSelection.size > 0) {
            const firstKey = newSelection.values().next().value;
            const item = props.items.find(i => i.key === firstKey || i.children?.some(c => c.key === firstKey));
            if (item) {
                if (item.key === firstKey) { selectedLabel = item.label; }
                else { selectedLabel = item.children?.find(c => c.key === firstKey)?.label || null; }
            }
        } else {
            selectedLabel = null;
        }

        props.onChange?.(newSelection);
        props.onSelectionChangeWithHeader?.(newSelection, selectedLabel);
        // Do NOT automatically close dropdown here, user might want to select another item if limit allows.
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

        const currentSelection = new Set(props.value);
        const newSelection = new Set(currentSelection);
        let selectedLabel: string | null = null;

        const isCurrentlyLogicallySelected = isChildLogicallySelected(childKey, parentHeader);

        if (isCurrentlyLogicallySelected) {
            // If child is currently selected (either directly or via header):
            if (newSelection.has(parentHeader.key)) {
                // If it was selected because its header was in the Set, deselect the header.
                newSelection.delete(parentHeader.key);
            }
            if (newSelection.has(childKey)) {
                // If the child's own key was in the Set, deselect it.
                newSelection.delete(childKey);
            }
        } else {
            // If child is NOT logically selected, try to select it.
            if (newSelection.size < selectionLimit) {
                newSelection.add(childKey);
            } else {
                // If limit reached, do nothing. User can't select more.
            }
        }

        // Determine selectedLabel for callback
        if (newSelection.size > 0) {
            const firstKey = newSelection.values().next().value;
            const item = props.items.find(i => i.key === firstKey || i.children?.some(c => c.key === firstKey));
            if (item) {
                if (item.key === firstKey) { selectedLabel = item.label; }
                else { selectedLabel = item.children?.find(c => c.key === firstKey)?.label || null; }
            }
        } else {
            selectedLabel = null;
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
                {!hideDropdownLabel ? (<div onClick={() => {
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
                        {filteredItems.map((item) => (
                            <div
                                key={item.key}
                                className={`border-b border-[#E5E5E5] last:border-b-0`}
                            >
                                <div
                                    className={`flex items-center gap-2 h-[48px] px-4 ${enableSelectionDropdown ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                                    onClick={(e) => {
                                        const target = e.target as HTMLElement;
                                        // Prevent toggle if the click is on the checkbox
                                        if (enableSelectionDropdown && !target.classList.contains('checkbox-no-toggle')) {
                                            toggleSection(item.key);
                                        }
                                    }}
                                >
                                    {enableCheckboxHeader && (
                                        <input
                                            type="checkbox"
                                            className="form-checkbox h-4 w-4 text-[#ff7c0a] checkbox-no-toggle"
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
                                                    className="form-checkbox h-4 w-4 text-[#ff7c0a]"
                                                    checked={isChildLogicallySelected(child.key, item)}
                                                    readOnly
                                                />
                                                {child.flag && (
                                                    <Image
                                                        src={child.flag}
                                                        alt={`${child.label} flag`}
                                                        width={24}
                                                        height={16}
                                                        className="rounded-md"
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