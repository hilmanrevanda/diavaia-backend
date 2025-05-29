/* eslint-disable @typescript-eslint/no-explicit-any */
const fieldParsers: Record<string, (value: any) => any> = {
  carats: parseFloat,
  length: parseFloat,
  width: parseFloat,
  height: parseFloat,
  depth: parseFloat,
  table: parseFloat,
  starLength: (v) => parseFloat(v || 0),
  lowerGirdle: (v) => parseFloat(v || 0),
  crownHeight: parseFloat,
  crownAngle: parseFloat,
  pavAngle: parseFloat,
  pavHeight: parseFloat,
  pavDepth: parseFloat,
  price: parseFloat,
  markup_price: parseFloat,
  price_per_carat: parseFloat,
  deliveredPrice: parseFloat,
  videosFrame: parseFloat,
  minDeliveryDays: (v) => parseInt(v || 0),
  maxDeliveryDays: (v) => parseInt(v || 0),
  canada_mark_eligible: (v) => v === 'TRUE',
  is_returnable: (v) => v === 'Y',
}

export function transformRow(row: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}

  for (const key in row) {
    const parser = fieldParsers[key]
    result[key] = parser ? parser(row[key]) : row[key]
  }

  result.published = true
  return result
}
