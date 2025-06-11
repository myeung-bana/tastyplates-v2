export interface ReviewedDataProps {
  databasedId: number;
  id: number;
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
  }
  author: {
    name: string
    node: {
      id: string;
      databaseId: number
      name: string;
      palates: string;
      avatar: {
        url: string;
      }
    }
  }
  commentedOn: {
    node: {
      databaseId: number;
      title: string;
      slug: string;
      fieldMultiCheck90: string;
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
  data: any;
}