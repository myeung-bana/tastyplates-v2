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
    const isErrored = useRef(false); // avoid infinite fallback loop

    const initialSrc =
        typeof src === "string" && src.length > 0
            ? src
            : fallbackSrc;

    const [imgSrc, setImgSrc] = useState(initialSrc);

    useEffect(() => {
        if (!isErrored.current && typeof src === "string") {
            setImgSrc(src);
        }
    }, [src]);

    const handleError = () => {
        if (!isErrored.current && imgSrc !== fallbackSrc) {
            isErrored.current = true;
            setImgSrc(fallbackSrc);
        }
    };

    return (
        <Image
            {...rest}
            src={imgSrc}
            alt={alt}
            onError={handleError}
        />
    );
}
