// openingHoursUtils.ts - Utilities for parsing and formatting opening hours

export interface OpeningHours {
  [day: string]: string; // e.g., "Monday": "5:00 PM - 3:00 AM" or "Closed"
}

export interface FormattedDay {
  day: string;
  hours: string;
  isToday: boolean;
  isClosed: boolean;
}

export interface GroupedHours {
  days: string[];
  hours: string;
  isToday: boolean;
  isClosed: boolean;
}

/**
 * Parse opening hours from JSON string or object
 */
export const parseOpeningHours = (openingHours: string | object | null | undefined): OpeningHours | null => {
  if (!openingHours) return null;
  
  if (typeof openingHours === 'string') {
    try {
      return JSON.parse(openingHours);
    } catch {
      // If it's not valid JSON, return null
      return null;
    }
  }
  
  if (typeof openingHours === 'object') {
    return openingHours as OpeningHours;
  }
  
  return null;
};

/**
 * Get current day name
 */
export const getCurrentDay = (): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

/**
 * Get day order (Sunday = 0, Monday = 1, etc.)
 */
const getDayOrder = (day: string): number => {
  const dayMap: { [key: string]: number } = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };
  return dayMap[day] ?? -1;
};

/**
 * Format opening hours into a structured array
 */
export const formatOpeningHours = (openingHours: string | object | null | undefined): FormattedDay[] => {
  const parsed = parseOpeningHours(openingHours);
  if (!parsed) return [];
  
  const currentDay = getCurrentDay();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return days
    .map(day => ({
      day,
      hours: parsed[day] || 'Not available',
      isToday: day === currentDay,
      isClosed: parsed[day]?.toLowerCase() === 'closed' || !parsed[day]
    }))
    .sort((a, b) => getDayOrder(a.day) - getDayOrder(b.day));
};

/**
 * Check if two days are consecutive (handles Sunday wrap-around)
 */
const areConsecutiveDays = (day1: string, day2: string): boolean => {
  const order1 = getDayOrder(day1);
  const order2 = getDayOrder(day2);
  
  // Normal consecutive (e.g., Mon -> Tue)
  if (order2 === order1 + 1) return true;
  
  // Sunday wrap-around (Sat -> Sun)
  if (order1 === 6 && order2 === 0) return true;
  
  return false;
};

/**
 * Group consecutive days with the same hours
 */
export const groupOpeningHours = (openingHours: string | object | null | undefined): GroupedHours[] => {
  const formatted = formatOpeningHours(openingHours);
  if (formatted.length === 0) return [];
  
  const grouped: GroupedHours[] = [];
  let currentGroup: GroupedHours | null = null;
  
  formatted.forEach((item, index) => {
    const previousItem = index > 0 ? formatted[index - 1] : null;
    
    const isSameHours = 
      currentGroup && 
      currentGroup.hours === item.hours && 
      currentGroup.isClosed === item.isClosed;
    
    const isConsecutive = previousItem 
      ? areConsecutiveDays(previousItem.day, item.day)
      : false;
    
    // Group if same hours AND consecutive days
    if (isSameHours && isConsecutive && currentGroup) {
      // Add to existing group
      currentGroup.days.push(item.day);
      if (item.isToday) {
        currentGroup.isToday = true;
      }
    } else {
      // Start new group
      if (currentGroup) {
        grouped.push(currentGroup);
      }
      currentGroup = {
        days: [item.day],
        hours: item.hours,
        isToday: item.isToday,
        isClosed: item.isClosed
      };
    }
    
    // Push last group
    if (index === formatted.length - 1 && currentGroup) {
      grouped.push(currentGroup);
    }
  });
  
  return grouped;
};

/**
 * Format day range string (e.g., "Mon - Wed" or "Monday")
 */
export const formatDayRange = (days: string[]): string => {
  if (days.length === 1) {
    return days[0].substring(0, 3); // "Mon", "Tue", etc.
  }
  
  if (days.length === 2) {
    return `${days[0].substring(0, 3)}, ${days[1].substring(0, 3)}`;
  }
  
  // Check if consecutive
  const sortedDays = [...days].sort((a, b) => getDayOrder(a) - getDayOrder(b));
  const isConsecutive = sortedDays.every((day, index) => {
    if (index === 0) return true;
    const prevDay = sortedDays[index - 1];
    return getDayOrder(day) === getDayOrder(prevDay) + 1 || 
           (getDayOrder(prevDay) === 6 && getDayOrder(day) === 0); // Sunday wrap
  });
  
  if (isConsecutive) {
    return `${sortedDays[0].substring(0, 3)} - ${sortedDays[sortedDays.length - 1].substring(0, 3)}`;
  }
  
  return days.map(d => d.substring(0, 3)).join(', ');
};

