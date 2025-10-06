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

const authLink = setContext(async (_, { headers }) => { // Make this an async function
  // This part needs to be dynamic. You cannot use useSession here.
  // Instead, you need a way to get the token *at the time of the request*.
  // One common pattern is to store the token (or a way to retrieve it)
  // in a global accessible place after login, or get it from a utility function.

  let token = null;  
  // If you are using next-auth and want to fetch the session token
  // for client-side requests, you often need to get it like this:
  try {
    // This is the correct way to get the session token client-side outside of a component
    // You might need to import getSession or directly access localStorage/sessionStorage
    // where next-auth stores the token, or pass it from _app.tsx context.
    const response = await fetch('/api/auth/session'); // Or directly read from where next-auth stores it
    const sessionData = await response.json();
    token = sessionData?.accessToken || null;
  } catch (error) {
    console.error("Error fetching session token:", error);
    // Handle error, e.g., redirect to login
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