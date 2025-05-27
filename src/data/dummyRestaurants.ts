export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  image: string;
  rating: number;
  cuisineIds: string[];
  location: string;
  priceRange: string;
  address: string;
  phone: string;
  reviews: number;
  description: string;
  recognition?: boolean[]
}

export const restaurants = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000", // Burger House
    slug: "550e8400-e29b-41d4-a716-446655440000",
    name: "Burger House",
    image: "/images/restaurant.jpg",
    rating: 4.5,
    cuisineIds: [
      "c1b8a45d-6f23-4b88-9f47-6c2d21c6e324", // Italian
      "3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7g8h", // Mexican
    ],
    location: "Downtown",
    priceRange: "$$",
    address: "123 Main St, Downtown",
    phone: "123-456-7890",
    reviews: 10,
    description:
      "Burger House is a popular restaurant known for its juicy burgers and friendly service. It's a great place to enjoy a casual meal with friends or family.",
    menu: [
      {
        category: "Signature Burgers",
        items: [
          {
            name: "Classic Cheeseburger",
            price: 12.99,
            description:
              "Angus beef patty, cheddar cheese, lettuce, tomato, onion, special sauce",
            image: "/images/restaurant.jpg",
          },
          {
            name: "BBQ Bacon Burger",
            price: 14.99,
            description:
              "Angus beef patty, bacon, BBQ sauce, onion rings, cheddar cheese",
            image: "/images/restaurant.jpg",
          },
        ],
      },
    ],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    slug: "550e8400-e29b-41d4-a716-446655440001", // Sushi Master
    name: "Sushi Master",
    image: "/images/restaurant.jpg",
    rating: 4.8,
    cuisineIds: [
      "7d9a5e3c-8f12-4d67-b458-1a2b3c4d5e6f", // Japanese
      "5q4p3o2n-1m0l-k9j8-h7g6-f5e4d3c2b1a", // Thai
    ],
    location: "Midtown",
    priceRange: "$$$",
    address: "456 Park Ave, Midtown",
    phone: "123-456-7890",
    reviews: 15,
    description:
      "Sushi Master is a high-end sushi restaurant known for its fresh ingredients and expert sushi chefs. It's a great place to enjoy a fine dining experience.",
    menu: [
      {
        category: "Signature Burgers",
        items: [
          {
            name: "Classic Cheeseburger",
            price: 12.99,
            description:
              "Angus beef patty, cheddar cheese, lettuce, tomato, onion, special sauce",
            image: "/images/restaurant.jpg",
          },
          {
            name: "BBQ Bacon Burger",
            price: 14.99,
            description:
              "Angus beef patty, bacon, BBQ sauce, onion rings, cheddar cheese",
            image: "/images/restaurant.jpg",
          },
        ],
      },
    ],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002", // Pizza Palace
    slug: "550e8400-e29b-41d4-a716-446655440002", // Pizza Palace
    name: "Pizza Palace",
    image: "/images/restaurant.jpg",
    rating: 4.2,
    cuisineIds: [
      "3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7g8h", // Mexican
      "c1b8a45d-6f23-4b88-9f47-6c2d21c6e324", // Italian
    ],
    location: "West End",
    priceRange: "$$",
    address: "789 Broadway, West End",
    phone: "123-456-7890",
    reviews: 8,
    description:
      "Pizza Palace is a popular pizza restaurant known for its delicious pizzas and friendly service. It's a great place to enjoy a casual meal with friends or family.",
    menu: [
      {
        category: "Signature Burgers",
        items: [
          {
            name: "Classic Cheeseburger",
            price: 12.99,
            description:
              "Angus beef patty, cheddar cheese, lettuce, tomato, onion, special sauce",
            image: "/images/restaurant.jpg",
          },
          {
            name: "BBQ Bacon Burger",
            price: 14.99,
            description:
              "Angus beef patty, bacon, BBQ sauce, onion rings, cheddar cheese",
            image: "/images/restaurant.jpg",
          },
        ],
      },
    ],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003", // Another Pizza Palace
    slug: "550e8400-e29b-41d4-a716-446655440003", // Another Pizza Palace
    name: "Pizza Palace",
    image: "/images/restaurant.jpg",
    rating: 4.2,
    cuisineIds: [
      "9h8g7f6e-5d4c-3b2a-1098-7f6e5d4c3b2a", // Indian
      "2b3c4d5e-6f7g-8h9i-j0k1-l2m3n4o5p6q", // Chinese
    ],
    location: "West End",
    priceRange: "$$",
    address: "789 Broadway, West End",
    phone: "123-456-7890",
    reviews: 8,
    description:
      "Pizza Palace is a popular pizza restaurant known for its delicious pizzas and friendly service. It's a great place to enjoy a casual meal with friends or family.",
    menu: [
      {
        category: "Signature Burgers",
        items: [
          {
            name: "Classic Cheeseburger",
            price: 12.99,
            description:
              "Angus beef patty, cheddar cheese, lettuce, tomato, onion, special sauce",
            image: "/images/restaurant.jpg",
          },
          {
            name: "BBQ Bacon Burger",
            price: 14.99,
            description:
              "Angus beef patty, bacon, BBQ sauce, onion rings, cheddar cheese",
            image: "/images/restaurant.jpg",
          },
        ],
      },
    ],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440011", // Burger House
    slug: "550e8400-e29b-41d4-a716-446655440011",
    name: "Burger House",
    image: "/images/restaurant.jpg",
    rating: 4.5,
    cuisineIds: [
      "c1b8a45d-6f23-4b88-9f47-6c2d21c6e324", // Italian
      "3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7g8h", // Mexican
    ],
    location: "Downtown",
    priceRange: "$$",
    address: "123 Main St, Downtown",
    phone: "123-456-7890",
    reviews: 10,
    description:
      "Burger House is a popular restaurant known for its juicy burgers and friendly service. It's a great place to enjoy a casual meal with friends or family.",
    menu: [
      {
        category: "Signature Burgers",
        items: [
          {
            name: "Classic Cheeseburger",
            price: 12.99,
            description:
              "Angus beef patty, cheddar cheese, lettuce, tomato, onion, special sauce",
            image: "/images/restaurant.jpg",
          },
          {
            name: "BBQ Bacon Burger",
            price: 14.99,
            description:
              "Angus beef patty, bacon, BBQ sauce, onion rings, cheddar cheese",
            image: "/images/restaurant.jpg",
          },
        ],
      },
    ],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440012",
    slug: "550e8400-e29b-41d4-a716-446655440012", // Sushi Master
    name: "Sushi Master",
    image: "/images/restaurant.jpg",
    rating: 4.8,
    cuisineIds: [
      "7d9a5e3c-8f12-4d67-b458-1a2b3c4d5e6f", // Japanese
      "5q4p3o2n-1m0l-k9j8-h7g6-f5e4d3c2b1a", // Thai
    ],
    location: "Midtown",
    priceRange: "$$$",
    address: "456 Park Ave, Midtown",
    phone: "123-456-7890",
    reviews: 15,
    description:
      "Sushi Master is a high-end sushi restaurant known for its fresh ingredients and expert sushi chefs. It's a great place to enjoy a fine dining experience.",
    menu: [
      {
        category: "Signature Burgers",
        items: [
          {
            name: "Classic Cheeseburger",
            price: 12.99,
            description:
              "Angus beef patty, cheddar cheese, lettuce, tomato, onion, special sauce",
            image: "/images/restaurant.jpg",
          },
          {
            name: "BBQ Bacon Burger",
            price: 14.99,
            description:
              "Angus beef patty, bacon, BBQ sauce, onion rings, cheddar cheese",
            image: "/images/restaurant.jpg",
          },
        ],
      },
    ],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440013", // Pizza Palace
    slug: "550e8400-e29b-41d4-a716-446655440013", // Pizza Palace
    name: "Pizza Palace",
    image: "/images/restaurant.jpg",
    rating: 4.2,
    cuisineIds: [
      "3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7g8h", // Mexican
      "c1b8a45d-6f23-4b88-9f47-6c2d21c6e324", // Italian
    ],
    location: "West End",
    priceRange: "$$",
    address: "789 Broadway, West End",
    phone: "123-456-7890",
    reviews: 8,
    description:
      "Pizza Palace is a popular pizza restaurant known for its delicious pizzas and friendly service. It's a great place to enjoy a casual meal with friends or family.",
    menu: [
      {
        category: "Signature Burgers",
        items: [
          {
            name: "Classic Cheeseburger",
            price: 12.99,
            description:
              "Angus beef patty, cheddar cheese, lettuce, tomato, onion, special sauce",
            image: "/images/restaurant.jpg",
          },
          {
            name: "BBQ Bacon Burger",
            price: 14.99,
            description:
              "Angus beef patty, bacon, BBQ sauce, onion rings, cheddar cheese",
            image: "/images/restaurant.jpg",
          },
        ],
      },
    ],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440014", // Another Pizza Palace
    slug: "550e8400-e29b-41d4-a716-446655440014", // Another Pizza Palace
    name: "Pizza Palace",
    image: "/images/restaurant.jpg",
    rating: 4.2,
    cuisineIds: [
      "9h8g7f6e-5d4c-3b2a-1098-7f6e5d4c3b2a", // Indian
      "2b3c4d5e-6f7g-8h9i-j0k1-l2m3n4o5p6q", // Chinese
    ],
    location: "West End",
    priceRange: "$$",
    address: "789 Broadway, West End",
    phone: "123-456-7890",
    reviews: 8,
    description:
      "Pizza Palace is a popular pizza restaurant known for its delicious pizzas and friendly service. It's a great place to enjoy a casual meal with friends or family.",
    menu: [
      {
        category: "Signature Burgers",
        items: [
          {
            name: "Classic Cheeseburger",
            price: 12.99,
            description:
              "Angus beef patty, cheddar cheese, lettuce, tomato, onion, special sauce",
            image: "/images/restaurant.jpg",
          },
          {
            name: "BBQ Bacon Burger",
            price: 14.99,
            description:
              "Angus beef patty, bacon, BBQ sauce, onion rings, cheddar cheese",
            image: "/images/restaurant.jpg",
          },
        ],
      },
    ],
  },
];
