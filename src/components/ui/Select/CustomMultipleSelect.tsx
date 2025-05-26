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
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
    };

    return (
        <div className="relative" translate="no">
            <div
                className={`bg-red w-full px-4 py-2 border border-gray-300 rounded-md min-h-[48px] flex items-center justify-between cursor-pointer ${isOpen ? 'ring-2 ring-blue-500' : ''}`}
                onClick={(e) => {
                    toggleDropdown();
                }}
            >
                <div className="flex-1">{renderTags()}</div>
                <div onClick={(e) => {
                    toggleDropdown();
                }}>
                    <FiChevronDown className={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>
            <Dropdown
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                searchValue={search}
                onSearchChange={setSearch}
            >
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
            </Dropdown>
        </div>
    );
};

export default CustomMultipleSelect;
