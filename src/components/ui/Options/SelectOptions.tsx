import { useEffect, useRef, useCallback } from "react";

export interface SelectOptionsProps {
    isOpen: boolean;
    options: Array<{ key: string; label: string; children?: Record<string, unknown>[] }>;
    searchValue: string;
    onSelect: (label: string) => void;
    onClose: () => void;
    onLoadMore?: () => void;
    isLoading?: boolean;
    className?: string;
    hasNextPage?: boolean;
}

const SelectOptions = ({
    isOpen,
    options,
    searchValue,
    onSelect,
    onClose,
    onLoadMore,
    isLoading = false,
    className = "",
    hasNextPage = false,
}: SelectOptionsProps) => {
    const dropdownRef = useRef<HTMLUListElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadingRef = useRef<HTMLDivElement>(null);

    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const target = entries[0];
            if (target?.isIntersecting && !isLoading && hasNextPage) {
                onLoadMore?.();
            }
        },
        [isLoading, onLoadMore, hasNextPage]
    );

    useEffect(() => {
        const currentLoader = loadingRef.current;

        if (currentLoader) {
            observerRef.current = new IntersectionObserver(handleObserver, {
                root: dropdownRef.current,
                threshold: 1.0,
            });

            observerRef.current.observe(currentLoader);
        }

        return () => {
            if (observerRef.current && currentLoader) {
                observerRef.current.unobserve(currentLoader);
            }
        };
    }, [handleObserver]);

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
            className={`bg-white border border-gray-300 mt-1 w-full max-h-48 overflow-y-auto shadow-lg rounded-[24px] text-left ${className}`}
        >
            {
                (isLoading && !hasNextPage) ? (
                    <li className="px-4 py-2 text-center text-gray-500 font-medium animate-pulse">
                        Loading...
                    </li>
                ) : filteredOptions.length === 0 ? (
                    <li className="px-4 py-2 text-center text-gray-400 italic">
                        No results found
                    </li>
                ) : (
                    <>
                        {filteredOptions.map((option, index) => (
                            <li
                                key={`${option.key}-${index}`}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer font-semibold text-[#494D5D]"
                                onClick={() => onSelect(option.label)}
                            >
                                {option.label}
                            </li>
                        ))}
                        <div ref={loadingRef} className={isLoading && hasNextPage ? 'h-4' : ''}>
                            {isLoading && hasNextPage && (
                                <div className="px-4 py-2 text-center text-gray-500 font-medium animate-pulse">
                                    Load more...
                                </div>
                            )}
                        </div>
                    </>
                )
            }
        </ul>
    );
};

export default SelectOptions;