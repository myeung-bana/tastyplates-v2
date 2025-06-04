import { GiRoundStar } from "react-icons/gi";
import "@/styles/components/filter.scss";
import { MdStar, MdStarOutline } from "react-icons/md";
import CustomModal from "../ui/Modal/Modal";
import { Key, useState } from "react";
import { PiCaretDown } from "react-icons/pi";
import CustomPopover from "../ui/Popover/Popover";
import { cuisines } from "@/data/dummyCuisines";
import { palateOptions } from "@/constants/formOptions";

interface FilterProps {
  onFilterChange?: (filterType: string, value: string) => void;
}

const Filter = ({ onFilterChange }: FilterProps) => {
  const [cuisine, setCuisine] = useState<string>("All");
  const [price, setPrice] = useState<boolean[]>([false, false, false]);
  const [rating, setRating] = useState<number>(0);
  const [isCuisineOpen, setIsCuisineOpen] = useState<boolean>(false);
  const [isPriceOpen, setIsPriceOpen] = useState<boolean>(false);
  const [isBadgeOpen, setIsBadgeOpen] = useState<boolean>(false);
  const [isRatingOpen, setIsRatingOpen] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>("");
  const [selectedPalates, setSelectedPalates] = useState<Set<Key>>(new Set());

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
  const handlePalateChange = (keys: Set<Key>) => {
    console.log(keys, "keys");
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
      case "rating":
        setFilterType("Rating");
        break;
      default:
        break;
    }
  };

  const selectFilter = (value: string, type?: string) => {
    setCuisine(value);
    setIsDropdownOpen(false);
  };

  const handleChangePrice = (e: any) => {
    console.log("listing", price);
    setPrice([
      e.target.value == "$",
      e.target.value == "$$",
      e.target.value == "$$$",
    ]);
  };

  const resetFilter = () => {
    switch (filterType) {
      case "Cuisine":
        setCuisine("");
        break;
      case "Price":
        setPrice([]);
        break;
    }
  };

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
            <button className="filter__options">
              <span className="filter__label">Badges</span>
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
              <span className="filter__label">Rating</span>
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
                    onClose={isDropdownOpen}
                    trigger={
                      <button className="w-full border border-[#797979] mt-2 rounded-[10px] h-10 px-4 md:px-6 flex flex-row flex-nowrap justify-between items-center gap-2 text-[#31343F]">
                        <span className="text-[#31343F] text-center font-semibold">
                          {cuisine}
                        </span>
                        <PiCaretDown className="fill-[#494D5D] size-5" />
                      </button>
                      // </>
                    }
                    content={
                      <div className="bg-white flex flex-col gap-2 py-2 pr-2 rounded-2xl text-[#494D5D] overflow-y-auto w-[334px] max-h-[252px] shadow-[0px_0px_10px_1px_#E5E5E5]">
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
                    align="bottom-end"
                    onClose={isDropdownOpen}
                    trigger={
                      <button
                        onClick={() => setIsDropdownOpen(false)}
                        className="w-full border border-[#797979] mt-2 rounded-[10px] h-10 px-4 md:px-6 flex flex-row flex-nowrap justify-between items-center gap-2 text-[#31343F]"
                      >
                        <span className="text-[#31343F] text-center font-semibold">
                          {selectedPalates}
                        </span>
                        <PiCaretDown
                          className={`fill-[#494D5D] size-5 ${
                            isDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      // </>
                    }
                    content={
                      <div className="bg-white flex flex-col gap-2 py-2 pr-2 rounded-2xl text-[#494D5D] overflow-y-auto w-[334px] max-h-[252px] shadow-[0px_0px_10px_1px_#E5E5E5]">
                        <div
                          onClick={(e: any) => {
                            e.stopPropagation();
                            let set = new Set(
                              selectedPalates || new Set<Key>()
                            );
                            if (set.has("All")) {
                              set.delete("All");
                            } else {
                              set.add("All");
                            }
                            handlePalateChange?.(set);
                          }}
                          className={`w-full py-2 px-4 md:py-3 md:px-6 flex justify-between items-center gap-2 ${
                            cuisine == "All" ? "bg-[#F1F1F1]" : "bg-transparent"
                          } text-sm md:text-lg font-semibold border-b border-[#E5E5E5]`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="form-checkbox h-4 w-4 text-[#E36B00]"
                              checked={selectedPalates?.has("All")}
                              readOnly
                            />
                            <span className="font-medium">All</span>
                          </div>
                          <PiCaretDown
                            className={`fill-[#494D5D] size-5 ${
                              selectedPalates.has("All") ? "rotate-180" : ""
                            }`}
                          />
                        </div>

                        {palateOptions.map((item) => (
                          <div key={item.key} className="">
                            <div
                              className="font-semibold flex items-center gap-2 py-2 px-4 md:py-3 md:px-6"
                              onClick={(e: any) => {
                                e.stopPropagation();
                                let set = new Set(
                                  selectedPalates || new Set<Key>()
                                );
                                if (set.has(item.key)) {
                                  set.delete(item.key);
                                } else {
                                  set.add(item.key);
                                }
                                handlePalateChange?.(set);
                              }}
                            >
                              <input
                                type="checkbox"
                                className="form-checkbox h-4 w-4 text-[#E36B00]"
                                checked={
                                  selectedPalates?.has(item.key) ||
                                  selectedPalates?.has("All")
                                }
                                readOnly
                              />
                              <label htmlFor="">{item.label}</label>
                            </div>
                            {item.children?.map((child) => (
                              <div
                                key={child.key}
                                className="flex items-center gap-2 py-2 px-4 md:py-3 md:px-6 cursor-pointer hover:bg-gray-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newSelection = new Set(
                                    selectedPalates || new Set<Key>()
                                  );
                                  if (newSelection.has(child.key)) {
                                    newSelection.delete(child.key);
                                  } else {
                                    newSelection.add(child.key);
                                  }
                                  handlePalateChange?.(newSelection);
                                }}
                              >
                                <input
                                  type="checkbox"
                                  className="form-checkbox h-4 w-4 text-[#E36B00]"
                                  checked={
                                    selectedPalates?.has(child.key) ||
                                    selectedPalates?.has(item.key) ||
                                    selectedPalates?.has("All")
                                  }
                                  readOnly
                                />
                                <span className="font-medium">
                                  {child.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        ))}
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
                        price.length && price[index]
                          ? "bg-[#F1F1F1]"
                          : "bg-transparent"
                      }`}
                    >
                      <input
                        id={`price-${index}`}
                        type="checkbox"
                        name="price"
                        value={item.value}
                        checked={price.length > 0 && price[index]}
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
            {filterType == "Rating" && (
              <div className="flex flex-col items-start gap-4">
                <label
                  htmlFor="rating"
                  className="text-xs md:text-base font-semibold"
                >
                  Max {rating}
                </label>
                <input
                  type="range"
                  id="rating"
                  name="rating"
                  value={rating}
                  max="5"
                  onChange={(e: any) => setRating(e.target.value)}
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
            <button className="rounded-[8px] bg-[#E36B00] py-2 px-16 text-[#FCFCFC] text-sm md:text-lg font-semibold">
              Apply
            </button>
          </div>
        }
        isOpen={isModalOpen}
        setIsOpen={() => setIsModalOpen(!isModalOpen)}
      />
    </>
  );
};

export default Filter;
