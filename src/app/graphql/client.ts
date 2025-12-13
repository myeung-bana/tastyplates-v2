// apollo-client.ts
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Use proxy URL for local development to avoid CORS issues
const graphqlUrl = process.env.NEXT_PUBLIC_WP_GRAPHQL_API_URL || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port.startsWith('300'))
    ? '/api/graphql-proxy' 
    : 'https://backend.tastyplates.co/graphql');

// Debug: Log the GraphQL URL being used
if (typeof window !== 'undefined') {
  console.log('GraphQL URL:', graphqlUrl);
}

const httpLink = createHttpLink({
  uri: graphqlUrl,
});

// Cache for Firebase token to avoid fetching on every GraphQL request
let cachedToken: string | null = null;
let tokenCacheTime: number = 0;
const TOKEN_CACHE_TTL = 60000; // Cache for 60 seconds

const authLink = setContext(async (_, { headers }) => {
  let token = null;
  
  // Only get token on client-side
  if (typeof window === 'undefined') {
    return { headers };
  }
  
  // Check if we have a cached token that's still valid
  const now = Date.now();
  if (cachedToken && (now - tokenCacheTime) < TOKEN_CACHE_TTL) {
    token = cachedToken;
  } else {
    // Get Firebase ID token
    try {
      const { auth } = await import('@/lib/firebase');
      const currentUser = auth.currentUser;
      if (currentUser) {
        token = await currentUser.getIdToken();
        
        // Update cache
        cachedToken = token;
        tokenCacheTime = now;
      } else {
        // No user logged in
        cachedToken = null;
        tokenCacheTime = 0;
      }
    } catch (error) {
      console.error("Error fetching Firebase token:", error);
      // Clear cache on error
      cachedToken = null;
      tokenCacheTime = 0;
    }
  }

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;