
export const checkImageType = (image: string) => {
    return (/\.(gif|jpe?g|tiff?|png|webp|bmp|svg)$/i).test(image)
}