// Centralized Review Type Definitions
// This file consolidates all review-related types from across the codebase

import * as React from "react"
import { GraphQLReview } from "@/types/graphql"

/**
 * Review Image Structure
 */
export interface ReviewImage {
  databaseId: number
  id: string
  sourceUrl: string
}

/**
 * Reviewed Data Props for Review Cards
 */
export interface ReviewedDataProps {
  databaseId: number
  id: string
  reviewMainTitle: string
  commentLikes: string
  userLiked: boolean
  content: string
  uri: string
  reviewStars: string
  date: string
  reviewImages: ReviewImage[]
  palates: string
  userAvatar?: string
  author: {
    name: string
    node: {
      id: string
      databaseId: number
      name: string
      avatar: {
        url: string
      }
    }
  }
  userId: number
  commentedOn: {
    node: {
      databaseId: number
      title: string
      slug: string
      fieldMultiCheck90?: string
      featuredImage: {
        node: {
          databaseId: string
          altText: string
          mediaItemUrl: string
          mimeType: string
          mediaType: string
        }
      }
    }
  }
}

/**
 * Review Card Component Props
 */
export interface ReviewCardProps {
  data: ReviewedDataProps
  index: number
  width: number
}

/**
 * Review Modal Component Props
 */
export interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  data: GraphQLReview
  initialPhotoIndex?: number
  userLiked?: boolean
  likesCount?: number
  onLikeChange?: (userLiked: boolean, likesCount: number) => void
}

/**
 * Create Review Response
 */
export interface CreateReviewResponse {
  status: number
  data: Record<string, unknown>
}
