import { Article } from "@/types/article";

export const MOCK_ARTICLES: Article[] = [
  {
    id: "1",
    slug: "best-ramen-spots-tokyo",
    title: "The Best Ramen Spots in Tokyo You Need to Try",
    excerpt:
      "From rich tonkotsu to delicate shio, we round up Tokyo's unmissable bowls that every food lover should experience at least once.",
    category: "Japanese",
    cover_image_url:
      "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&q=80",
    featured_image_url:
      "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&q=80",
    reading_time_minutes: 5,
    published_at: "2026-02-10T00:00:00.000Z",
    author_name: "Tastyplates Editorial",
    content:
      "Tokyo has more Michelin-starred restaurants than any other city in the world, and its ramen scene is no exception. Whether you prefer the deep umami of a slow-simmered tonkotsu or the clean clarity of a shio broth, Tokyo has a bowl with your name on it...",
    view_count: 1240,
  },
  {
    id: "2",
    slug: "hidden-dim-sum-hong-kong",
    title: "Hidden Dim Sum Restaurants Only Locals Know About",
    excerpt:
      "Skip the tourist traps. These neighbourhood spots serve the real deal — from har gow to turnip cake, made fresh every morning.",
    category: "Chinese",
    cover_image_url:
      "https://images.unsplash.com/photo-1609167830220-7164aa360951?w=600&q=80",
    featured_image_url:
      "https://images.unsplash.com/photo-1609167830220-7164aa360951?w=600&q=80",
    reading_time_minutes: 4,
    published_at: "2026-02-14T00:00:00.000Z",
    author_name: "Tastyplates Editorial",
    content:
      "Dim sum is best enjoyed slowly, with family, and without a reservation queue stretching around the block. We spent a week in Hong Kong's outer districts to find the spots that locals return to week after week...",
    view_count: 876,
    article_linked_locations: [
      {
        id: "mloc-hk-1",
        display_order: 0,
        location_id: "5",
        name: "Hong Kong",
        slug: "hongkong",
        short_label: "HK",
        flag_url: "https://flagcdn.com/hk.svg",
        type: "country",
      },
      {
        id: "mloc-hk-2",
        display_order: 1,
        location_id: "6",
        name: "Kowloon",
        slug: "kowloon",
        short_label: "KLN",
        flag_url: "https://flagcdn.com/hk.svg",
        type: "city",
      },
    ],
    article_linked_restaurants: [
      {
        associationId: "mars-2",
        display_order: 0,
        restaurant_id: "102",
        title: "Lin Heung Tea House",
        slug: "lin-heung-tea-house",
        uuid: "00000000-0000-0000-0000-000000000002",
        imageUrl:
          "https://images.unsplash.com/photo-1544148103-07737bf5558f?w=600&q=80",
        addressLine: "160-164 Wellington St, Central",
        description:
          "Historic cart-style service and classic dim sum favorites in a bustling upstairs hall.",
      },
      {
        associationId: "mars-1",
        display_order: 1,
        restaurant_id: "101",
        title: "Tim Ho Wan",
        slug: "tim-ho-wan-mong-kok",
        uuid: "00000000-0000-0000-0000-000000000001",
        imageUrl:
          "https://images.unsplash.com/photo-1609167830220-7164aa360951?w=600&q=80",
        addressLine: "9-11 Fuk Wing St, Sham Shui Po",
        description:
          "Michelin-starred dim sum hole in the wall known for baked BBQ pork buns and har gow.",
      },
    ],
    article_restaurant_associations: [
      { id: "mars-2", article_id: "2", display_order: 0, restaurant_id: "102" },
      { id: "mars-1", article_id: "2", display_order: 1, restaurant_id: "101" },
    ],
  },
  {
    id: "3",
    slug: "guide-to-korean-bbq",
    title: "A Beginner's Guide to Korean BBQ Etiquette",
    excerpt:
      "Everything you need to know before sitting down at your first samgyeopsal table — from grilling order to wrapping technique.",
    category: "Korean",
    cover_image_url:
      "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&q=80",
    featured_image_url:
      "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&q=80",
    reading_time_minutes: 6,
    published_at: "2026-02-20T00:00:00.000Z",
    author_name: "Tastyplates Editorial",
    content:
      "Korean BBQ is as much about the ritual as it is about the food. There are unwritten rules about who lights the grill, how you pass drinks, and the correct ssam wrap ratio. Get them right and you'll blend in like a local...",
    view_count: 2105,
  },
  {
    id: "4",
    slug: "street-food-bangkok",
    title: "Street Food in Bangkok: A Neighbourhood-by-Neighbourhood Guide",
    excerpt:
      "Pad thai, mango sticky rice, boat noodles — where to find them at their absolute best, beyond the famous Khao San Road.",
    category: "Thai",
    cover_image_url:
      "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600&q=80",
    featured_image_url:
      "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600&q=80",
    reading_time_minutes: 7,
    published_at: "2026-02-25T00:00:00.000Z",
    author_name: "Tastyplates Editorial",
    content:
      "Bangkok's street food scene is one of the most diverse in the world. Each neighbourhood has its own speciality, its own rhythm, and its own set of legendary stalls that have been open since before you were born...",
    view_count: 3312,
  },
  {
    id: "5",
    slug: "best-pasta-in-rome",
    title: "Where to Eat the Best Pasta in Rome, According to Romans",
    excerpt:
      "Cacio e pepe, carbonara, amatriciana — the holy trinity of Roman pasta and where to eat each one properly.",
    category: "Italian",
    cover_image_url:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80",
    featured_image_url:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80",
    reading_time_minutes: 5,
    published_at: "2026-03-01T00:00:00.000Z",
    author_name: "Tastyplates Editorial",
    content:
      "Ask ten Romans where to get the best cacio e pepe and you'll get ten different answers — all of them delivered with absolute certainty. Here's what we found after two weeks of serious eating...",
    view_count: 1887,
  },
  {
    id: "6",
    slug: "spice-guide-indian-cuisine",
    title: "A Beginner's Guide to Spices in Indian Cuisine",
    excerpt:
      "Cumin, cardamom, turmeric, fenugreek — understanding the building blocks that give Indian cooking its extraordinary depth.",
    category: "Indian",
    cover_image_url:
      "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=80",
    featured_image_url:
      "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=80",
    reading_time_minutes: 8,
    published_at: "2026-03-03T00:00:00.000Z",
    author_name: "Tastyplates Editorial",
    content:
      "Indian cuisine is not simply 'spicy'. It is a precisely calibrated orchestra of dozens of spices, each playing a distinct role. Mastering even a handful changes the way you cook and eat forever...",
    view_count: 2451,
  },
  {
    id: "7",
    slug: "izakayas-osaka",
    title: "The Izakaya Experience: Eating and Drinking in Osaka Like a Local",
    excerpt:
      "Osaka's informal izakayas are where the city truly comes alive after dark. Here's how to navigate them.",
    category: "Japanese",
    cover_image_url:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80",
    featured_image_url:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80",
    reading_time_minutes: 6,
    published_at: "2026-03-05T00:00:00.000Z",
    author_name: "Tastyplates Editorial",
    content:
      "An izakaya is somewhere between a pub and a restaurant. You order small dishes to share, drinks keep flowing, and the evening stretches on pleasantly. In Osaka, they are an art form...",
    view_count: 1643,
  },
  {
    id: "8",
    slug: "pho-hanoi-vs-saigon",
    title: "Hanoi Pho vs Saigon Pho: What's Actually the Difference?",
    excerpt:
      "Both cities claim their version is the real one. We visited both to settle the debate — and discovered the truth is more nuanced.",
    category: "Vietnamese",
    cover_image_url:
      "https://images.unsplash.com/photo-1578020190125-f4f7c18bc9cb?w=600&q=80",
    featured_image_url:
      "https://images.unsplash.com/photo-1578020190125-f4f7c18bc9cb?w=600&q=80",
    reading_time_minutes: 5,
    published_at: "2026-03-06T00:00:00.000Z",
    author_name: "Tastyplates Editorial",
    content:
      "The broth, the noodles, the garnishes, the condiments on the table — everything differs between a bowl served in Hanoi and one served in Ho Chi Minh City. Here's the full breakdown...",
    view_count: 2198,
  },
];
