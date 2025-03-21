"use client";
import { FiSearch, FiMapPin, FiNavigation } from "react-icons/fi";
import { useState } from "react";
import "@/styles/components/_hero.scss";
import Image from "next/image";
import heroBg from '/images/hero-bg.png'

const Hero = () => {
  const [location, setLocation] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentLocation = () => {
    setIsLoading(true);

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );

          if (!response.ok) {
            throw new Error("Failed to fetch location data");
          }

          const data = await response.json();
          // Construct address string from response
          const address = [
            data.city,
            data.principalSubdivision,
            data.countryName,
          ]
            .filter(Boolean)
            .join(", ");

          setLocation(address);
        } catch (error) {
          console.error("Error fetching location:", error);
          alert("Unable to fetch your location");
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to get your location");
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log("Searching for:", { cuisine, location });
  };

  return (
    <section className="hero mx-auto !pt-24">
      <div className="hero__container mx-auto">
        <div className="hero__content z-20 mx-auto">
          <img src='/images/hero-bg.png' width={1980} height={538} className="absolute inset-0 w-full -z-10 object-cover" alt="Hero background" />
          <h1 className="hero__title sm:!text-white !text-[40px] leading-[48px] font-bold text-center">
            Discover & Share Amazing Restaurants
          </h1>
          <p className="hero__description sm:!text-white !text-xl font-bold text-center">
            Find and share your favourite restaurants based on your palate.
          </p>

          <form onSubmit={handleSearch} className="hero__search">
            <div className="hero__search-wrapper !p-3.5 !rounded-[50px]">
              <div className="hero__search-restaurant !bg-transparent">
                {/* <FiSearch className="hero__search-icon" /> */}
                {/* <label htmlFor="myEthnic">My Ethnic</label><br /> */}
                <input
                  type="text"
                  placeholder="Search Ethnic"
                  className="hero__search-input"
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                />
              </div>
              <div className="hero__search-divider"></div>
              <div className="hero__search-restaurant !bg-transparent">
                {/* <FiSearch className="hero__search-icon" /> */}
                <input
                  type="text"
                  placeholder="Add Cuisine"
                  className="hero__search-input"
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                />
              </div>
              <div className="hero__search-divider"></div>
              <div className="hero__search-location !bg-transparent">
                {/* <FiMapPin className="hero__search-icon" /> */}
                <input
                  type="text"
                  placeholder="Search location"
                  className="hero__search-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                {/* <button
                  type="button"
                  className="hero__location-button"
                  onClick={getCurrentLocation}
                  disabled={isLoading}
                  title="Use current location"
                >
                  <FiNavigation
                    className={`hero__location-icon ${
                      isLoading ? "spinning" : ""
                    }`}
                  />
                </button> */}
              </div>
              <button
                type="submit"
                className="hero__search-button !rounded-full h-[44px] w-[44px] !p-3 text-center !bg-[#E36B00]"
                disabled={!location || !cuisine}
              >
                <FiSearch className="hero__search-icon !h-5 !w-5 stroke-white" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Hero;
