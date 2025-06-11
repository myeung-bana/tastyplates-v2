import { GiRoundStar } from "react-icons/gi";
import "@/styles/components/filter.scss";
import { MdStar, MdStarOutline } from "react-icons/md";
import CustomModal from "../ui/Modal/Modal";
import { Key, useEffect, useState } from "react";
import { PiCaretDown } from "react-icons/pi";
import CustomPopover from "../ui/Popover/Popover";
import { cuisines } from "@/data/dummyCuisines";
import { palateOptions } from "@/constants/formOptions";

interface FilterProps {
  onFilterChange?: (filterType: string, value: string) => void;
}

const Filter = ({ onFilterChange }: FilterProps) => {
  const [cuisine, setCuisine] = useState<string>("All");
  const [price, setPrice] = useState<string>();
  const [rating, setRating] = useState<number>(0);
  const [isCuisineOpen, setIsCuisineOpen] = useState<boolean>(false);
  const [isPriceOpen, setIsPriceOpen] = useState<boolean>(false);
  const [isBadgeOpen, setIsBadgeOpen] = useState<boolean>(false);
  const [isRatingOpen, setIsRatingOpen] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>("");
  const [selectedPalates, setSelectedPalates] = useState<Set<Key>>(new Set());
  const [badge, setBadge] = useState<string>("");
  const [sortOption, setSortOption] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState<string[]>([]);
  console.log('dp here', dropdownOpen)
  const prices = [
    {
      name: "$",
      value: "$",
    },
    {
      name: "$$",
      value: "$$",
    },
    {
      name: "$$$",
      value: "$$$",
    },
  ];

  const badges = [
    {
      name: "all",
      value: "All",
    },
    {
      name: "best-service",
      value: "Best Service",
    },
    {
      name: "insta-worthy",
      value: "Insta-Worthy",
    },
    {
      name: "must-revisit",
      value: "Must Revisit",
    },
    {
      name: "value-for-money",
      value: "Value for Money",
    },
  ];

  const sortOptions = [
    {
      name: "ascending",
      value: "Ascending(Lowest to Highest)",
    },
    {
      name: "descending",
      value: "Descending(Highest to Lowest)",
    },
  ];

  const allPalates = palateOptions.flatMap(group => group.children);

  const handlePalateChange = (keys: Set<Key>) => {
    setSelectedPalates(keys);
  };

  const palateList = {
    label: "Palate (Select up to 2 palates)",
    type: "multiple-select",
    placeholder: "Select your palate",
    value: selectedPalates,
    onChange: handlePalateChange,
    items: palateOptions,
  };

  const onClickFilter = (type: string) => {
    setIsModalOpen(!isModalOpen);

    switch (type) {
      case "cuisine":
        setFilterType("Cuisine");
        break;
      case "price":
        setFilterType("Price");
        break;
      case "badges":
        setFilterType("Badges");
        break;
      case "rating":
        setFilterType("Rating");
        break;
      default:
        break;
    }
  };

  const selectFilter = (value: string, type?: string) => {
    switch (type) {
      case "badge":
        setBadge(value);
        break;
      case "sortOption":
        setSortOption(value);
        break;
      default:
        setCuisine(value);
        break;
    }
  };

  const handleChangePrice = (e: any) => {
    console.log("listing", price);
    setPrice(e.target.value);
  };

  const resetFilter = () => {
    switch (filterType) {
      case "Cuisine":
        setCuisine("");
        setSelectedPalates(new Set());
        break;
      case "Price":
        setPrice("");
        break;
      case "Badges":
        setBadge("");
        setSortOption("");
        break;
      case "Rating":
        setRating(0);
        break;
      default:
        break;
    }
  };

  const applyFilter = () => {
    switch (filterType) {
      case "Cuisine":
        // code here
        break;
      case "Price":
        // code here
        break;
      case "Badges":
        // code here
        break;
      case "Rating":
        // code here
        break;
      default:
        break;
    }
    setIsModalOpen(false)
  };

  const renderPalates = () => {
    return Array.from(selectedPalates).join(', ');
    // return selectedPalates.forEach((item) => item.join(","))
  }

  const toggleCaret = (type: string) => {
    const index = dropdownOpen.findIndex((dropdown => dropdown == type))
    // console.log(index, 'index', type)
    if (index != -1) {
       setDropdownOpen(dropdownOpen.filter((item => item !== type)))
    } else {
      setDropdownOpen([...dropdownOpen, type])
    }
  }

  useEffect(()=> {
    console.log(dropdownOpen, 'dropdown open')
  }, [dropdownOpen])

  return (
    <>
      <div className="filter">
        <div className="filter__card">
          {/* <div className="filter__header">
            <h2 className="filter__title">
              <FiFilter className="filter__icon" />
              Filters
            </h2>
          </div> */}

          <div className="filter__section max-w-[247px] md:max-w-[293px]">
            <button
              onClick={() => onClickFilter("cuisine")}
              className="filter__options"
            >
              <div className="filter__label line-clamp-1 text-left">
                {cuisine !== '' ? cuisine : 'Cuisine'}
                <span className="h-full w-0 border-l-2 border-[#31343F] mx-1"></span>
                {renderPalates()}
              </div>
            </button>
          </div>

          <div className="filter__section">
            <button
              onClick={() => onClickFilter("price")}
              className="filter__options"
            >
              <span className="filter__label">{price ? price : "Price"}</span>
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
                    isOpen={isDropdownOpen}
                    // setIsOpen={setIsDropdownOpen}
                    align="bottom-end"
                    // onClose={isDropdownOpen}
                    trigger={
                      <button className="w-full border border-[#797979] mt-2 rounded-[10px] h-10 px-4 md:px-6 flex flex-row flex-nowrap justify-between items-center gap-2 text-[#31343F]">
                        <span className="text-[#31343F] text-center font-semibold">
                          {cuisine}
                        </span>
                        <PiCaretDown className="fill-[#494D5D] size-5 flex-shrink-0" />
                      </button>
                      // </>
                    }
                    content={
                      <div className="bg-white flex flex-col py-2 pr-2 rounded-2xl text-[#494D5D] overflow-y-auto w-full md:w-[440px] max-h-[300px] shadow-[0px_0px_10px_1px_#E5E5E5]">
                        <div
                          onClick={() => selectFilter("All")}
                          className={`py-2 px-4 ${
                            cuisine == "All" ? "bg-[#F1F1F1]" : "bg-transparent"
                          } text-sm md:text-lg font-semibold`}
                        >
                          All
                        </div>
                        {cuisines.map((item: any, index: number) => (
                          <div
                            onClick={() => selectFilter(item.name)}
                            className={`py-2 px-4 ${
                              cuisine == item.name
                                ? "bg-[#F1F1F1]"
                                : "bg-transparent"
                            } text-sm md:text-lg font-semibold`}
                            key={index}
                          >
                            {item.name}
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
                    Palate
                  </label>
                  <CustomPopover
                    isOpen={isDropdownOpen}
                    // setIsOpen={setIsDropdownOpen}
                    align="bottom"
                    // onClose={isDropdownOpen}
                    trigger={
                      <button
                        // onClick={() => setIsDropdownOpen(false)}
                        className="w-full border border-[#797979] mt-2 rounded-[10px] h-10 px-4 md:px-6 flex flex-row flex-nowrap justify-between items-center gap-2 text-[#31343F]"
                      >
                        <span className="text-[#31343F] text-left font-semibold line-clamp-1">
                          {renderPalates()}
                        </span>
                        <PiCaretDown
                          className={`fill-[#494D5D] size-5 flex-shrink-0 ${
                            isDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      // </>
                    }
                    content={
                      <div className="bg-white flex flex-col gap-2 py-2 pr-2 rounded-2xl text-[#494D5D] overflow-y-auto w-full md:w-[440px] max-h-[300px] shadow-[0px_0px_10px_1px_#E5E5E5]">
                        <div
                          className={`w-full py-2 px-4 md:py-3 md:px-6 flex justify-between items-center gap-2 ${
                            selectedPalates.size == allPalates.length ? "bg-[#F1F1F1]" : "bg-transparent"
                          } text-sm md:text-lg font-semibold border-b border-[#E5E5E5]`}
                        >
                          <div
                            onClick={(e: any) => {
                              e.stopPropagation();
                              let set = new Set(
                                selectedPalates || new Set<Key>()
                              );
                              if (set.size == allPalates.length) {
                                set.clear();
                              } else {
                                set.clear()
                                // set.add(allPalates.map(child => child.key));
                                allPalates.map((child => set.add(child.label)))
                              }
                              handlePalateChange?.(set);
                            }}
                            className="flex items-center gap-2 w-[20rem]"
                          >
                            <input
                              type="checkbox"
                              className="form-checkbox h-4 w-4 text-[#E36B00]"
                              checked={selectedPalates.size == allPalates.length}
                              readOnly
                            />
                            <span className="text-sm md:text-base font-semibold w-full">All</span>
                          </div>
                          <button
                          type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleCaret('All')
                            }}
                          >
                            <PiCaretDown
                            className={`fill-[#494D5D] size-5 flex-shrink-0 ${
                              dropdownOpen.filter((item => item == 'All')).length > 0 ? "rotate-180" : ""
                            }`}
                          />
                          </button>
                        </div>
                          <div className={`${dropdownOpen.filter((item => item == 'All')).length > 0 ? 'block' : 'hidden'}`}>
                            {palateOptions.map((item) =>
                        (
                          <div key={item.key} className="">
                            <div
                              className={`${ item.children.flatMap((child => child.label)).every(item => selectedPalates.has(item)) ? "bg-[#F1F1F1]" : "bg-transparent"} flex font-semibold items-center justify-between py-2 px-4 md:py-3 md:px-6`}
                            >
                              <div
                                onClick={(e: any) => {
                                  e.stopPropagation();
                                  const itemChildren = item.children.flatMap((child => child.label))
  
                                  let set = new Set(
                                    selectedPalates || new Set<Key>()
                                  );
                                  console.log(itemChildren, 'item', itemChildren.every(item => set.has(item)))
                                  if (itemChildren.every(item => set.has(item))) {
                                    itemChildren.map((child => set.delete(child)));
                                  } else {
                                    itemChildren.map((child => set.add(child)));
                                  }
                                  handlePalateChange?.(set);
                                }}
                                className="flex items-center gap-2 w-[20rem]"
                              >
                                <input
                                  type="checkbox"
                                  className="form-checkbox h-4 w-4 text-[#E36B00]"
                                  checked={
                                    item.children.flatMap((child => child.label)).every(item => selectedPalates.has(item))
                                  }
                                  readOnly
                                />
                                <label htmlFor="" className="w-full text-sm md:text-base font-semibold">{item.label}</label>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleCaret(item.label)
                                }}
                              >
                                <PiCaretDown
                                className={`fill-[#494D5D] size-5 flex-shrink-0 ${
                                   dropdownOpen.filter((item2 => item2 == item.label)).length > 0
                                    ? "rotate-180"
                                    : ""
                                }`}
                              />
                              </button>
                            </div>
                           <div className={`${dropdownOpen.filter((item2 => item2 == item.label)).length > 0 ? 'block' : 'hidden'}`}>
                             {item.children?.map((child) => (
                              <div
                                key={child.key}
                                className={`${selectedPalates?.has(child.label) ? "bg-[#F1F1F1]" : "bg-transparent"} flex items-center gap-2 py-2 px-4 md:py-3 md:px-6 cursor-pointer hover:bg-gray-50`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newSelection = new Set(
                                    selectedPalates || new Set<Key>()
                                  );
                                  if (newSelection.has(child.label)) {
                                    newSelection.delete(child.label);
                                  } else {
                                    newSelection.add(child.label);
                                  }
                                  handlePalateChange?.(newSelection);
                                }}
                              >
                                <input
                                  type="checkbox"
                                  className="form-checkbox h-4 w-4 text-[#E36B00]"
                                  checked={
                                    selectedPalates?.has(child.label)
                                  }
                                  readOnly
                                />
                                <span className="text-sm md:text-base font-semibold">
                                  {child.label}
                                </span>
                              </div>
                            ))}
                           </div>
                          </div>
                        ))}
                          </div>
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
                      className={`w-full rounded-[8px] py-3 px-6 ${
                        price == item.value
                          ? "bg-[#F1F1F1]"
                          : "bg-transparent"
                      }`}
                    >
                      <input
                        id={`price-${index}`}
                        type="checkbox"
                        name="price"
                        value={item.value}
                        checked={price == item.value}
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
                        className={`${
                          index < prices.length - 1 ? "block" : "hidden"
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
                    isOpen={isDropdownOpen}
                    // setIsOpen={setIsDropdownOpen}
                    align="bottom-end"
                    // onClose={isDropdownOpen}
                    trigger={
                      <button className="w-full border border-[#797979] mt-2 rounded-[10px] h-10 px-4 md:px-6 flex flex-row flex-nowrap justify-between items-center gap-2 text-[#31343F]">
                        <span className="text-[#31343F] text-center font-semibold">
                          {badge}
                        </span>
                        <PiCaretDown className="fill-[#494D5D] size-5 flex-shrink-0" />
                      </button>
                      // </>
                    }
                    content={
                      <div className="bg-white flex flex-col py-2 pr-2 rounded-2xl text-[#494D5D] overflow-y-auto w-[334px] max-h-[252px] shadow-[0px_0px_10px_1px_#E5E5E5]">
                        {badges.map((item: any, index: number) => (
                          <div
                            onClick={() => selectFilter(item.value, "badge")}
                            className={`py-2 px-4 ${
                              badge == item.value
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
                    isOpen={isDropdownOpen}
                    // setIsOpen={setIsDropdownOpen}
                    align="bottom-end"
                    // onClose={isDropdownOpen}
                    trigger={
                      <button className="w-full border border-[#797979] mt-2 rounded-[10px] h-10 px-4 md:px-6 flex flex-row flex-nowrap justify-between items-center gap-2 text-[#31343F]">
                        <span className="text-[#31343F] text-center font-semibold">
                          {sortOption}
                        </span>
                        <PiCaretDown className="fill-[#494D5D] size-5 flex-shrink-0" />
                      </button>
                      // </>
                    }
                    content={
                      <div className="bg-white flex flex-col py-2 pr-2 rounded-2xl text-[#494D5D] overflow-y-auto w-[334px] max-h-[252px] shadow-[0px_0px_10px_1px_#E5E5E5]">
                        {sortOptions.map((item: any, index: number) => (
                          <div
                            onClick={() =>
                              selectFilter(item.name, "sortOption")
                            }
                            className={`py-2 px-4 ${
                              sortOption == item.name
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
                  onChange={(e: any) => setRating(e.target.value)}
                  className="w-full filter__rating"
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
            <button onClick={applyFilter} className="rounded-[8px] bg-[#E36B00] py-2 px-16 text-[#FCFCFC] text-sm md:text-lg font-semibold">
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
