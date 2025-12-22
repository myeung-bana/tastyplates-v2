// hasura-server-client.ts - Server-side Hasura GraphQL client for API routes
const HASURA_URL = process.env.NEXT_PUBLIC_HASURA_GRAPHQL_API_URL;
const HASURA_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET;

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
    const error = new Error('NEXT_PUBLIC_HASURA_GRAPHQL_API_URL is not configured');
    console.error('Hasura configuration error:', error.message);
    throw error;
  }

  if (!HASURA_ADMIN_SECRET) {
    console.warn('HASURA_ADMIN_SECRET is not configured - requests may fail if Hasura requires authentication');
  }

  try {
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
      const errorText = await response.text().catch(() => 'Unknown error');
      const error = new Error(`Hasura request failed: ${response.status} ${response.statusText}. ${errorText}`);
      console.error('Hasura request failed:', {
        status: response.status,
        statusText: response.statusText,
        url: HASURA_URL,
        errorText: errorText.substring(0, 500), // Limit error text length
      });
      throw error;
    }

    const result: GraphQLResponse<T> = await response.json();
    
    // Log if there are GraphQL errors (but don't throw - let the caller handle it)
    if (result.errors && result.errors.length > 0) {
      console.error('Hasura GraphQL errors:', JSON.stringify(result.errors, null, 2));
    }
    
    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Hasura query error:', error.message);
      // Check if it's a network error
      if (error.message.includes('fetch') || error.message.includes('network')) {
        throw new Error(`Failed to connect to Hasura at ${HASURA_URL}. Check your network connection and Hasura URL.`);
      }
    }
    throw error;
  }
}

export async function hasuraMutation<T = any>(
  mutation: string,
  variables?: Record<string, any>
): Promise<GraphQLResponse<T>> {
  return hasuraQuery<T>(mutation, variables);
}

