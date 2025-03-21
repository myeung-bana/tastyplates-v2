"use client";
import React, { useState } from "react";
import Footer from "@/components/Footer";
import type { Restaurant } from "@/data/dummyRestaurants";
import { FiMail } from "react-icons/fi";
import { palates } from "@/data/dummyPalate";
import "@/styles/pages/_submit-restaurants.scss";

const SubmitRestaurantPage = () => {
  const [restaurant, setRestaurant] = useState<
    Omit<Restaurant, "id" | "reviews">
  >({
    name: "",
    image: "",
    cuisineIds: [],
    rating: 0,
    priceRange: "",
    location: "",
    slug: "",
    address: "",
    phone: "",
    description: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "cuisineIds" && e.target instanceof HTMLSelectElement) {
      const selectedOptions = Array.from(e.target.selectedOptions).map(
        (option) => option.value
      );
      setRestaurant((prev) => ({
        ...prev,
        cuisineIds: selectedOptions,
      }));
    } else {
      setRestaurant((prev) => ({
        ...prev,
        [name]:
          name === "rating" || name === "deliveryTime" ? Number(value) : value,
      }));
    }
  };

  return (
    <>
      <div className="submitRestaurants">
        <div className="submitRestaurants__container">
          <div className="submitRestaurants__card">
            <h1 className="submitRestaurants__title">
              Submit Restaurant Listing
            </h1>
            <p className="submitRestaurants__subtitle">
              Submit a restaurant listing.
            </p>
            <form className="submitRestaurants__form">
              <div className="submitRestaurants__form-group">
                <label className="submitRestaurants__label">
                  Restaurant Name
                </label>
                <div className="submitRestaurants__input-group">
                  <FiMail className="submitRestaurants__input-icon" />
                  <input
                    type="text"
                    name="name"
                    className="submitRestaurants__input"
                    placeholder="Restaurant Name"
                    value={restaurant.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="submitRestaurants__form-group">
                <label className="rsubmitRestaurants__label">Address</label>
                <div className="submitRestaurants__input-group">
                  <FiMail className="submitRestaurants__input-icon" />
                  <input
                    className="submitRestaurants__input"
                    type="text"
                    name="location"
                    placeholder="Location"
                    value={restaurant.location}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="submitRestaurants__form-group">
                <label className="submitRestaurants__label">Image URL</label>
                <div className="submitRestaurants__input-group">
                  <FiMail className="submitRestaurants__input-icon" />
                  <input
                    type="text"
                    name="image"
                    className="submitRestaurants__input"
                    placeholder="Image URL"
                    value={restaurant.image}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="submitRestaurants__form-group">
                <label className="submitRestaurants__label">Cuisines</label>
                <div className="submitRestaurants__cuisine-checkbox-grid">
                  {palates.map((cuisine) => (
                    <div key={cuisine.id} className="cuisine-checkbox-item">
                      <input
                        type="checkbox"
                        id={`cuisine-${cuisine.id}`}
                        name="cuisineIds"
                        value={cuisine.id}
                        className="cuisine-checkbox"
                      />
                      <label
                        htmlFor={`cuisine-${cuisine.id}`}
                        className="cuisine-checkbox-label"
                      >
                        {cuisine.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <p>
                By clicking "Submit" you acknowledge that you have read,
                understood, and agree to be bound by the Terms and Conditions.
              </p>
              <button className="submitRestaurants__button" type="submit">
                Submit Listing
              </button>
            </form>
            <small>
              Note: User Recommendations for Listings Users are welcome to
              recommend listings; however, please note that submission of these
              recommendations does not guarantee their conversion into permanent
              listings. All recommendations will be reviewed, and acceptance is
              at our discretion.
            </small>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SubmitRestaurantPage;
