export interface Listing {
    id: string;
    title: string;
    slug: string;
    content: string;
    listingStreet: string;
    priceRange: string;
    averageRating: number;
    status : string;
    palates: {
        nodes: {
            name: string;
        }[];
    };
    databaseId?: number;
    listingDetails: {
        googleMapUrl: {
            streetAddress?: string;
            streetNumber?: string;
            streetName?: string;
            city?: string;
            state?: string;
            stateShort?: string;
            country?: string;
            countryShort?: string;
            postCode?: string;
            latitude?: string;
            longitude?: string;
            placeId?: string;
            zoom?: number;
        };
        latitude: string;
        longitude: string;
        menuUrl: string;
        openingHours: string;
        phone: string;
    };
    featuredImage?: {
        node: {
            sourceUrl: string;
        };
    };
    listingCategories: {
        nodes: {
            id: number
            name: string
            slug: string;
        }[];
    };
    countries: {
        nodes: { name: string }[];
    };
    cuisines?: string[];
    isFavorite?: boolean;
    ratingsCount?: number;
}


export interface GetListingsData {
    listings: {
        nodes: Listing[];
        pageInfo: {
            endCursor: string;
            hasNextPage: boolean;
        };
    };
}

export interface GetListingBySlugData {
    listing: Listing | null;
}

export interface FavoriteListingData {
    restaurant_slug: string;
    action: string;
}

export interface CheckInData {
    restaurant_slug: string;
    action: string;
}