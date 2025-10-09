export interface LocationOption {
  key: string;
  label: string;
  flag: string;
  currency: string;
  timezone: string;
}

export const SUPPORTED_LOCATIONS: LocationOption[] = [
  {
    key: "canada",
    label: "Canada",
    flag: "https://flagcdn.com/ca.svg",
    currency: "CAD",
    timezone: "America/Toronto"
  },
  {
    key: "malaysia", 
    label: "Malaysia",
    flag: "https://flagcdn.com/my.svg",
    currency: "MYR",
    timezone: "Asia/Kuala_Lumpur"
  },
  {
    key: "hongkong",
    label: "Hong Kong", 
    flag: "https://flagcdn.com/hk.svg",
    currency: "HKD",
    timezone: "Asia/Hong_Kong"
  },
  {
    key: "china",
    label: "China",
    flag: "https://flagcdn.com/cn.svg", 
    currency: "CNY",
    timezone: "Asia/Shanghai"
  }
];

export const DEFAULT_LOCATION = "canada";

// Location storage keys
export const LOCATION_STORAGE_KEY = "tastyplates_selected_location";
export const LOCATION_COOKIE_KEY = "tastyplates_location";
