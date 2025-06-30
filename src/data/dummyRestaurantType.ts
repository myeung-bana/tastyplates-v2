export interface RestaurantType {
  id: string;
  name: string;
  description: string;
}

export const restaurantTypes: RestaurantType[] = [
  {
    id: "123e4567-e89b-12d3-a456-426614174000", // Static UUID for Bar
    name: "Bar",
    description:
      "A place that serves alcoholic beverages and often has a casual atmosphere.",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174001", // Static UUID for Cafe
    name: "Cafe",
    description:
      "A casual dining establishment that serves coffee, tea, and light meals.",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174002", // Static UUID for Diner
    name: "Diner",
    description:
      "A casual restaurant that serves a wide range of food, often in a retro setting.",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174003", // Static UUID for Fast Food
    name: "Fast Food",
    description:
      "A type of restaurant that serves quick meals, typically with a drive-thru option.",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174004", // Static UUID for Fine Dining
    name: "Fine Dining",
    description:
      "A high-end restaurant that offers a formal dining experience with gourmet food.",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174005", // Static UUID for Food Truck
    name: "Food Truck",
    description:
      "A mobile kitchen that serves food from a truck, often at various locations.",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174006", // Static UUID for Buffet
    name: "Buffet",
    description:
      "A restaurant where customers serve themselves from a variety of dishes.",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174007", // Static UUID for Bistro
    name: "Bistro",
    description: "A small, casual restaurant that serves simple, hearty meals.",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174008", // Static UUID for Pizzeria
    name: "Pizzeria",
    description: "A restaurant specializing in pizza and other Italian dishes.",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174009", // Static UUID for Steakhouse
    name: "Steakhouse",
    description:
      "A restaurant that specializes in serving steaks and other meat dishes.",
  },
];
