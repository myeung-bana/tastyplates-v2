import { GraphQLReview } from "@/types/graphql";
import { generateProfileUrl } from "@/lib/utils";
import { DEFAULT_USER_ICON } from "@/constants/images";

export type EngagementAuthor = {
  username: string;
  avatarUrl: string;
  profileHref: string | null;
};

function avatarFromReview(review: GraphQLReview): string {
  if (review.userAvatar && typeof review.userAvatar === "string") {
    return review.userAvatar;
  }
  const url = review.author?.node?.avatar?.url;
  if (typeof url === "string" && url.trim()) return url;
  return DEFAULT_USER_ICON;
}

/**
 * Author shown on the “sign in to engage” modal (review post owner).
 */
export function getEngagementAuthorFromReview(
  review: GraphQLReview | null | undefined
): EngagementAuthor {
  if (!review) {
    return {
      username: "this creator",
      avatarUrl: DEFAULT_USER_ICON,
      profileHref: null,
    };
  }

  const node = review.author?.node;
  const username =
    (node?.username && String(node.username).trim()) ||
    (node?.name && String(node.name).trim()) ||
    (review.author?.name && String(review.author.name).trim()) ||
    "this creator";

  const databaseId = node?.databaseId;
  const href =
    databaseId != null
      ? generateProfileUrl(databaseId, node?.username)
      : "";
  const profileHref = href && href.length > 0 ? href : null;

  return {
    username,
    avatarUrl: avatarFromReview(review),
    profileHref,
  };
}
