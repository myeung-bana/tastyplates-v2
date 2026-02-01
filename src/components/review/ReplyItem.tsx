"use client";
import React from "react";
import Link from "next/link";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { GraphQLReview } from "@/types/graphql";
import { capitalizeWords, stripTags, generateProfileUrl, formatLikeCount } from "@/lib/utils";
import { PROFILE } from "@/constants/pages";
import FallbackImage, { FallbackImageType } from "../ui/Image/FallbackImage";
import { DEFAULT_USER_ICON } from "@/constants/images";
import PalateTags from "@/components/ui/PalateTags/PalateTags";
import "@/styles/components/_reply-item.scss";

interface ReplyItemProps {
  reply: GraphQLReview;
  onLike: (reply: GraphQLReview) => void;
  onProfileClick: () => void;
  isLoading: boolean;
}

const ReplyItem: React.FC<ReplyItemProps> = ({
  reply,
  onLike,
  onProfileClick,
  isLoading
}) => {
  const { user } = useFirebaseSession();

  return (
    <div className="reply-item">
      <div className="reply-item__container">
        {reply.author?.node?.id ? (
          user ? (
            <Link
              href={String(user.id) === String(reply.author.node.id) ? PROFILE : generateProfileUrl(reply.author.node.id, reply.author.node.username)}
              passHref
            >
              <FallbackImage
                src={reply.userAvatar || DEFAULT_USER_ICON}
                alt={reply.author?.node?.name || "User"}
                width={32}
                height={32}
                className="reply-item__avatar"
                type={FallbackImageType.Icon}
              />
            </Link>
          ) : (
            <FallbackImage
              src={reply.userAvatar || DEFAULT_USER_ICON}
              alt={reply.author?.node?.name || "User"}
              width={32}
              height={32}
              className="reply-item__avatar"
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
            className="reply-item__avatar"
            type={FallbackImageType.Icon}
          />
        )}
        
        <div className="reply-item__content">
          <div className="reply-item__header">
            <div className="flex items-center gap-2">
              <span className="reply-item__username">
                {reply.author?.name || reply.author?.node?.name || "Unknown User"}
              </span>
              {/* Palate Tags - Inline with username */}
              {(() => {
                const palateNames = reply.palates 
                  ? (typeof reply.palates === 'string' 
                      ? reply.palates.split('|').map(p => p.trim()).filter(Boolean)
                      : [])
                  : [];
                return palateNames.length > 0 ? (
                  <PalateTags palateNames={palateNames} maxTags={2} className="mb-0" />
                ) : null;
              })()}
            </div>
            <button
              onClick={() => onLike(reply)}
              disabled={isLoading}
              className="reply-item__like-btn"
            >
              {isLoading ? (
                <div className="reply-item__spinner" />
              ) : reply.userLiked ? (
                <AiFillHeart className="reply-item__heart reply-item__heart--liked" />
              ) : (
                <AiOutlineHeart className="reply-item__heart" />
              )}
              {reply.commentLikes > 0 && (
                <span className="reply-item__like-count">
                  {formatLikeCount(reply.commentLikes)}
                </span>
              )}
            </button>
          </div>
          
          <p className="reply-item__text">
            {capitalizeWords(stripTags(reply.content || ""))}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReplyItem;
