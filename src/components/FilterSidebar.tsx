import { FiFilter } from "react-icons/fi";
import "@/styles/components/_filter-sidebar.scss";

// Removed unused interface

const FilterSidebar = () => {
  return (
    <aside className="filter">
      <div className="filter__card">
        <div className="filter__header">
          <h2 className="filter__title">
            <FiFilter className="filter__icon" />
            Filters
          </h2>
        </div>

        <div className="filter__section">
          <h3 className="filter__subtitle">Price Range</h3>
          <div className="filter__options">
            {["$", "$$", "$$$", "$$$$"].map((price) => (
              <label key={price} className="filter__option">
                <input type="checkbox" name="price" value={price} />
                <span className="filter__checkbox"></span>
                <span className="filter__label">{price}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="filter__section">
          <h3 className="filter__subtitle">Cuisines</h3>
          <div className="filter__options">
            {[
              "Italian",
              "Japanese",
              "American",
              "Chinese",
              "Indian",
              "Thai",
            ].map((cuisine) => (
              <label key={cuisine} className="filter__option">
                <input type="checkbox" name="cuisine" value={cuisine} />
                <span className="filter__checkbox"></span>
                <span className="filter__label">{cuisine}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="filter__section">
          <h3 className="filter__subtitle">Rating</h3>
          <div className="filter__options">
            {[4, 3, 2].map((rating) => (
              <label key={rating} className="filter__option">
                <input type="checkbox" name="rating" value={rating} />
                <span className="filter__checkbox"></span>
                <span className="filter__label">{rating}+ Stars</span>
              </label>
            ))}
          </div>
        </div>

        <div className="filter__section">
          <h3 className="filter__subtitle">Delivery Time</h3>
          <div className="filter__options">
            {["Under 30 min", "30-45 min", "45-60 min"].map((time) => (
              <label key={time} className="filter__option">
                <input type="checkbox" name="deliveryTime" value={time} />
                <span className="filter__checkbox"></span>
                <span className="filter__label">{time}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;
