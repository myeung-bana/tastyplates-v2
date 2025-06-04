"use client";
import { FiSearch, FiMapPin, FiNavigation } from "react-icons/fi";
import { MdStore } from "react-icons/md";
import { useState } from "react";
import "@/styles/components/_hero.scss";
import Image from "next/image";
import heroBg from "/images/hero-bg.png";

const Hero = () => {
  const [location, setLocation] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchListing, setIsSearchListing] = useState(false);
  const [listing, setListing] = useState("");

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

  const searchByListingName = () => {
    setIsSearchListing(!isSearchListing);
  };

  return (
    <section className="hero mx-auto">
      <div className="hero__container mx-auto">
        <div className="hero__content z-20 mx-auto">
          <img
            src="/images/hero-bg.png"
            width={1980}
            height={538}
            className="absolute inset-0 w-full -z-10 h-[538px] object-cover hidden sm:block"
            alt="Hero background"
          />
          <img
            src="/images/hero-bg-sp.png"
            width={640}
            height={466}
            className="absolute inset-0 w-full h-[466px] -z-10 object-left-top object-cover sm:hidden"
            alt="Hero background"
          />
          <h1 className="hero__title">Discover & Share Amazing Restaurant</h1>
          <p className="hero__description">
            Find and share your favourite restaurants based on your palate.
          </p>
          <form onSubmit={handleSearch} className="hero__search">
            <div className="hero__search-wrapper">
              <div className="hero__search-restaurant text-center md:!hidden">
                <input
                  type="text"
                  placeholder="Start Your Search"
                  className="hero__search-input text-center"
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                />
              </div>
              {!isSearchListing ? (
                <>
                  <div className="hero__search-restaurant !hidden md:!flex flex-col !items-start">
                    <label className="text-sm md:text-lg font-medium text-[#31343F]">
                      My Palate
                    </label>
                    <input
                      type="text"
                      placeholder="Search Palate"
                      className="hero__search-input"
                      value={cuisine}
                      onChange={(e) => setCuisine(e.target.value)}
                    />
                  </div>
                  <div className="hero__search-divider"></div>
                  <div className="hero__search-location !hidden md:!flex flex-col !items-start">
                    <label className="text-sm md:text-lg font-medium text-[#31343F]">
                      Location
                    </label>
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
                </>
              ) : (
                <div className="hero__search-restaurant !bg-transparent">
                  <FiSearch className="hero__search-icon" />
                  <input
                    type="text"
                    placeholder="Search by Listing Name"
                    className="hero__search-input"
                    value={listing}
                    onChange={(e) => setListing(e.target.value)}
                  />
                </div>
              )}
              <button
                type="submit"
                className="hero__search-button h-8 w-8 sm:h-11 sm:w-11 text-center"
                disabled={!location || !cuisine}
              >
                <FiSearch className="hero__search-icon stroke-white" />
              </button>
            </div>
          </form>
          <div className="flex gap-2 justify-center mt-6 items-center">
            <MdStore className="size-4 sm:size-5 fill-[#FCFCFC]" />
            <button
              onClick={searchByListingName}
              className="border-b border-[#FCFCFC] font-semibold text-sm sm:text-base text-[#FCFCFC] leading-5"
            >
              Search by Listing Name
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
