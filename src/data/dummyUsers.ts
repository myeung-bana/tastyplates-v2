export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  image: string;
  bio: string;
  location: string;
  following: number;
  followers: number;
  reviews: number;
  joinedDate: string;
  palateIds: string[]; // Added this field to associate palates
}

export const users: User[] = [
  {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "Sarah Chen",
    username: "foodie_sarah",
    email: "sarah.chen@example.com",
    image: "/profile-icon.svg",
    bio: "Food photographer & culinary adventurer 📸 Always hunting for the next best bite!",
    location: "San Francisco, CA",
    following: 245,
    followers: 1200,
    reviews: 89,
    joinedDate: "2023-01-15",
    palateIds: [
      "p1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
      "p2a3b4c5-d6e7-f8g9-h0i1-j2k3l4m5n6o7",
    ], // Italian, Japanese
  },
  {
    id: "987fcdeb-51a2-43d7-9b56-312c9d4f6789",
    name: "Marcus Rodriguez",
    username: "chef_marcus",
    email: "marcus.rod@example.com",
    image: "/profile-icon.svg",
    bio: "Professional chef turned food critic. Sharing honest reviews & cooking tips 🍳",
    location: "Chicago, IL",
    following: 180,
    followers: 2300,
    reviews: 156,
    joinedDate: "2023-03-22",
    palateIds: [
      "p3a4b5c6-d7e8-f9g0-h1i2-j3k4l5m6n7o8",
      "p4a5b6c7-d8e9-f0g1-h2i3-j4k5l6m7n8o9",
    ], // Mexican, Indian
  },
  {
    id: "550e8400-e29b-41d4-a716-447655440000",
    name: "Emily Parker",
    username: "sweet_tooth_em",
    email: "emily.parker@example.com",
    image: "/profile-icon.svg",
    bio: "Dessert enthusiast 🍰 Finding & sharing the best bakeries and sweet spots!",
    location: "New York, NY",
    following: 310,
    followers: 1800,
    reviews: 127,
    joinedDate: "2023-02-08",
    palateIds: [
      "p5a6b7c8-d9e0-f1g2-h3i4-j5k6l7m8n9o0",
      "p6a7b8c9-d0e1-f2g3-h4i5-j6k7l8m9n0o1",
    ], // Chinese, Thai
  },
  {
    id: "111e4567-e89b-12d3-a456-426614174001",
    name: "Emily Parker2",
    username: "sweet_tooth_em2",
    email: "emily.parker2@example.com",
    image: "/profile-icon.svg",
    bio: "Dessert enthusiast 🍰 Finding & sharing the best bakeries and sweet spots!",
    location: "New York, NY",
    following: 310,
    followers: 1800,
    reviews: 127,
    joinedDate: "2023-02-08",
    palateIds: [
      "p5a6b7c8-d9e0-f1g2-h3i4-j5k6l7m8n9o0",
      "p6a7b8c9-d0e1-f2g3-h4i5-j6k7l8m9n0o1",
    ], // Chinese, Thai
  },
  {
    id: "222e4567-e89b-12d3-a456-426614174002",
    name: "Emily Parker",
    username: "sweet_tooth_em",
    email: "emily.parker@example.com",
    image: "/profile-icon.svg",
    bio: "Dessert enthusiast 🍰 Finding & sharing the best bakeries and sweet spots!",
    location: "New York, NY",
    following: 310,
    followers: 1800,
    reviews: 127,
    joinedDate: "2023-02-08",
    palateIds: [
      "p3a4b5c6-d7e8-f9g0-h1i2-j3k4l5m6n7o8",
      "p4a5b6c7-d8e9-f0g1-h2i3-j4k5l6m7n8o9",
    ], // Mexican, Indian
  },
];
