// hasura-server-client.ts - Server-side Hasura GraphQL client for API routes
const HASURA_URL = process.env.NEXT_PUBLIC_HASURA_GRAPHQL_API_URL;
const HASURA_ADMIN_SECRET = process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ADMIN_SECRET;

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    extensions?: any;
  }>;
}

export async function hasuraQuery<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<GraphQLResponse<T>> {
  if (!HASURA_URL) {
    throw new Error('NEXT_PUBLIC_HASURA_GRAPHQL_API_URL is not configured');
  }

  const response = await fetch(HASURA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET || '',
    },
    body: JSON.stringify({
      query,
      variables: variables || {},
    }),
  });

  if (!response.ok) {
    throw new Error(`Hasura request failed: ${response.status}`);
  }

  const result: GraphQLResponse<T> = await response.json();
  return result;
}

export async function hasuraMutation<T = any>(
  mutation: string,
  variables?: Record<string, any>
): Promise<GraphQLResponse<T>> {
  return hasuraQuery<T>(mutation, variables);
}

