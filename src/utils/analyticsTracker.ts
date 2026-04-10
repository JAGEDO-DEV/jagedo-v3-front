/**
 * Analytics Tracker - Captures user actions and events
 * Sends data to backend for storage and analysis
 */

interface PageViewData {
  page: string;
  timestamp: string;
  userAgent: string;
}

interface EventData {
  action: string;
  data: any;
  timestamp: string;
  userAgent: string;
}

/**
 * Track page views
 */
export const trackPageView = async (
  page: string,
  axiosInstance: any
): Promise<void> => {
  try {
    const payload: PageViewData = {
      page,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    await axiosInstance.post('/api/analytics/page-view', payload, {
      timeout: 5000, // 5 second timeout
    });
  } catch (err) {
    console.warn('[Analytics] Failed to track page view:', err);
    // Don't throw - analytics failures shouldn't break the app
  }
};

/**
 * Track user actions/events
 */
export const trackUserAction = async (
  action: string,
  data: any,
  axiosInstance: any
): Promise<void> => {
  try {
    const payload: EventData = {
      action,
      data,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    await axiosInstance.post('/api/analytics/event', payload, {
      timeout: 5000, // 5 second timeout
    });
  } catch (err) {
    console.warn('[Analytics] Failed to track event:', err);
    // Don't throw - analytics failures shouldn't break the app
  }
};

/**
 * Track button clicks
 */
export const trackButtonClick = async (
  buttonName: string,
  context?: Record<string, any>,
  axiosInstance?: any
): Promise<void> => {
  if (!axiosInstance) return;
  
  await trackUserAction(
    'button_click',
    { buttonName, context },
    axiosInstance
  );
};

/**
 * Track form submissions
 */
export const trackFormSubmit = async (
  formName: string,
  formData?: Record<string, any>,
  axiosInstance?: any
): Promise<void> => {
  if (!axiosInstance) return;
  
  await trackUserAction(
    'form_submit',
    { formName, fieldsCount: Object.keys(formData || {}).length },
    axiosInstance
  );
};

/**
 * Track API calls
 */
export const trackAPICall = async (
  endpoint: string,
  method: string,
  status: number,
  axiosInstance?: any
): Promise<void> => {
  if (!axiosInstance) return;
  
  await trackUserAction(
    'api_call',
    { endpoint, method, status },
    axiosInstance
  );
};

/**
 * Track search queries
 */
export const trackSearch = async (
  query: string,
  resultsCount: number,
  axiosInstance?: any
): Promise<void> => {
  if (!axiosInstance) return;
  
  await trackUserAction(
    'search',
    { query, resultsCount },
    axiosInstance
  );
};

/**
 * Track filter/sort actions
 */
export const trackFilterSort = async (
  filterType: string,
  filterValue: string,
  axiosInstance?: any
): Promise<void> => {
  if (!axiosInstance) return;
  
  await trackUserAction(
    'filter_sort',
    { filterType, filterValue },
    axiosInstance
  );
};

/**
 * Track errors
 */
export const trackError = async (
  errorMessage: string,
  errorStack?: string,
  axiosInstance?: any
): Promise<void> => {
  if (!axiosInstance) return;
  
  await trackUserAction(
    'error',
    { errorMessage, errorStack: errorStack?.slice(0, 500) },
    axiosInstance
  );
};
