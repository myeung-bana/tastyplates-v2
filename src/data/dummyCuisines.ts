export interface Cuisine {
  id: string;
  name: string;
  image: string;
  description: string;
}

export const cuisines: Cuisine[] = [
  {
    id: "c1b8a45d-6f23-4b88-9f47-6c2d21c6e324",
    name: "Italian",
    image: "/images/cuisines/italian.jpg",
    description:
      "Classic pasta dishes, wood-fired pizzas, and fresh Mediterranean flavors",
  },
  {
    id: "7d9a5e3c-8f12-4d67-b458-1a2b3c4d5e6f",
    name: "Japanese",
    image: "/images/cuisines/japanese.jpg",
    description: "Fresh sushi, ramen, and traditional Japanese delicacies",
  },
  {
    id: "3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7g8h",
    name: "Mexican",
    image: "/images/cuisines/mexican.jpg",
    description: "Vibrant tacos, enchiladas, and authentic Mexican street food",
  },
  {
    id: "9h8g7f6e-5d4c-3b2a-1098-7f6e5d4c3b2a",
    name: "Indian",
    image: "/images/cuisines/indian.jpg",
    description:
      "Aromatic curries, tandoori specialties, and flavorful vegetarian dishes",
  },
  {
    id: "2b3c4d5e-6f7g-8h9i-j0k1-l2m3n4o5p6q",
    name: "Chinese",
    image: "/images/cuisines/chinese.jpg",
    description: "Traditional dim sum, noodle dishes, and regional specialties",
  },
  {
    id: "5q4p3o2n-1m0l-k9j8-h7g6-f5e4d3c2b1a",
    name: "Thai",
    image: "/images/cuisines/thai.jpg",
    description: "Spicy curries, fresh stir-fries, and aromatic noodle dishes",
  },
];
