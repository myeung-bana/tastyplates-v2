/**
 * Utility functions for downloading and converting images from URLs
 */

/**
 * Download image from URL and convert to base64 data URL
 * @param imageUrl - URL of the image to download
 * @returns Base64 data URL string
 */
export async function downloadImageAsBase64(imageUrl: string): Promise<string> {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    // Get the blob
    const blob = await response.blob();
    
    // Convert blob to base64
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error downloading image as base64:', error);
    throw error;
  }
}

/**
 * Download Google Places photo and convert to base64
 * Uses server-side proxy to bypass CORS restrictions
 * @param photoUrl - Google Places photo URL
 * @returns Base64 data URL string
 */
export async function downloadGooglePhotoAsBase64(photoUrl: string): Promise<string> {
  try {
    // Use server-side proxy to bypass CORS restrictions
    const response = await fetch('/api/v1/images/download-google-photo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ photoUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to download Google photo');
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to download Google photo');
    }

    return result.data; // Returns base64 data URL
  } catch (error) {
    console.error('Error downloading Google photo via proxy:', error);
    throw error;
  }
}

