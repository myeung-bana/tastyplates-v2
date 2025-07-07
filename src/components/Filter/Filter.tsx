// Filter.tsx
// components/Filter/Filter.tsx
import { GiRoundStar } from "react-icons/gi";
import "@/styles/components/filter.scss";
import { MdStar, MdStarOutline } from "react-icons/md";
import CustomModal from "../ui/Modal/Modal";
import { Key, useEffect, useState } from "react";
import { PiCaretDown } from "react-icons/pi";
import CustomPopover from "../ui/Popover/Popover";
import { CategoryService } from "@/services/category/categoryService";
import { PalatesService } from "@/services/palates/palatestService";

interface FilterProps {
  onFilterChange: (filters: {
    cuisine?: string | null;
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

const Filter = ({ onFilterChange}: FilterProps) => { // Changed from initialCuisine
  const [currentCuisine, setCurrentCuisine] = useState<string>("All"); // Use currentCuisine for internal state
  const [price, setPrice] = useState<string>("");
  const [rating, setRating] = useState<number>(0);
  const [isCuisineOpen, setIsCuisineOpen] = useState<boolean>(false);
  const [isPriceOpen, setIsPriceOpen] = useState<boolean>(false);
  const [isBadgeOpen, setIsBadgeOpen] = useState<boolean>(false);
  const [isRatingOpen, setIsRatingOpen] = useState<boolean>(false);
  const [isPalateOpen, setIsPalateOpen] = useState<boolean>(false);
  const [isSortOpen, setIsSortOpen] = useState<boolean>(false);

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
    CategoryService.fetchCategories()
      .then((data) => {
        setDbCuisines(data || []);
      })
      .catch((error) => console.error("Error fetching categories:", error))
      .finally(() => setIsLoadingCategories(false));
  }, []);

  useEffect(() => {
    PalatesService.fetchPalates()
      .then((data) => {
        const allChildSlugs = new Set<string>();
        data?.forEach((p: any) => {
          p.children?.nodes?.forEach((c: any) => {
            allChildSlugs.add(c.slug || c.databaseId.toString());
          });
        });

        const rootPalates = data?.filter((p: any) =>
          !allChildSlugs.has(p.slug || p.databaseId.toString())
        ) || [];

        const transformedPalates: Palate[] = rootPalates.map((p: any) => ({
          key: p.slug || p.databaseId.toString(),
          label: p.name,
          children: p.children?.nodes?.map((c: any) => ({
            key: c.slug || c.databaseId.toString(),
            label: c.name,
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

  const onClickFilter = (type: string) => {
    setIsModalOpen(!isModalOpen);
    setFilterType(type.charAt(0).toUpperCase() + type.slice(1));
  };

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
      default: // For Cuisine
        setCurrentCuisine(value); // Use setCurrentCuisine
        setIsCuisineOpen(false);
        break;
    }
  };

  const handleChangePrice = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrice(price === value ? "" : value);
  };

  const resetFilter = () => {
    switch (filterType) {
      case "Cuisine":
        setCurrentCuisine("All"); // Use setCurrentCuisine
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
  };

  const applyFilters = () => {
    const palatesArray = Array.from(selectedPalates);

    onFilterChange({
      cuisine: currentCuisine === "All" ? null : currentCuisine, // Use currentCuisine
      price: price || null,
      rating: rating > 0 ? rating : null,
      badges: badge === "All" ? null : badge,
      sortOption: sortOption === "None" ? null : sortOption,
      palates: palatesArray
    });
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="filter">
        <div className="filter__card">
          <div className="filter__section">
            <button
              onClick={() => onClickFilter("cuisine")}
              className="filter__options"
            >
              <span className="filter__label">Cuisine</span>
            </button>
          </div>

          <div className="filter__section">
            <button
              onClick={() => onClickFilter("price")}
              className="filter__options"
            >
              <span className="filter__label">Price</span>
            </button>
          </div>

          <div className="filter__section">
            <button
              className="filter__options"
              onClick={() => onClickFilter("badges")}
            >
              <span className="filter__label">{badge !== "" ? badge : "Badges"}</span>
              <img
                src="/images/arrow_warm_up.svg"
                className="size-4 sm:size-5"
                alt="arrow up"
              />
            </button>
          </div>

          <div className="filter__section">
            <button
              onClick={() => onClickFilter("rating")}
              className="filter__options"
            >
              <img src="/star.svg" className="size-4 sm:size-5" alt="star" />
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
                    align="bottom-end"
                    trigger={
                      <button
                        onClick={() => setIsCuisineOpen(!isCuisineOpen)}
                        className="w-full border border-[#797979] mt-2 rounded-[10px] h-10 px-4 md:px-6 flex flex-row flex-nowrap justify-between items-center gap-2 text-[#31343F]">
                        <span className="text-[#31343F] text-center font-semibold">
                          {currentCuisine} {/* Use currentCuisine */}
                        </span>
                        <PiCaretDown className="fill-[#494D5D] size-5 flex-shrink-0" />
                      </button>
                    }
                    content={
                      <div className="bg-white flex flex-col py-2 pr-2 rounded-2xl text-[#494D5D] overflow-y-auto w-full md:w-[440px] max-h-[300px] shadow-[0px_0px_10px_1px_#E5E5E5]">
                        <div
                          onClick={() => selectFilter("All")}
                          className={`py-2 px-4 ${currentCuisine == "All" ? "bg-[#F1F1F1]" : "bg-transparent" // Use currentCuisine
                            } text-sm md:text-lg font-semibold`}
                        >
                          All
                        </div>
                        {isLoadingCategories ? (
                          <div className="py-2 px-4 text-sm md:text-lg">Loading categories...</div>
                        ) : (
                          dbCuisines.map((item: { name: string, slug: string }, index: number) => (
                            <div
                              onClick={() => selectFilter(item.slug || item.name)}
                              className={`py-2 px-4 ${currentCuisine == (item.slug || item.name)
                                  ? "bg-[#F1F1F1]"
                                  : "bg-transparent"
                                } text-sm md:text-lg font-semibold`}
                              key={index}
                            >
                              {item.name}
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
                    align="bottom-end"
                    trigger={
                      <button
                        onClick={() => setIsPalateOpen(!isPalateOpen)}
                        className="w-full border border-[#797979] mt-2 rounded-[10px] h-10 px-4 md:px-6 flex flex-row flex-nowrap justify-between items-center gap-2 text-[#31343F]"
                      >
                        <span className="text-[#31343F] text-center font-semibold">
                          {selectedPalates.size > 0
                            ? Array.from(selectedPalates).join(", ")
                            : "Select your palate"}
                        </span>
                        <PiCaretDown
                          className={`fill-[#494D5D] size-5 ${isPalateOpen ? "rotate-180" : ""
                            }`}
                        />
                      </button>
                    }
                    content={
                      <div className="bg-white flex flex-col gap-2 py-2 pr-2 rounded-2xl text-[#494D5D] overflow-y-auto w-full md:w-[440px] max-h-[300px] shadow-[0px_0px_10px_1px_#E5E5E5]">
                        <div
                          onClick={(e: any) => {
                            e.stopPropagation();
                            let newSet = new Set(selectedPalates);
                            if (newSet.has("all")) {
                              newSet.delete("all");
                            } else {
                              newSet.clear();
                              newSet.add("all");
                            }
                            handlePalateChange(newSet);
                          }}
                          className={`w-full py-2 px-4 md:py-3 md:px-6 flex justify-between items-center gap-2 ${selectedPalates.has("all") ? "bg-[#F1F1F1]" : "bg-transparent"
                            } text-sm md:text-lg font-semibold border-b border-[#E5E5E5]`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="form-checkbox h-4 w-4 text-[#E36B00]"
                              checked={selectedPalates.has("all")}
                              readOnly
                            />
                            <span className="text-sm md:text-base font-semibold w-full">All</span>
                          </div>
                          <PiCaretDown
                            className={`fill-[#494D5D] size-5 ${selectedPalates.has("all") ? "rotate-180" : ""
                              }`}
                          />
                        </div>

                        {isLoadingPalates ? (
                          <div className="py-2 px-4 text-sm md:text-lg">Loading palates...</div>
                        ) : (
                          dbPalates.map((item: Palate) => (
                            <div key={item.key} className="">
                              <div
                                className="font-semibold flex items-center gap-2 py-2 px-4 md:py-3 md:px-6"
                                onClick={(e: any) => {
                                  e.stopPropagation();
                                  const newSelection = new Set(selectedPalates);
                                  if (newSelection.has("all")) newSelection.delete("all");
                                  if (newSelection.has(item.key)) {
                                    newSelection.delete(item.key);
                                  } else {
                                    newSelection.add(item.key);
                                  }
                                  handlePalateChange(newSelection);
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    className="form-checkbox h-4 w-4 text-[#E36B00]"
                                    checked={selectedPalates.has(item.key)}
                                    readOnly
                                  />
                                  <label htmlFor="">{item.label}</label>
                                </div>
                                <PiCaretDown
                                  className={`fill-[#494D5D] size-5 ${selectedPalates.has(item.key) ? "rotate-180" : ""
                                    }`}
                                />
                              </div>
                              {item.children?.map((child) => (
                                <div
                                  key={child.key}
                                  className={`${selectedPalates.has(item.key) ? "flex" : "hidden"} items-center gap-2 py-2 px-4 md:py-3 md:px-6 cursor-pointer hover:bg-gray-50`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newSelection = new Set(selectedPalates);
                                    if (newSelection.has("all")) newSelection.delete("all");
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
                                  <span className="font-medium">
                                    {child.label}
                                  </span>
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
                      className={`w-full rounded-[8px] py-3 px-6 ${price === item.value
                          ? "bg-[#F1F1F1]"
                          : "bg-transparent"
                        }`}
                    >
                      <input
                        id={`price-${index}`}
                        type="checkbox"
                        name="price"
                        value={item.value}
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
                    align="bottom-end"
                    trigger={
                      <button
                        onClick={() => setIsBadgeOpen(!isBadgeOpen)}
                        className="w-full border border-[#797979] mt-2 rounded-[10px] h-10 px-4 md:px-6 flex flex-row flex-nowrap justify-between items-center gap-2 text-[#31343F]">
                        <span className="text-[#31343F] text-center font-semibold">
                          {badge === "all" ? "All" : badges?.find(b => b.name === badge)?.value || "All"}
                        </span>
                        <PiCaretDown className="fill-[#494D5D] size-5 flex-shrink-0" />
                      </button>
                    }
                    content={
                      <div className="bg-white flex flex-col py-2 pr-2 rounded-2xl text-[#494D5D] overflow-y-auto w-[334px] max-h-[252px] shadow-[0px_0px_10px_1px_#E5E5E5]">
                        {badges?.map((item: any, index: number) => (
                          <div
                            onClick={() => selectFilter(item.name, 'badge')}
                            className={`py-2 px-4 ${badge == item.name
                              ? "bg-[#F1F1F1]"
                              : "bg-transparent"
                              } text-sm md:text-lg font-semibold`}
                            key={index}
                          >
                            {item.value}
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
                    align="bottom-end"
                    trigger={
                      <button
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="w-full border border-[#797979] mt-2 rounded-[10px] h-10 px-4 md:px-6 flex flex-row flex-nowrap justify-between items-center gap-2 text-[#31343F]">
                        <span className="text-[#31343F] text-center font-semibold">
                          {sortOption === "none" ? "None" : sortOptions.find(s => s.name === sortOption)?.value || "None"}
                        </span>
                        <PiCaretDown className="fill-[#494D5D] size-5 flex-shrink-0" />
                      </button>
                    }
                    content={
                      <div className="bg-white flex flex-col py-2 pr-2 rounded-2xl text-[#494D5D] overflow-y-auto w-[334px] max-h-[252px] shadow-[0px_0px_10px_1px_#E5E5E5]">
                        {sortOptions.map((item, index) => (
                          <div
                            onClick={() => selectFilter(item.name, 'sortOption')}
                            className={`py-2 px-4 ${sortOption == item.name
                              ? "bg-[#F1F1F1]"
                              : "bg-transparent"
                              } text-sm md:text-lg font-semibold`}
                            key={index}
                          >
                            {item.value}
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
                  className="text-xs md:text-base font-semibold"
                >
                  Over {rating}
                </label>
                <input
                  type="range"
                  id="rating"
                  name="rating"
                  value={rating}
                  max="5"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRating(Number(e.target.value))}
                  className="w-full"
                ></input>
              </div>
            )}
          </>
        }
        hasFooter
        footer={
          <div className="flex gap-2 md:gap-4 justify-center">
            <button
              onClick={resetFilter}
              className="py-2 px-16 border-[1.5px] border-[#494D5D] rounded-[8px] text-[#494D5D] text-sm md:text-lg font-semibold"
            >
              Reset
            </button>
            <button
              onClick={applyFilters}
              className="rounded-[8px] bg-[#E36B00] py-2 px-16 text-[#FCFCFC] text-sm md:text-lg font-semibold"
            >
              Apply
            </button>
          </div>
        }
        contentClass="md:!p-6"
        baseClass="!max-w-[488px]"
        isOpen={isModalOpen}
        setIsOpen={() => setIsModalOpen(!isModalOpen)}
      />
    </>
  );
};

export default Filter;