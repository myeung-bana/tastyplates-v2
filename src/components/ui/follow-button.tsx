"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const followButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[50px] font-neusans font-normal transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        following: "bg-white text-black border border-black hover:bg-gray-50",
        notFollowing: "bg-[#ff7c0a] text-white border border-[#ff7c0a] hover:bg-[#d55a00] hover:border-[#d55a00]",
      },
      size: {
        default: "px-4 py-2 text-xs min-w-[80px] h-fit",
        sm: "px-3 py-1.5 text-xs min-w-[70px] h-fit",
        lg: "px-6 py-2.5 text-sm min-w-[100px] h-fit",
      },
    },
    defaultVariants: {
      variant: "notFollowing",
      size: "default",
    },
  }
)

export interface FollowButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick">,
    VariantProps<typeof followButtonVariants> {
  isFollowing: boolean
  isLoading?: boolean
  onToggle: (isFollowing: boolean) => void | Promise<void>
  loadingText?: {
    following?: string
    unfollowing?: string
  }
  children?: React.ReactNode
}

const FollowButton = React.forwardRef<HTMLButtonElement, FollowButtonProps>(
  (
    {
      className,
      variant,
      size,
      isFollowing,
      isLoading = false,
      onToggle,
      loadingText = {
        following: "Following...",
        unfollowing: "Unfollowing...",
      },
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      e.stopPropagation()
      
      if (disabled || isLoading) return
      
      await onToggle(isFollowing)
    }

    const displayVariant = isFollowing ? "following" : "notFollowing"
    const displayText = isLoading
      ? (isFollowing ? loadingText.unfollowing : loadingText.following)
      : (isFollowing ? "Following" : "Follow")

    return (
      <button
        data-slot="follow-button"
        ref={ref}
        className={cn(
          followButtonVariants({ variant: displayVariant, size, className })
        )}
        onClick={handleClick}
        disabled={disabled || isLoading}
        aria-label={isFollowing ? "Unfollow user" : "Follow user"}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="animate-pulse">{displayText}</span>
        ) : (
          children || displayText
        )}
      </button>
    )
  }
)

FollowButton.displayName = "FollowButton"

export { FollowButton, followButtonVariants }

