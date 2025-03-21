export interface List {
  id: string;
  name: string;
  creator: string;
  restaurants: string[];
}

export const lists: List[] = [
  {
    id: "523e4567-e89b-12d3-a456-426614174000", // Random UUID for list-1
    name: "Want to Go",
    creator: "123e4567-e89b-12d3-a456-426614174000", // Sarah Chen's ID
    restaurants: [
      "550e8400-e29b-41d4-a716-446655440000", // Burger House
      "550e8400-e29b-41d4-a716-446655440002", // Pizza Palace
    ],
  },
  {
    id: "957fcdeb-51a2-43d7-9b56-312c9d4f6789", // Random UUID for list-2
    name: "Favorites",
    creator: "987fcdeb-51a2-43d7-9b56-312c9d4f6789", // Marcus Rodriguez's ID
    restaurants: [
      "550e8400-e29b-41d4-a716-446655440001", // Sushi Master
      "550e8400-e29b-41d4-a716-446655440003", // Another Pizza Palace
    ],
  },
  {
    id: "55058400-e29b-41d4-a716-447655440000", // Random UUID for list-3
    name: "Special Occasions",
    creator: "123e4567-e89b-12d3-a456-426614174000", // Sarah Chen's ID
    restaurants: [
      "550e8400-e29b-41d4-a716-446655440001", // Sushi Master
      "550e8400-e29b-41d4-a716-446655440002", // Pizza Palace
      "550e8400-e29b-41d4-a716-446655440003", // Another Pizza Palace
    ],
  },
  {
    id: "111e4565-e89b-12d3-a456-426614174001", // Random UUID for list-4
    name: "New Discoveries",
    creator: "550e8400-e29b-41d4-a716-447655440000", // Emily Parker's ID
    restaurants: [
      "550e8400-e29b-41d4-a716-446655440000", // Burger House
      "550e8400-e29b-41d4-a716-446655440001", // Sushi Master
    ],
  },
];
