'use client';

import { DEFAULT_IMAGE, DEFAULT_USER_ICON, DEFAULT_USER_IMAGE } from "@/constants/images";
import Image, { ImageProps } from "next/image";
import { useState, useEffect, useRef } from "react";

export enum FallbackImageType {
    Avatar = "avatar",
    Icon = "icon",
    Default = "default",
}

const FALLBACK_IMAGE_MAP: Record<FallbackImageType, string> = {
    [FallbackImageType.Avatar]: DEFAULT_USER_IMAGE,
    [FallbackImageType.Icon]: DEFAULT_USER_ICON,
    [FallbackImageType.Default]: DEFAULT_IMAGE,
};

type FallbackImageProps = ImageProps & {
    type?: FallbackImageType;
};

export default function FallbackImage({
    src,
    alt = "image",
    type = FallbackImageType.Default,
    ...rest
}: FallbackImageProps) {
    const fallbackSrc = FALLBACK_IMAGE_MAP[type];
    const [imgSrc, setImgSrc] = useState<string>(fallbackSrc);
    const isErrored = useRef(false);

    useEffect(() => {
        // When src changes, reset to fallback first to give visual feedback
        if (typeof src === "string" && src.length > 0) {
            const img = new window.Image();
            img.src = src;
            img.onload = () => {
                if (!isErrored.current) {
                    setImgSrc(src);
                }
            };
        } else {
            setImgSrc(fallbackSrc);
        }
    }, [src, fallbackSrc]);

    return (
        <Image
            {...rest}
            src={imgSrc}
            alt={alt}
            onError={() => {
                if (!isErrored.current) {
                    isErrored.current = true;
                    setImgSrc(fallbackSrc);
                }
            }}
        />
    );
}
