import type { Metric } from 'web-vitals'
import { onCLS, onFCP, onFID, onLCP, onTTFB } from 'web-vitals'

interface Option {
  params: { [s: string]: any } | ArrayLike<any>
  path: string
  analyticsId: string
  debug: boolean
}

const vitalsUrl = 'https://vitals.vercel-analytics.com/v1/vitals'

function getConnectionSpeed() {
  return (navigator as any).connection
  && (navigator as any).connection.effectiveType
    ? (navigator as any).connection.effectiveType
    : ''
}

export function sendToAnalytics(metric: Metric, option: Option) {
  const page = Object.entries(option.params).reduce(
    (acc, [key, value]) => acc.replace(value, `[${key}]`),
    option.path,
  )

  const body = {
    dsn: option.analyticsId,
    id: metric.id,
    page,
    href: location.href,
    event_name: metric.name,
    value: metric.value.toString(),
    speed: getConnectionSpeed(),
  }

  if (option.debug)
    // eslint-disable-next-line no-console
    console.log('[Analytics]', metric.name, JSON.stringify(body, null, 2))

  const blob = new Blob([new URLSearchParams(body).toString()], {
    // This content type is necessary for `sendBeacon`
    type: 'application/x-www-form-urlencoded',
  })
  if (navigator.sendBeacon) {
    navigator.sendBeacon(vitalsUrl, blob)
  }
  else {
    fetch(vitalsUrl, {
      body: blob,
      method: 'POST',
      credentials: 'omit',
      keepalive: true,
    })
  }
}

export function webVitals(option: any) {
  try {
    onFID(metric => sendToAnalytics(metric, option))
    onTTFB(metric => sendToAnalytics(metric, option))
    onLCP(metric => sendToAnalytics(metric, option))
    onCLS(metric => sendToAnalytics(metric, option))
    onFCP(metric => sendToAnalytics(metric, option))
  }
  catch (err) {
    console.error('[Analytics]', err)
  }
}
