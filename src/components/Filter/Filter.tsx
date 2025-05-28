import { GiRoundStar } from "react-icons/gi";
import "@/styles/components/filter.scss";
import { MdStar, MdStarOutline } from "react-icons/md";
import CustomModal from "../ui/Modal/Modal";
import { useState } from "react";
import { PiCaretDown } from "react-icons/pi";
import CustomPopover from "../ui/Popover/Popover";

interface FilterProps {
  onFilterChange?: (filterType: string, value: string) => void;
}

const Filter = ({ onFilterChange }: FilterProps) => {
  const [isCuisineOpen, setIsCuisineOpen] = useState<boolean>(false);
  const [isPriceOpen, setIsPriceOpen] = useState<boolean>(false);
  const [isBadgeOpen, setIsBadgeOpen] = useState<boolean>(false);
  const [isRatingOpen, setIsRatingOpen] = useState<boolean>(false);
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
              onClick={() => setIsCuisineOpen(!isCuisineOpen)}
              className="filter__options"
            >
              <span className="filter__label">Cuisine</span>
            </button>
          </div>

          <div className="filter__section">
            <button className="filter__options">
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
            <div className="filter__options">
              <img src="/star.svg" className="size-4 sm:size-5" alt="star" />
              <span className="filter__label">Rating</span>
            </div>
          </div>
        </div>
      </div>
      <CustomModal
        header="Cuisine"
        content={
          <CustomPopover
            align="bottom-end"
            trigger={
              <button className="bg-[#FCFCFC66]/40 rounded-[50px] h-11 px-6 hidden md:flex flex-row flex-nowrap items-center gap-2 text-[#31343F]">
                <span className="text-[#31343F] text-center font-semibold">
                  All
                </span>
                <PiCaretDown className="fill-[#494D5D] size-5" />
              </button>
            }
            content={
              <div className="bg-white flex flex-col rounded-2xl text-[#494D5D]">
                Hello World
              </div>
            }
          />
        }
        hasFooter
        footer={
          <div className="flex gap-2 md:gap-4 justify-center">
            <button className="py-2 px-16 border-[1.5px] border-[#494D5D] rounded-[8px] text-[#494D5D] text-sm md:text-lg font-semibold">
              Reset
            </button>
            <button className="rounded-[8px] bg-[#E36B00] py-2 px-16 text-[#FCFCFC] text-sm md:text-lg font-semibold">
              Reset
            </button>
          </div>
        }
        isOpen={isCuisineOpen}
        setIsOpen={() => setIsCuisineOpen(!isCuisineOpen)}
      />
    </>
  );
};

export default Filter;
