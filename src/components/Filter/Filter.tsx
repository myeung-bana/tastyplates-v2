import { FiFilter } from "react-icons/fi";
import "@/styles/components/filter.scss";

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
          </button>
        </div>

        <div className="filter__section">
          <div className="filter__options">
            <span className="filter__label">Rating</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filter;
