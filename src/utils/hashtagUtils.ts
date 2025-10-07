export class HashtagUtils {
  static extractHashtags(text: string): string[] {
    if (!text) return [];
    const hashtagRegex = /#[\w\u4e00-\u9fff\u3400-\u4dbf]+/g;
    const matches = text.match(hashtagRegex) || [];
    return matches
      .map((tag) => tag.substring(1).toLowerCase().trim())
      .filter((tag) => tag.length > 0 && tag.length <= 100)
      .filter((tag, index, array) => array.indexOf(tag) === index);
  }

  static isValidHashtag(hashtag: string): boolean {
    if (!hashtag || hashtag.length === 0 || hashtag.length > 100) return false;
    const validRegex = /^[\w\u4e00-\u9fff\u3400-\u4dbf]+$/;
    return validRegex.test(hashtag);
  }

  static formatHashtag(hashtag: string): string {
    return `#${hashtag.toLowerCase()}`;
  }

  static countHashtags(text: string): number {
    return this.extractHashtags(text).length;
  }

  static getSuggestedHashtags(content: string, existingHashtags: string[] = []): string[] {
    const suggestions = [
      'foodie', 'restaurant', 'delicious', 'food', 'tasty', 'yummy',
      'cuisine', 'dining', 'meal', 'lunch', 'dinner', 'breakfast',
      'chef', 'cooking', 'recipe', 'ingredients', 'flavor', 'taste',
      'ambiance', 'service', 'experience', 'recommendation', 'review',
      'chinese', 'italian', 'japanese', 'korean', 'thai', 'mexican',
      'vegan', 'vegetarian', 'glutenfree', 'halal', 'kosher',
      'spicy', 'sweet', 'sour', 'bitter', 'umami', 'fresh',
      'homemade', 'authentic', 'fusion', 'traditional', 'modern'
    ];
    return suggestions
      .filter((suggestion) => !existingHashtags.includes(suggestion))
      .slice(0, 8);
  }

  static highlightHashtags(text: string): string {
    if (!text) return '';
    return text.replace(/#[\w\u4e00-\u9fff\u3400-\u4dbf]+/g, '<span class="hashtag">$&</span>');
  }
}


