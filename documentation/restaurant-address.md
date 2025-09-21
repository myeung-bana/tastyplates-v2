
## Address Formatting Logic

### Priority Order

1. **Primary**: `googleMapUrl.streetAddress` (complete Google Places address)
2. **Secondary**: Composed from `googleMapUrl` components
3. **Fallback**: `listingStreet` (simple text field)
4. **Default**: "No address available"

### Formatting Function

```typescript
function formatAddress(googleMapUrl: GoogleMapUrl | null): string {
  if (!googleMapUrl) return '';
  
  // Priority 1: Use streetAddress if available (most complete)
  if (googleMapUrl.streetAddress && googleMapUrl.streetAddress.trim().length > 0) {
    return googleMapUrl.streetAddress;
  }
  
  // Priority 2: Compose from individual components
  const parts = [
    [googleMapUrl.streetNumber, googleMapUrl.streetName].filter(Boolean).join(' '),
    googleMapUrl.city,
    googleMapUrl.stateShort || googleMapUrl.state,
    googleMapUrl.countryShort || googleMapUrl.country,
    googleMapUrl.postCode
  ].filter(Boolean) as string[];
  
  return parts.join(', ');
}
```

## API Response Format

### Restaurant Object Structure

```typescript
interface Restaurant {
  id: number;
  title: string;
  // ... other fields
  address: string;  // Formatted address using priority logic
  location: {
    longitude?: number;
    latitude?: number;
  };
  googleMapUrl?: GoogleMapUrl;  // Complete structured data
}
```

### Address Mapping in API

```typescript
// API endpoint mapping (src/app/api/v1/restaurants/get-restaurants/route.ts)
address: listing.listingDetails?.googleMapUrl?.streetAddress || 
          listing.listingStreet || 
          'No address available'
```

## Admin Portal Implementation

### 1. Address Input (Edit Form)

- **Component**: GooglePlacesAutocomplete
- **Field**: `formData.listingStreet` (text input)
- **Handler**: `handlePlaceSelect()` - populates both fields
- **Storage**: Updates both `listingStreet` and `googleMapUrl`

### 2. Address Display (View Mode)

- **Source**: `formatAddress(restaurant.listingDetails?.googleMapUrl)`
- **Fallback**: `restaurant.listingStreet`
- **Format**: Complete address with proper formatting

### 3. Address Saving (Update Process)

```typescript
// Update data structure sent to API
const updateData = {
  listingStreet: formData.listingStreet,  // Text field
  googleMapUrl: {
    streetAddress: formData.googleMapUrl.streetAddress,
    streetNumber: formData.googleMapUrl.streetNumber,
    streetName: formData.googleMapUrl.streetName,
    city: formData.googleMapUrl.city,
    state: formData.googleMapUrl.state,
    stateShort: formData.googleMapUrl.stateShort,
    country: formData.googleMapUrl.country,
    countryShort: formData.googleMapUrl.countryShort,
    postCode: formData.googleMapUrl.postCode,
    latitude: formData.googleMapUrl.latitude,
    longitude: formData.googleMapUrl.longitude,
    placeId: formData.googleMapUrl.placeId,
    zoom: formData.googleMapUrl.zoom
  }
};
```

## Client-Side Interface Alignment

### Required Fields for Client Implementation

1. **Address Input**:
   - Google Places Autocomplete integration
   - Store both `streetAddress` and individual components
   - Handle place selection and component parsing

2. **Address Display**:
   - Use same priority logic: `streetAddress` → composed → `listingStreet`
   - Implement truncation for different contexts (cards, tables, forms)
   - Handle fallback gracefully

3. **Data Structure**:
   - Maintain `GoogleMapUrl` interface compatibility
   - Store both structured and text versions
   - Include GPS coordinates for mapping

### Recommended Client Implementation

```typescript
// Client-side address utility
export function getBestAddress(
  googleMapUrl?: GoogleMapUrl | null,
  listingStreet?: string | null,
  fallbackText: string = 'No address available'
): string {
  // Priority 1: Google Map URL street address
  if (googleMapUrl?.streetAddress?.trim()) {
    return googleMapUrl.streetAddress;
  }
  
  // Priority 2: Google Map URL composed address
  const composedAddress = formatAddress(googleMapUrl, { fallbackText: '' });
  if (composedAddress && composedAddress !== 'No address available') {
    return composedAddress;
  }
  
  // Priority 3: Simple listing street
  if (listingStreet?.trim()) {
    return listingStreet;
  }
  
  return fallbackText;
}
```

## Testing Scenarios

### 1. Complete Address
- **Input**: Google Places selection with all components
- **Expected**: Full formatted address from `streetAddress`
- **Test**: Verify all components are stored and displayed

### 2. Partial Address
- **Input**: Manual entry or incomplete Google Places data
- **Expected**: Composed address from available components
- **Test**: Verify graceful handling of missing fields

### 3. No Address
- **Input**: Empty or null address data
- **Expected**: "No address available" fallback
- **Test**: Verify fallback text displays correctly

### 4. Address Updates
- **Input**: Changing address via Google Places or manual entry
- **Expected**: Both `googleMapUrl` and `listingStreet` updated
- **Test**: Verify data persistence and consistency

## Migration Notes

- **Existing Data**: Legacy `listingStreet` fields are preserved
- **Backward Compatibility**: API handles both old and new formats
- **Gradual Migration**: New addresses use structured format, old addresses use fallback

## Error Handling

- **Invalid Coordinates**: Graceful fallback to text address
- **Missing Components**: Use available components, skip missing ones
- **API Failures**: Fallback to `listingStreet` or default text
- **Data Corruption**: Reset to empty state with user notification

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Maintainer**: TastyPlates Development Team