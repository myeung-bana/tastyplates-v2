import client from "@/app/graphql/client";
import { GET_ALL_RECENT_REVIEWS, GET_COMMENT_REPLIES } from "@/app/graphql/Reviews/reviews";

export class ReviewRepository {
  static async getAllReviews(first = 8, after: string | null = null) {
    const { data } = await client.query({
      query: GET_ALL_RECENT_REVIEWS,
      variables: { first, after },
    });

    return {
      reviews: data.comments.nodes ?? [],
      pageInfo: data.comments.pageInfo ?? { endCursor: null, hasNextPage: false }
    };
  }

  static async getCommentReplies(id: string) {
    const { data } = await client.query({
      query: GET_COMMENT_REPLIES,
      variables: { id },
    });

    return data?.comment?.replies?.nodes || [];
  }
}