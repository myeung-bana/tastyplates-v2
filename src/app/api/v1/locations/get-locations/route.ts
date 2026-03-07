import { NextResponse } from 'next/server';
import { hasuraQuery } from '@/app/graphql/hasura-server-client';
import { CountryLocation, CityLocation } from '@/constants/location';

const GET_LOCATIONS = `
  query GetActiveLocations {
    restaurant_locations(
      where: { is_active: { _eq: true } }
      order_by: [{ display_order: asc }, { name: asc }]
    ) {
      id
      name
      slug
      type
      short_label
      flag_url
      currency
      timezone
      latitude
      longitude
      parent_id
      display_order
    }
  }
`;

interface DbLocation {
  id: number;
  name: string;
  slug: string;
  type: 'country' | 'city';
  short_label: string | null;
  flag_url: string | null;
  currency: string | null;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
  parent_id: number | null;
  display_order: number;
}

/** Map flat DB rows into the CountryLocation hierarchy the frontend expects. */
function buildHierarchy(rows: DbLocation[]): { countries: CountryLocation[] } {
  const countries = rows.filter(r => r.type === 'country');
  const cities = rows.filter(r => r.type === 'city');

  const countryMap = new Map<number, CountryLocation>();
  const countrySlugMap = new Map<string, CountryLocation>();

  const countryList: CountryLocation[] = countries.map(c => {
    const country: CountryLocation = {
      key: c.slug,
      label: c.name,
      shortLabel: c.short_label ?? c.slug.toUpperCase().slice(0, 3),
      flag: c.flag_url ?? `https://flagcdn.com/${c.short_label?.toLowerCase() ?? 'un'}.svg`,
      currency: c.currency ?? 'USD',
      timezone: c.timezone ?? 'UTC',
      type: 'country',
      cities: [],
    };
    countryMap.set(c.id, country);
    countrySlugMap.set(c.slug, country);
    return country;
  });

  for (const city of cities) {
    if (city.parent_id === null) continue;
    const parentCountry = countryMap.get(city.parent_id);
    if (!parentCountry) continue;

    const cityOption: CityLocation = {
      key: city.slug,
      label: city.name,
      shortLabel: city.short_label ?? city.slug.toUpperCase().slice(0, 3),
      flag: city.flag_url ?? parentCountry.flag,
      currency: city.currency ?? parentCountry.currency,
      timezone: city.timezone ?? parentCountry.timezone,
      type: 'city',
      parentKey: parentCountry.key,
      coordinates: (city.latitude !== null && city.longitude !== null)
        ? { lat: Number(city.latitude), lng: Number(city.longitude) }
        : { lat: 0, lng: 0 },
    };

    parentCountry.cities.push(cityOption);
  }

  return { countries: countryList };
}

export async function GET() {
  try {
    const result = await hasuraQuery<{ restaurant_locations: DbLocation[] }>(GET_LOCATIONS);

    if (result.errors?.length) {
      console.error('[get-locations] GraphQL errors:', result.errors);
      return NextResponse.json(
        { success: false, error: result.errors[0].message },
        { status: 500 }
      );
    }

    const rows = result.data?.restaurant_locations ?? [];

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No active locations found in database' },
        { status: 404 }
      );
    }

    const hierarchy = buildHierarchy(rows);
    const flatList = [
      ...hierarchy.countries,
      ...hierarchy.countries.flatMap(c => c.cities),
    ];

    return NextResponse.json(
      { success: true, hierarchy, flatList },
      {
        status: 200,
        headers: {
          // Cache for 5 minutes at the edge — locations change rarely
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (err: any) {
    console.error('[get-locations] Unexpected error:', err.message);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}
