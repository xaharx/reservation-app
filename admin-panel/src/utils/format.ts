// Mirrors src/services/notification.service.js's formatMoney() so amounts
// shown in the admin panel match what's in customer-facing notifications.
export function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}
