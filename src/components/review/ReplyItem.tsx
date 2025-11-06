"use client";
import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { GraphQLReview } from "@/types/graphql";
import { capitalizeWords, stripTags, PAGE, formatDate, generateProfileUrl } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { PROFILE } from "@/constants/pages";
import FallbackImage, { FallbackImageType } from "../ui/Image/FallbackImage";
import { DEFAULT_USER_ICON } from "@/constants/images";

interface ReplyItemProps {
  reply: GraphQLReview;
  onLike: (replyId: number) => void;
  onProfileClick: () => void;
  isLoading: boolean;
}

const ReplyItem: React.FC<ReplyItemProps> = ({
  reply,
  onLike,
  onProfileClick,
  isLoading
}) => {
  const { data: session } = useSession();

  // Debug logging to identify date format issues
  console.log('🔍 Reply data:', reply);
  console.log('📅 Reply date:', reply.date);
  console.log('📅 Date type:', typeof reply.date);

  // Helper function to format relative time
  const formatRelativeTime = (dateString: string): string => {
    console.log('🕒 formatRelativeTime called with:', dateString);
    console.log('🌍 Current timezone offset:', new Date().getTimezoneOffset());
    console.log('🕐 Current local time:', new Date().toISOString());
    
    if (!dateString) {
      console.log('❌ Empty date string');
      return '';
    }
    
    try {
      // Handle different date formats
      let date: Date;
      
      // Check if it's already a valid ISO string
      if (dateString.includes('T') && dateString.includes('Z')) {
        // ISO string with timezone (e.g., '2024-01-15T10:30:00Z')
        date = new Date(dateString);
        console.log('📅 Parsed ISO date:', date);
      } else if (dateString.includes('T')) {
        // ISO string without timezone (e.g., '2024-01-15T10:30:00')
        // Treat as UTC to avoid timezone conversion issues
        date = new Date(dateString + 'Z');
        console.log('📅 Parsed ISO date (forced UTC):', date);
      } else {
        // Try parsing as regular date
        date = new Date(dateString);
        console.log('📅 Parsed regular date:', date);
      }
            
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.log('⚠️ Invalid date, trying YYYY-MM-DD format');
        // Try to parse as YYYY-MM-DD format
        const parts = dateString.split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts;
          if (!year || !month || !day) return formatDate(dateString);
          const validDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (!isNaN(validDate.getTime())) {
            console.log('✅ Successfully parsed YYYY-MM-DD format');
            const relativeTime = formatDistanceToNow(validDate, { addSuffix: true });
            return relativeTime.replace('about ', '').replace('less than a minute ago', 'just now');
          }
        }
        console.log('❌ Falling back to formatDate');
        return formatDate(dateString);
      }
      
      const relativeTime = formatDistanceToNow(date, { addSuffix: true });
      console.log('✅ Generated relative time:', relativeTime);
      
      // Convert to more readable format (e.g., "2 days ago" instead of "2 days")
      return relativeTime.replace('about ', '').replace('less than a minute ago', 'just now');
    } catch (error) {
      console.log('❌ Error in formatRelativeTime:', error);
      return formatDate(dateString);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-3">
        {reply.author?.node?.id ? (
          session?.user ? (
            <Link
              href={String(session.user.id) === String(reply.author.node.id) ? PROFILE : generateProfileUrl(reply.author.node.id)}
              passHref
            >
              <FallbackImage
                src={reply.userAvatar || DEFAULT_USER_ICON}
                alt={reply.author?.node?.name || "User"}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full cursor-pointer flex-shrink-0"
                type={FallbackImageType.Icon}
              />
            </Link>
          ) : (
            <FallbackImage
              src={reply.userAvatar || DEFAULT_USER_ICON}
              alt={reply.author?.node?.name || "User"}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full cursor-pointer flex-shrink-0"
              onClick={onProfileClick}
              type={FallbackImageType.Icon}
            />
          )
        ) : (
          <FallbackImage
            src={reply.userAvatar || DEFAULT_USER_ICON}
            alt={reply.author?.node?.name || "User"}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full flex-shrink-0"
            type={FallbackImageType.Icon}
          />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-xs">
                {reply.author?.name || reply.author?.node?.name || "Unknown User"}
              </span>
            </div>
            <span className="text-gray-500 text-xs">
              {formatRelativeTime(reply.date)}
            </span>
          </div>
          
          <p className="text-xs mb-2">
            {capitalizeWords(stripTags(reply.content || ""))}
          </p>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onLike(reply.databaseId)}
              disabled={isLoading}
              className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
              ) : reply.userLiked ? (
                <AiFillHeart className="w-4 h-4 text-red-500" />
              ) : (
                <AiOutlineHeart className="w-4 h-4" />
              )}
              <span className="text-xs">
                {reply.commentLikes || 0}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplyItem;
