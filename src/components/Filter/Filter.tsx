import { GiRoundStar } from 'react-icons/gi';
import "@/styles/components/filter.scss";
import { MdStar, MdStarOutline } from 'react-icons/md';

interface FilterProps {
  onFilterChange?: (filterType: string, value: string) => void;
}

const Filter = ({ onFilterChange }: FilterProps) => {
  return (
    <div className="filter">
      <div className="filter__card">
        {/* <div className="filter__header">
          <h2 className="filter__title">
            <FiFilter className="filter__icon" />
            Filters
          </h2>
        </div> */}

        <div className="filter__section">
          <button className="filter__options">
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
            <img src="/images/arrow_warm_up.svg" className="size-4 sm:size-5" alt="arrow up" />
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
  );
};

export default Filter;
