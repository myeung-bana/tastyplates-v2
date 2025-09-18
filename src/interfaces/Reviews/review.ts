export interface ReviewedDataProps {
  databaseId: number;
  id: string;
  reviewMainTitle: string;
  commentLikes: string;
  userLiked: boolean;
  content: string;
  uri: string;
  reviewStars: string;
  date: string;
  reviewImages: {
    databaseId: number;
    id: string;
    sourceUrl: string;
  }[];
  palates: string;
  userAvatar?: string;
  author: {
    name: string
    node: {
      id: string;
      databaseId: number
      name: string;
      avatar: {
        url: string;
      }
    }
  }
  userId: number;
  commentedOn: {
    node: {
      databaseId: number;
      title: string;
      slug: string;
      fieldMultiCheck90?: string;
      featuredImage: {
        node: {
          databaseId: string;
          altText: string;
          mediaItemUrl: string;
          mimeType: string;
          mediaType: string;
          }
      }
    }
  }
}

export interface ReviewCardProps {
  data: ReviewedDataProps;
  index: number
  width: number
}

export interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Record<string, unknown>;
  initialPhotoIndex?: number;
  userLiked?: boolean;
  likesCount?: number;
  onLikeChange?: (userLiked: boolean, likesCount: number) => void;
}

export interface CreateReviewResponse {
  status: number;
  data: Record<string, unknown>;
}