export interface LocationOption {
  key: string;
  label: string;
  shortLabel: string; // e.g., "CA" for Canada
  flag: string;
  currency: string;
  timezone: string;
  type: 'country' | 'city';
  parentKey?: string; // For cities, reference parent country
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface CountryLocation extends LocationOption {
  type: 'country';
  cities: CityLocation[];
}

export interface CityLocation extends LocationOption {
  type: 'city';
  parentKey: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

// Hierarchical location structure
export const LOCATION_HIERARCHY: { countries: CountryLocation[] } = {
  countries: [
    {
      key: "canada",
      label: "Canada", 
      shortLabel: "CA",
      flag: "https://flagcdn.com/ca.svg",
      currency: "CAD",
      timezone: "America/Toronto",
      type: 'country',
      cities: [
        {
          key: "toronto",
          label: "Toronto",
          shortLabel: "TO",
          parentKey: "canada",
          coordinates: { lat: 43.6532, lng: -79.3832 },
          type: 'city',
          flag: "https://flagcdn.com/ca.svg",
          currency: "CAD",
          timezone: "America/Toronto"
        },
        {
          key: "vancouver", 
          label: "Vancouver",
          shortLabel: "VAN",
          parentKey: "canada",
          coordinates: { lat: 49.2827, lng: -123.1207 },
          type: 'city',
          flag: "https://flagcdn.com/ca.svg",
          currency: "CAD",
          timezone: "America/Vancouver"
        },
        {
          key: "montreal",
          label: "Montreal", 
          shortLabel: "MTL",
          parentKey: "canada",
          coordinates: { lat: 45.5017, lng: -73.5673 },
          type: 'city',
          flag: "https://flagcdn.com/ca.svg",
          currency: "CAD",
          timezone: "America/Toronto"
        }
      ]
    },
    {
      key: "malaysia",
      label: "Malaysia",
      shortLabel: "MY", 
      flag: "https://flagcdn.com/my.svg",
      currency: "MYR",
      timezone: "Asia/Kuala_Lumpur",
      type: 'country',
      cities: [
        {
          key: "kuala_lumpur",
          label: "Kuala Lumpur",
          shortLabel: "KL",
          parentKey: "malaysia", 
          coordinates: { lat: 3.1390, lng: 101.6869 },
          type: 'city',
          flag: "https://flagcdn.com/my.svg",
          currency: "MYR",
          timezone: "Asia/Kuala_Lumpur"
        },
        {
          key: "penang",
          label: "Penang",
          shortLabel: "PG",
          parentKey: "malaysia",
          coordinates: { lat: 5.4164, lng: 100.3327 },
          type: 'city',
          flag: "https://flagcdn.com/my.svg",
          currency: "MYR",
          timezone: "Asia/Kuala_Lumpur"
        }
      ]
    },
    {
      key: "hongkong",
      label: "Hong Kong",
      shortLabel: "HK",
      flag: "https://flagcdn.com/hk.svg", 
      currency: "HKD",
      timezone: "Asia/Hong_Kong",
      type: 'country',
      cities: [
        {
          key: "hong_kong_island",
          label: "Hong Kong Island",
          shortLabel: "HKI",
          parentKey: "hongkong",
          coordinates: { lat: 22.2783, lng: 114.1747 },
          type: 'city',
          flag: "https://flagcdn.com/hk.svg",
          currency: "HKD",
          timezone: "Asia/Hong_Kong"
        },
        {
          key: "kowloon",
          label: "Kowloon", 
          shortLabel: "KLN",
          parentKey: "hongkong",
          coordinates: { lat: 22.3193, lng: 114.1694 },
          type: 'city',
          flag: "https://flagcdn.com/hk.svg",
          currency: "HKD",
          timezone: "Asia/Hong_Kong"
        }
      ]
    },
    {
      key: "china",
      label: "China",
      shortLabel: "CN",
      flag: "https://flagcdn.com/cn.svg",
      currency: "CNY", 
      timezone: "Asia/Shanghai",
      type: 'country',
      cities: [
        {
          key: "beijing",
          label: "Beijing",
          shortLabel: "BJ",
          parentKey: "china",
          coordinates: { lat: 39.9042, lng: 116.4074 },
          type: 'city',
          flag: "https://flagcdn.com/cn.svg",
          currency: "CNY",
          timezone: "Asia/Shanghai"
        },
        {
          key: "shanghai",
          label: "Shanghai",
          shortLabel: "SH",
          parentKey: "china", 
          coordinates: { lat: 31.2304, lng: 121.4737 },
          type: 'city',
          flag: "https://flagcdn.com/cn.svg",
          currency: "CNY",
          timezone: "Asia/Shanghai"
        },
        {
          key: "guangzhou",
          label: "Guangzhou",
          shortLabel: "GZ",
          parentKey: "china",
          coordinates: { lat: 23.1291, lng: 113.2644 },
          type: 'city',
          flag: "https://flagcdn.com/cn.svg",
          currency: "CNY",
          timezone: "Asia/Shanghai"
        }
      ]
    },
    {
      key: "philippines",
      label: "Philippines",
      shortLabel: "PH",
      flag: "https://flagcdn.com/ph.svg",
      currency: "PHP",
      timezone: "Asia/Manila",
      type: 'country',
      cities: [
        {
          key: "manila",
          label: "Manila",
          shortLabel: "MNL",
          parentKey: "philippines",
          coordinates: { lat: 14.5995, lng: 120.9842 },
          type: 'city',
          flag: "https://flagcdn.com/ph.svg",
          currency: "PHP",
          timezone: "Asia/Manila"
        },
        {
          key: "cebu",
          label: "Cebu",
          shortLabel: "CEB",
          parentKey: "philippines",
          coordinates: { lat: 10.3157, lng: 123.8854 },
          type: 'city',
          flag: "https://flagcdn.com/ph.svg",
          currency: "PHP",
          timezone: "Asia/Manila"
        }
      ]
    }
  ]
};

// Flattened list for backward compatibility
export const SUPPORTED_LOCATIONS: LocationOption[] = [
  ...LOCATION_HIERARCHY.countries,
  ...LOCATION_HIERARCHY.countries.flatMap(country => country.cities)
];

export const DEFAULT_LOCATION = "toronto"; // Default to Toronto city

// Location storage keys
export const LOCATION_STORAGE_KEY = "tastyplates_selected_location";
export const LOCATION_COOKIE_KEY = "tastyplates_location";
