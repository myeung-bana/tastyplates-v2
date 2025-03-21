export interface Palate {
  id: string;
  name: string;
  cuisineId: string;
}

export const palates: Palate[] = [
  {
    id: "p1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
    name: "Italian",
    cuisineId: "c1b8a45d-6f23-4b88-9f47-6c2d21c6e324", // Italian
  },
  {
    id: "p2a3b4c5-d6e7-f8g9-h0i1-j2k3l4m5n6o7",
    name: "Japanese",
    cuisineId: "7d9a5e3c-8f12-4d67-b458-1a2b3c4d5e6f", // Japanese
  },
  {
    id: "p3a4b5c6-d7e8-f9g0-h1i2-j3k4l5m6n7o8",
    name: "Mexican",
    cuisineId: "3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7g8h", // Mexican
  },
  {
    id: "p4a5b6c7-d8e9-f0g1-h2i3-j4k5l6m7n8o9",
    name: "Indian",
    cuisineId: "9h8g7f6e-5d4c-3b2a-1098-7f6e5d4c3b2a", // Indian
  },
  {
    id: "p5a6b7c8-d9e0-f1g2-h3i4-j5k6l7m8n9o0",
    name: "Chinese",
    cuisineId: "2b3c4d5e-6f7g-8h9i-j0k1-l2m3n4o5p6q", // Chinese
  },
  {
    id: "p6a7b8c9-d0e1-f2g3-h4i5-j6k7l8m9n0o1",
    name: "Thai",
    cuisineId: "5q4p3o2n-1m0l-k9j8-h7g6-f5e4d3c2b1a", // Thai
  },
];
