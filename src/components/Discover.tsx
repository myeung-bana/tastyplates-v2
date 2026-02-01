"use client";
import React from 'react';
import Image from 'next/image';
import "@/styles/components/_discover.scss";

const Discover = () => {
  return (
    <section className="discover">
      <div className="discover__container mx-auto">
        <div className="discover__content mx-auto">
          <div className="discover__text-content">
            <h2 className="discover__title font-neusans">
              Welcome to TastyPlates
            </h2>
            <p className="discover__description font-neusans">
              Discover & Find the best restaurants through personalized recs and top lists that fit your taste buds.
            </p>
            <div className="discover__badge">
              <span className="discover__badge-text font-neusans">Mobile App</span>
              <span className="discover__badge-label font-neusans">Coming Soon</span>
            </div>
          </div>
          <div className="discover__image-content">
            <Image
              src="/images/website_filters.webp"
              alt="TastyPlates Mobile App"
              width={300}
              height={600}
              className="discover__phone-image"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Discover;
