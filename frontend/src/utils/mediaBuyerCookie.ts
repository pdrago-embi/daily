const COOKIE_NAME = 'default_media_buyer'

export function getDefaultMediaBuyer(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`))
  return match ? match[2] : null
}

export function setDefaultMediaBuyer(buyerId: string) {
  if (typeof document === 'undefined') return
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1)
  document.cookie = `${COOKIE_NAME}=${buyerId}; expires=${expires.toUTCString()}; path=/`
}

export function clearDefaultMediaBuyer() {
  if (typeof document === 'undefined') return
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}
