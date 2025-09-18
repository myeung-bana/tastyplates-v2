// Type guards for runtime type safety

import { GraphQLReview, GraphQLReviewImage, GraphQLAuthor, GraphQLCommentedOn, PageInfo } from '@/types/graphql';

export function isGraphQLReviewImage(data: unknown): data is GraphQLReviewImage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'databaseId' in data &&
    'id' in data &&
    'sourceUrl' in data &&
    typeof (data as GraphQLReviewImage).databaseId === 'number' &&
    typeof (data as GraphQLReviewImage).id === 'string' &&
    typeof (data as GraphQLReviewImage).sourceUrl === 'string'
  );
}

export function isGraphQLAuthor(data: unknown): data is GraphQLAuthor {
  return (
    typeof data === 'object' &&
    data !== null &&
    'name' in data &&
    'node' in data &&
    typeof (data as GraphQLAuthor).name === 'string' &&
    typeof (data as GraphQLAuthor).node === 'object' &&
    (data as GraphQLAuthor).node !== null &&
    'id' in (data as GraphQLAuthor).node &&
    'databaseId' in (data as GraphQLAuthor).node &&
    'name' in (data as GraphQLAuthor).node &&
    'avatar' in (data as GraphQLAuthor).node
  );
}

export function isGraphQLCommentedOn(data: unknown): data is GraphQLCommentedOn {
  return (
    typeof data === 'object' &&
    data !== null &&
    'node' in data &&
    typeof (data as GraphQLCommentedOn).node === 'object' &&
    (data as GraphQLCommentedOn).node !== null &&
    'databaseId' in (data as GraphQLCommentedOn).node &&
    'title' in (data as GraphQLCommentedOn).node &&
    'slug' in (data as GraphQLCommentedOn).node
  );
}

export function isGraphQLReview(data: unknown): data is GraphQLReview {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'databaseId' in data &&
    'reviewMainTitle' in data &&
    'date' in data &&
    'content' in data &&
    'author' in data &&
    'commentedOn' in data &&
    typeof (data as GraphQLReview).id === 'string' &&
    typeof (data as GraphQLReview).databaseId === 'number' &&
    typeof (data as GraphQLReview).reviewMainTitle === 'string' &&
    typeof (data as GraphQLReview).date === 'string' &&
    typeof (data as GraphQLReview).content === 'string' &&
    isGraphQLAuthor((data as GraphQLReview).author) &&
    isGraphQLCommentedOn((data as GraphQLReview).commentedOn)
  );
}

export function isGraphQLReviewArray(data: unknown): data is GraphQLReview[] {
  return Array.isArray(data) && data.every(isGraphQLReview);
}

export function isPageInfo(data: unknown): data is PageInfo {
  return (
    typeof data === 'object' &&
    data !== null &&
    'hasNextPage' in data &&
    'endCursor' in data &&
    typeof (data as PageInfo).hasNextPage === 'boolean' &&
    (typeof (data as PageInfo).endCursor === 'string' || (data as PageInfo).endCursor === null)
  );
}

export function isReviewsResponse(data: unknown): data is { reviews: GraphQLReview[]; pageInfo: PageInfo } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'reviews' in data &&
    'pageInfo' in data &&
    isGraphQLReviewArray((data as { reviews: unknown }).reviews) &&
    isPageInfo((data as { pageInfo: unknown }).pageInfo)
  );
}

// Validation utility
export function validateGraphQLResponse<T>(
  data: unknown,
  validator: (data: unknown) => data is T
): T {
  if (!validator(data)) {
    throw new Error('Invalid data structure received from GraphQL');
  }
  return data;
}
