export function formatDuration(months: number): string {
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} ans`;
  return `${years} ans ${rem} mois`;
}

export function formatAmount(value: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)} %`;
}

export function sliderFill(value: number, min: number, max: number): string {
  return `${Math.round(((value - min) / (max - min)) * 100)}%`;
}
