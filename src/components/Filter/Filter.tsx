import "@/styles/components/filter.scss";
import CustomModal from "../ui/Modal/Modal";
import { useEffect, useState } from "react";
import { PiCaretDown } from "react-icons/pi";
import CustomPopover from "../ui/Popover/Popover";
import { CategoryService } from "@/services/category/categoryService";
import { PalatesService } from "@/services/palates/palatestService";
import { ARROW_WARM_UP, STAR } from "@/constants/images";
import { capitalizeFirstLetter } from "@/lib/utils";
import Image from "next/image";

interface FilterProps {
  onFilterChange: (filters: {
    cuisine?: string[] | null;
    price?: string | null;
    rating?: number | null;
    badges?: string | null;
    sortOption?: string | null;
    palates?: string[] | null;
  }) => void;
}

interface Palate {
  key: string;
  label: string;
  children: {
    key: string;
    label: string;
  }[];
}

const categoryService = new CategoryService();
const palateService = new PalatesService();

const Filter = ({ onFilterChange }: FilterProps) => {
  const [selectedCuisines, setSelectedCuisines] = useState<Set<string>>(new Set());
  const [price, setPrice] = useState<string>("");
  const [rating, setRating] = useState<number>(0);
  const [isCuisineOpen, setIsCuisineOpen] = useState<boolean>(false);
  const [isBadgeOpen, setIsBadgeOpen] = useState<boolean>(false);
  const [isPalateOpen, setIsPalateOpen] = useState<boolean>(false);
  const [isSortOpen, setIsSortOpen] = useState<boolean>(false);
  const [expandedPalateItems, setExpandedPalateItems] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>("");
  const [selectedPalates, setSelectedPalates] = useState<Set<string>>(new Set());
  const [badge, setBadge] = useState<string>("All");
  const [sortOption, setSortOption] = useState<string>("None");

  const [dbCuisines, setDbCuisines] = useState<
    { name: string; slug: string }[]
  >([]);
  const [dbPalates, setDbPalates] = useState<Palate[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  const [isLoadingPalates, setIsLoadingPalates] = useState<boolean>(true);

  useEffect(() => {
    categoryService.fetchCategories()
      .then((data) => {
        setDbCuisines((data as unknown as { name: string; slug: string; }[]) || []);
      })
      .catch((error) => console.error("Error fetching categories:", error))
      .finally(() => setIsLoadingCategories(false));
  }, []);

  useEffect(() => {
    palateService.fetchPalates()
      .then((data) => {
        const allChildSlugs = new Set<string>();
        (data as unknown as Record<string, unknown>[])?.forEach((p: Record<string, unknown>) => {
          ((p.children as Record<string, unknown>)?.nodes as Record<string, unknown>[])?.forEach((c: Record<string, unknown>) => {
            allChildSlugs.add((c.slug as string) || (c.databaseId as number).toString());
          });
        });

        const rootPalates = (data as unknown as Record<string, unknown>[])?.filter((p: Record<string, unknown>) =>
          !allChildSlugs.has((p.slug as string) || (p.databaseId as number).toString())
        ) || [];

        const transformedPalates: Palate[] = rootPalates.map((p: Record<string, unknown>) => ({
          key: (p.slug as string) || (p.databaseId as number).toString(),
          label: p.name as string,
          children: ((p.children as Record<string, unknown>)?.nodes as Record<string, unknown>[])?.map((c: Record<string, unknown>) => ({
            key: (c.slug as string) || (c.databaseId as number).toString(),
            label: c.name as string,
          })) || [],
        })) || [];

        setDbPalates(transformedPalates);
      })
      .catch((error) => console.error("Error fetching palates:", error))
      .finally(() => setIsLoadingPalates(false));
  }, []);


  const prices = [
    { name: "$", value: "$" },
    { name: "$$", value: "$$" },
    { name: "$$$", value: "$$$" },
  ];

  const badges = [
    { name: 'All', value: 'All' },
    { name: 'Best Service', value: 'Best Service' },
    { name: 'Insta Worthy', value: 'Insta-Worthy' },
    { name: 'Must Revisit', value: 'Must Revisit' },
    { name: 'Value For Money', value: 'Value for Money' },
  ];

  const sortOptions = [
    { name: 'none', value: 'None' },
    { name: 'ASC', value: 'Ascending (Lowest to Highest)' },
    { name: 'DESC', value: 'Descending (Highest to Lowest)' },
  ];

  const handlePalateChange = (keys: Set<string>) => {
    setSelectedPalates(keys);
  };

  const handleCuisineChange = (slug: string) => {
    setSelectedCuisines((prevSelectedCuisines) => {
      const newSelection = new Set(prevSelectedCuisines);
      if (newSelection.has(slug)) {
        newSelection.delete(slug);
      } else {
        newSelection.add(slug);
      }
      return newSelection;
    });
  };

  const onClickFilter = (type: string) => {
    setIsModalOpen(!isModalOpen);
    setFilterType(type.charAt(0).toUpperCase() + type.slice(1));
  };

  const toggleExpansion = (key: string) => {
    setExpandedPalateItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const getAllPalateKeys = () => {
    const allKeys = new Set<string>();
    dbPalates.forEach(item => {
      allKeys.add(item.key);
      item.children?.forEach(child => {
        allKeys.add(child.key);
      });
    });
    return allKeys;
  };

  const isAllSelected = selectedPalates.size > 0 && Array.from(getAllPalateKeys()).every(key => selectedPalates.has(key));


  const selectFilter = (value: string, type?: string) => {
    switch (type) {
      case 'badge':
        setBadge(value);
        setIsBadgeOpen(false);
        break;
      case 'sortOption':
        setSortOption(value);
        setIsSortOpen(false);
        break;
      default:
        const newSelection = new Set(selectedCuisines);
        if (newSelection.has(value)) {
          newSelection.delete(value);
        } else {
          newSelection.add(value);
        }
        setSelectedCuisines(newSelection);

        setIsCuisineOpen(false);
        break;
    }
  };

  const handleChangePrice = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrice(price === value ? "" : value);
  };

  const palatesArray = Array.from(selectedPalates);
  const cuisinesArray = Array.from(selectedCuisines);

  const resetFilter = () => {
    switch (filterType) {
      case "Cuisine":
        setSelectedCuisines(new Set());
        setSelectedPalates(new Set());
        break;
      case "Price":
        setPrice("");
        break;
      case "Badges":
        setBadge("All");
        setSortOption("None");
        break;
      case "Rating":
        setRating(0);
        break;
      default:
        break;
    }

    // onFilterChange({
    //   cuisine: cuisinesArray, // Send empty array if no cuisines selected
    //   price: price || null,
    //   rating: rating > 0 ? rating : null,
    //   badges: badge === "All" ? null : badge,
    //   sortOption: sortOption === "None" ? null : sortOption,
    //   palates: palatesArray, // Send empty array if no palates selected
    // });

  };

  const applyFilters = () => {


    onFilterChange({
      cuisine: cuisinesArray,
      price: price || null,
      rating: rating > 0 ? rating : null,
      badges: badge === "All" ? null : badge,
      sortOption: sortOption === "None" ? null : sortOption,
      palates: palatesArray,
    });

    setIsModalOpen(false);
  };


  return (
    <>
      <div className="filter">
        <div className="filter__card">
          <div className={`filter__section ${cuisinesArray.length > 0 || palatesArray.length > 0 ? 'bg-[#F1F1F1]' : ''}`}>
            <button
              onClick={() => onClickFilter("cuisine")}
              className="filter__options"
            >
              <span className="filter__label">
                {cuisinesArray.length > 0 || palatesArray.length > 0 ? (
                  <>
                    {[
                      cuisinesArray.length > 0 ? cuisinesArray.join(", ") : null,
                      palatesArray.length > 0
                        ? palatesArray
                          .map(capitalizeFirstLetter)
                          .join(", ")
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" | ")}
                  </>
                ) : (
                  "Cuisines"
                )}
              </span>
            </button>
          </div>

          <div className={"filter__section" + (price !== "" ? " bg-[#F1F1F1]" : "")}>
            <button
              onClick={() => onClickFilter("price")}
              className="filter__options"
            >
              <span className="filter__label">{price !== "" ? price : "Price"}</span>
            </button>
          </div>

          <div className={`filter__section ${badge !== "All" ? 'bg-[#F1F1F1]' : ''}`}>
            <button
              className="filter__options"
              onClick={() => onClickFilter("badges")}
            >
              <span className="filter__label">{badge !== "All" ? badge : "Badges"}</span>
              {sortOption != "None" &&
                <Image
                  src={ARROW_WARM_UP}
                  className={`${sortOption == "ASC" ? 'rotate-0' : 'rotate-180'} size-4 sm:size-5`}
                  alt="arrow up"
                  width={20}
                  height={20}
                />
              }
            </button>
          </div>

          <div className={`filter__section ${rating > 0 ? 'bg-[#F1F1F1]' : ''}`}>
            <button
              onClick={() => onClickFilter("rating")}
              className="filter__options"
            >
              <Image src={STAR} className="size-4 sm:size-5" alt="star" width={20} height={20} />
              <span className="filter__label">{rating > 0 ? 'Over ' + rating : "Rating"}</span>
            </button>
          </div>
        </div>
      </div>
      <CustomModal
        header={filterType}
        content={
          <>
            {filterType == "Cuisine" && (
              <div className="flex flex-col gap-4">
                <div className="w-full">
                  <label
                    htmlFor=""
                    className="text-xs md:text-base font-semibold"
                  >
                    Category
                  </label>
                  <CustomPopover
                    isOpen={isCuisineOpen}
                    setIsOpen={setIsCuisineOpen}
                    align="center"
                    trigger={
                      <button
                        onClick={() => setIsCuisineOpen(!isCuisineOpen)}
                        className="w-full box-border border border-[#797979] mt-2 rounded-[10px] h-auto min-h-10 px-4 md:px-6 flex items-start gap-2 text-[#31343F] py-[11px] relative"> {/* Added relative, items-start, removed flex-wrap, justify-between */}
                        <span className="text-[#31343F] text-start font-semibold flex-grow block"> {/* Added block */}
                          {selectedCuisines.size > 0
                            ? Array.from(selectedCuisines).map(slug => {
                              const cuisine = dbCuisines.find(c => c.slug === slug || c.name === slug);
                              return cuisine?.name || slug;
                            }).join(", ")
                            : "Select Cuisine"}
                        </span>
                        <PiCaretDown className={`fill-[#494D5D] size-5 flex-shrink-0 absolute right-4 top-1/2 -translate-y-1/2`} /> {/* Absolute positioning */}
                      </button>
                    }
                    content={
                      <div
                        className="bg-white flex flex-col py-2 pr-2 rounded-2xl text-[#494D5D] overflow-y-auto w-[334px] md:w-[440px] max-h-[300px] shadow-[0px_0px_10px_1px_#E5E5E5]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          onClick={() => setSelectedCuisines(new Set())}
                          className={`py-2 px-4 ${selectedCuisines.size === 0 ? "bg-[#F1F1F1]" : "bg-transparent"
                            } text-sm md:text-lg font-semibold cursor-pointer`}
                        >
                          All
                        </div>
                        {isLoadingCategories ? (
                          <div className="py-2 px-4 text-sm md:text-lg">Loading categories...</div>
                        ) : (
                          dbCuisines.map((item: { name: string, slug: string }, index: number) => (
                            <div
                              key={index}
                              className={`py-2 px-4 flex items-center gap-2 cursor-pointer hover:bg-gray-50`}
                              onClick={() => handleCuisineChange(item.slug || item.name)}
                            >
                              <input
                                type="checkbox"
                                className="form-checkbox h-4 w-4 text-[#E36B00]"
                                checked={selectedCuisines.has(item.slug || item.name)}
                                readOnly
                              />
                              <label className="text-sm md:text-lg font-semibold">
                                {item.name}
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    }
                  />
                </div>
                <div className="w-full">
                  <label
                    htmlFor=""
                    className="text-xs md:text-base font-semibold"
                  >
                    Palate
                  </label>
                  <CustomPopover
                    isOpen={isPalateOpen}
                    setIsOpen={setIsPalateOpen}
                    align="center"
                    trigger={
                      <button
                        onClick={() => setIsPalateOpen(!isPalateOpen)}
                        className="w-full border border-[#797979] mt-2 rounded-[10px] h-auto min-h-10 px-4 md:px-6 flex items-start gap-2 text-[#31343F] py-[11px] relative"
                      >
                        <span className="text-[#31343F] text-start font-semibold flex-grow block">
                          {selectedPalates.size > 0
                            ? Array.from(selectedPalates).map(slug => {
                              const palate = dbPalates.find(p => p.key === slug);
                              return palate
                                ? palate.label
                                : dbPalates.flatMap(p => p.children).find(c => c.key === slug)?.label || slug;
                            }).join(', ')
                            : 'Select your palate'}
                        </span>
                        <PiCaretDown
                          className={`fill-[#494D5D] size-5 ${isPalateOpen ? 'rotate-180' : ''} flex-shrink-0 absolute right-4 top-1/2 -translate-y-1/2`}
                        />
                      </button>
                    }
                    content={
                      <div className="bg-white flex flex-col gap-2 py-2 pr-2 rounded-2xl text-[#494D5D] overflow-y-auto w-full md:w-[440px] max-h-[300px] shadow-[0px_0px_10px_1px_#E5E5E5]">
                        <div
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            const newSet = new Set(selectedPalates);
                            if (isAllSelected) {
                              newSet.clear();
                            } else {
                              getAllPalateKeys().forEach(key => newSet.add(key));
                            }
                            handlePalateChange(newSet);
                          }}
                          className={`w-full py-2 px-4 md:py-3 md:px-6 flex justify-between items-center gap-2 ${isAllSelected ? 'bg-[#F1F1F1]' : 'bg-transparent' // Use isAllSelected for styling
                            } text-sm md:text-lg font-semibold border-b border-[#E5E5E5]`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="form-checkbox h-4 w-4 text-[#E36B00]"
                              checked={isAllSelected}
                              readOnly
                            />
                            <span className="text-sm md:text-base font-semibold w-full">All</span>
                          </div>
                          <PiCaretDown
                            className={`fill-[#494D5D] size-5 ${isAllSelected ? 'rotate-180' : ''}`}
                          />
                        </div>

                        {isLoadingPalates ? (
                          <div className="py-2 px-4 text-sm md:text-lg">Loading palates...</div>
                        ) : (
                          dbPalates.map((item: Palate) => (
                            <div key={item.key} className="">
                              <div
                                className="font-semibold flex items-center gap-2 py-2 px-4 md:py-3 md:px-6"
                              >
                                <div
                                  className="flex items-center gap-2 flex-grow cursor-pointer"
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    const newSelection = new Set(selectedPalates);
                                    // Toggle parent selection
                                    if (newSelection.has(item.key)) {
                                      newSelection.delete(item.key);
                                    } else {
                                      newSelection.add(item.key);
                                    }

                                    // Also toggle all children if the parent is toggled
                                    item.children?.forEach(child => {
                                      if (newSelection.has(item.key)) { // If parent is now selected, select children
                                        newSelection.add(child.key);
                                      } else { // If parent is now deselected, deselect children
                                        newSelection.delete(child.key);
                                      }
                                    });

                                    handlePalateChange(newSelection);
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    className="form-checkbox h-4 w-4 text-[#E36B00]"
                                    checked={selectedPalates.has(item.key) && (!item.children || item.children.every(child => selectedPalates.has(child.key)))}
                                    readOnly
                                  />
                                  <label htmlFor="">{item.label}</label>
                                </div>

                                {item.children && item.children.length > 0 && (
                                  <PiCaretDown
                                    className={`fill-[#494D5D] size-5 cursor-pointer ${expandedPalateItems.has(item.key) ? 'rotate-180' : ''
                                      }`}
                                    onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      toggleExpansion(item.key);
                                    }}
                                  />
                                )}
                              </div>
                              {item.children?.map(child => (
                                <div
                                  key={child.key}
                                  className={`${expandedPalateItems.has(item.key) ? 'flex' : 'hidden'
                                    } items-center gap-2 py-2 px-4 md:py-3 md:px-6 cursor-pointer hover:bg-gray-50`}
                                  onClick={e => {
                                    e.stopPropagation();
                                    const newSelection = new Set(selectedPalates);
                                    if (newSelection.has(child.key)) {
                                      newSelection.delete(child.key);
                                    } else {
                                      newSelection.add(child.key);
                                    }
                                    handlePalateChange(newSelection);
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    className="form-checkbox h-4 w-4 text-[#E36B00]"
                                    checked={selectedPalates.has(child.key)}
                                    readOnly
                                  />
                                  <span className="font-medium">{child.label}</span>
                                </div>
                              ))}
                            </div>
                          ))
                        )}
                      </div>
                    }
                  />
                </div>
              </div>
            )}
            {filterType == "Price" && (
              <div className="grid grid-cols-3 gap-2 border-[1.5px] border-[#797979] rounded-xl p-2">
                {prices.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-nowrap items-center gap-2"
                  >
                    <div
                      className={`w-full rounded-[8px] py-1 px-6 ${price === item.value
                        ? "bg-[#F1F1F1]"
                        : "bg-transparent"
                        }`}
                    >
                      <input
                        id={`price-${index}`}
                        type="checkbox"
                        name="price"
                        value={item.value as string}
                        checked={price === item.value}
                        onChange={handleChangePrice}
                        className="appearance-none size-6 absolute hidden inset-0"
                      />
                      <label
                        htmlFor={`price-${index}`}
                        className="block text-[#494D5D] cursor-pointer w-full text-center whitespace-pre font-semibold text-xs md:text-base"
                      >
                        {item.name}
                      </label>
                    </div>
                    {index < prices.length - 1 && (
                      <div
                        className={`${index < prices.length - 1 ? "block" : "hidden"
                          } my-auto border-r-[1.5px] h-4/5 border-[#797979] w-fit`}
                      ></div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {filterType == "Badges" && (
              <div className="flex flex-col gap-4">
                <div className="w-full">
                  <label
                    htmlFor=""
                    className="text-xs md:text-base font-semibold"
                  >
                    Badges
                  </label>
                  <CustomPopover
                    isOpen={isBadgeOpen}
                    setIsOpen={setIsBadgeOpen}
                    align="center"
                    trigger={
                      <button
                        onClick={() => setIsBadgeOpen(!isBadgeOpen)}
                        className="w-full border border-[#797979] mt-2 rounded-[10px] h-10 md:h-12 px-4 md:px-6 flex flex-row flex-nowrap justify-between items-center gap-2 text-[#31343F]">
                        <span className="text-[#31343F] text-center font-semibold">
                          {badge === "all" ? "All" : badges?.find(b => b.name === badge)?.value || "All"}
                        </span>
                        <PiCaretDown className="fill-[#494D5D] size-5 flex-shrink-0" />
                      </button>
                    }
                    content={
                      <div className="bg-white flex flex-col py-2 pr-2 rounded-2xl text-[#494D5D] overflow-y-auto w-[334px] md:w-[440px] max-h-[252px] shadow-[0px_0px_10px_1px_#E5E5E5]">
                        {badges?.map((item: Record<string, unknown>, index: number) => (
                          <div
                            onClick={() => selectFilter(item.name as string, 'badge')}
                            className={`py-2 px-4 ${badge == item.name
                              ? "bg-[#F1F1F1]"
                              : "bg-transparent"
                              } text-sm md:text-lg font-semibold`}
                            key={index}
                          >
                            {item.value as string}
                          </div>
                        ))}
                      </div>
                    }
                  />
                </div>
                <div className="w-full">
                  <label
                    htmlFor=""
                    className="text-xs md:text-base font-semibold"
                  >
                    Sort By
                  </label>
                  <CustomPopover
                    isOpen={isSortOpen}
                    setIsOpen={setIsSortOpen}
                    align="center"
                    trigger={
                      <button
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="w-full border border-[#797979] mt-2 rounded-[10px] h-10 md:h-12 px-4 md:px-6 flex flex-row flex-nowrap justify-between items-center gap-2 text-[#31343F]">
                        <span className="text-[#31343F] text-center font-semibold">
                          {sortOption === "none" ? "None" : sortOptions.find(s => s.name === sortOption)?.value || "None"}
                        </span>
                        <PiCaretDown className="fill-[#494D5D] size-5 flex-shrink-0" />
                      </button>
                    }
                    content={
                      <div className="bg-white flex flex-col py-2 pr-2 rounded-2xl text-[#494D5D] overflow-y-auto w-[334px] md:w-[440px] max-h-[252px] shadow-[0px_0px_10px_1px_#E5E5E5]">
                        {sortOptions.map((item, index) => (
                          <div
                            onClick={() => selectFilter(item.name, 'sortOption')}
                            className={`py-2 px-4 ${sortOption == item.name
                              ? "bg-[#F1F1F1]"
                              : "bg-transparent"
                              } text-sm md:text-lg font-semibold`}
                            key={index}
                          >
                            {item.value as string}
                          </div>
                        ))}
                      </div>
                    }
                  />
                </div>
              </div>
            )}
            {filterType == "Rating" && (
              <div className="flex flex-col items-start gap-4">
                <label
                  htmlFor="rating"
                  className="text-xs font-medium"
                >
                  Over {rating}
                </label>
                <input
                  type="range"
                  id="rating"
                  name="rating"
                  value={rating}
                  min="1"
                  max="5"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRating(Number(e.target.value))}
                  className="w-full filter__rating"
                />
                <div className="w-full mt-2 flex justify-between items-center gap-10">
                  <span className="text-xs font-medium">1</span>
                  <span className="text-xs font-medium">2</span>
                  <span className="text-xs font-medium">3</span>
                  <span className="text-xs font-medium">4</span>
                  <span className="text-xs font-medium">5</span>
                </div>
              </div>
            )}
          </>
        }
        hasFooter
        footer={
          <div className="flex gap-2 md:gap-4 justify-center">
            <button
              onClick={resetFilter}
              className="w-[163px] md:w-[212px] py-2 px-[62px] md:px-16 border-[1.5px] border-[#494D5D] rounded-[8px] text-[#494D5D] text-sm md:text-lg font-semibold"
            >
              Reset
            </button>
            <button
              onClick={applyFilters}
              className="w-[163px] md:w-[212px] rounded-[8px] bg-[#E36B00] py-2 px-[62px] md:px-16 text-[#FCFCFC] text-sm md:text-lg font-semibold"
            >
              Apply
            </button>
          </div>
        }
        footerClass="!px-4 md:!px-6 !justify-center"
        contentClass="!px-4 md:!p-6"
        baseClass="!max-w-[366px] md:!max-w-[488px]"
        isOpen={isModalOpen}
        setIsOpen={() => setIsModalOpen(!isModalOpen)}
      />
    </>
  );
};

export default Filter;