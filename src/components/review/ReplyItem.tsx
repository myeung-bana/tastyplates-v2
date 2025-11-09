"use client";
import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { GraphQLReview } from "@/types/graphql";
import { capitalizeWords, stripTags, generateProfileUrl } from "@/lib/utils";
import { PROFILE } from "@/constants/pages";
import FallbackImage, { FallbackImageType } from "../ui/Image/FallbackImage";
import { DEFAULT_USER_ICON } from "@/constants/images";
import "@/styles/components/_reply-item.scss";

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

  return (
    <div className="reply-item">
      <div className="reply-item__container">
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
            <span className="reply-item__username">
              {reply.author?.name || reply.author?.node?.name || "Unknown User"}
            </span>
            <button
              onClick={() => onLike(reply.databaseId)}
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
                  {reply.commentLikes}
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
