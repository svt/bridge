/**
 * @copyright Copyright © 2021 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

import Analytics from '@svt/analytics-js'

const ANALYTICS_PROJECT_ID = window.initialState.analyticsId

/**
 * Track a pageview
 * @param { String } page An identifier for the page to track
 * @returns
 */
export function trackPageview (page) {
  if (!ANALYTICS_PROJECT_ID) return
  Analytics.trackPageviewUnsafe(page, {
    projectId: ANALYTICS_PROJECT_ID
  })
}

/**
 * Track a custom event
 * @param { String } event The name of the event to track
 * @param { String } value A value for the event
 * @returns
 */
export function trackEvent (event, value) {
  if (!ANALYTICS_PROJECT_ID) return
  Analytics.trackEventUnsafe(event, value, {
    projectId: ANALYTICS_PROJECT_ID
  })
}
