import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_WP_GRAPHQL_API_URL,
});

const client = new ApolloClient({
  link: ApolloLink.from([httpLink]), // Enables request-level headers via `context`
  cache: new InMemoryCache(),
});

export default client;
