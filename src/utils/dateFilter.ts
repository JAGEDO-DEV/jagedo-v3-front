/**
 * Checks if a date falls within the specified time period
 * @param date - The date to check (ISO string or Date object)
 * @param timePeriod - Time period string: "24h", "1w", "1m", "1y", "5y", "todate"
 * @returns boolean indicating if the date is within the time period
 */
export const isDateInTimePeriod = (date: string | Date, timePeriod: string): boolean => {
  if (!date) return false;
  
  const dateToCheck = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateToCheck.getTime())) return false; // Invalid date
  
  const now = new Date();
  
  if (timePeriod === "todate") {
    return true; // Include all dates
  }
  
  let startDate = new Date();

  switch (timePeriod) {
    case "24h":
      startDate.setHours(now.getHours() - 24);
      break;
    case "1w":
      startDate.setDate(now.getDate() - 7);
      break;
    case "1m":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "1y":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case "5y":
      startDate.setFullYear(now.getFullYear() - 5);
      break;
    default:
      // Default to 1 month
      startDate.setMonth(now.getMonth() - 1);
  }

  startDate.setHours(0, 0, 0, 0);
  const checkDate = new Date(dateToCheck);
  checkDate.setHours(0, 0, 0, 0);

  return checkDate >= startDate && checkDate <= now;
};

/**
 * Filters an array of objects by createdAt field based on time period
 * @param data - Array of objects with createdAt field
 * @param timePeriod - Time period string
 * @returns Filtered array
 */
export const filterByCreatedAt = <T extends { createdAt?: string | Date }>(
  data: T[],
  timePeriod: string
): T[] => {
  if (!data || !Array.isArray(data)) return [];
  if (timePeriod === "todate") return data;
  
  return data.filter((item) => {
    if (!item.createdAt) return false;
    return isDateInTimePeriod(item.createdAt, timePeriod);
  });
};

/**
 * Filters a data object recursively, looking for arrays with createdAt fields
 * and filtering them based on the time period. Also recalculates aggregated stats.
 * @param data - The data object to filter
 * @param timePeriod - Time period string
 * @returns Filtered data object with recalculated stats
 */
export const filterDataByTimePeriod = (data: any, timePeriod: string): any => {
  if (!data) return data;
  if (timePeriod === "todate") return data;
  
  // If data is an array, filter it
  if (Array.isArray(data)) {
    return filterByCreatedAt(data, timePeriod);
  }
  
  // If data is an object, recursively filter its properties
  if (typeof data === 'object') {
    const filtered: any = {};
    
    for (const key in data) {
      if (Array.isArray(data[key])) {
        // Check if array items have createdAt
        if (data[key].length > 0 && data[key][0]?.createdAt) {
          filtered[key] = filterByCreatedAt(data[key], timePeriod);
        } else {
          filtered[key] = data[key];
        }
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        filtered[key] = filterDataByTimePeriod(data[key], timePeriod);
      } else {
        filtered[key] = data[key];
      }
    }
    
    return filtered;
  }
  
  return data;
};

