# useCuisines Hook

A centralized hook for fetching and formatting cuisines from the `/api/v1/cuisines` endpoint. This ensures consistent cuisine selectors across the entire application.

## Usage

### Basic Usage (Hierarchical Structure)

```typescript
import { useCuisines } from '@/hooks/useCuisines';

const MyComponent = () => {
  const { cuisineOptions, loading, error } = useCuisines();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <CustomMultipleSelect
      items={cuisineOptions}
      // ... other props
    />
  );
};
```

### Fetch Only Parent Cuisines

```typescript
const { cuisineOptions } = useCuisines({ parentOnly: true });
```

### Fetch Children of Specific Parent

```typescript
const { cuisineOptions } = useCuisines({ parentId: 1 });
```

### Search Cuisines

```typescript
const { cuisineOptions } = useCuisines({ search: 'italian' });
```

### For Filters and Search Fields

```typescript
// In a search/filter component
const [searchTerm, setSearchTerm] = useState('');

const { cuisineOptions, loading } = useCuisines({
  search: searchTerm,
  limit: 50, // Limit results for performance
});

// The hook automatically handles:
// - Caching (5 minutes by default)
// - Loading states
// - Error handling
// - Hierarchical structure transformation
```

### Disable Caching

```typescript
const { cuisineOptions, refresh } = useCuisines({
  enableCache: false,
});

// Or manually refresh (bypasses cache)
await refresh();
```

## Return Values

- `cuisineOptions`: Formatted options ready for `CustomMultipleSelect`
- `cuisines`: Raw cuisine data from API
- `loading`: Loading state
- `error`: Error message if fetch failed
- `total`: Total count of cuisines (for pagination)
- `hasMore`: Whether there are more results
- `refresh`: Function to manually refresh data (bypasses cache)

## Benefits

1. **Single Source of Truth**: All components use the same API endpoint
2. **Consistent Format**: Same transformation logic everywhere
3. **Automatic Updates**: Changes in database reflect in UI automatically
4. **Performance**: Built-in caching reduces API calls
5. **Type Safety**: Full TypeScript support
6. **Flexible**: Supports various use cases (search, filters, pagination)

## Migration Notes

When migrating existing components:
1. Replace `palateOptions` import with `useCuisines()` hook
2. Use `cuisineOptions` instead of hardcoded options
3. Handle `loading` and `error` states appropriately
4. Update placeholder text to show loading/error states

