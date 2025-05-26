import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
    uri: "http://wordpress.test/graphql",
    cache: new InMemoryCache(),
});

export default client;
