import Avatax from 'avatax'
import type { BillingDetails, CartDetails, CartItem, LineTax } from "../interfaces";
import { getProductPriceById } from "../helper/products";

const ACCOUNT_ID = process.env.AVALARA_ACCOUNT_ID!
const LICENSE_KEY = process.env.AVALARA_LICENSE_KEY!

const client = new Avatax({
  appName: process.env.APP_NAME as string,
  appVersion: process.env.APP_VESTION as string,
  environment: process.env.ENVIRONMENT === 'production' ? 'production' : 'sandbox',
  machineName: 'payload-server',
  timeout: 60000,
}).withSecurity({
  username: ACCOUNT_ID,
  password: LICENSE_KEY,
});

export async function taxCalculate(billingDetails: BillingDetails, cartDetails: CartDetails, currencyCode: string): Promise<any> {
  const taxDocument = {
    type: 0,
    companyCode: 'DEFAULT',
    date: new Date(),
    customerCode: billingDetails.email,
    lines: (cartDetails.items ?? []).map((item: CartItem) => ({
      amount: item.price ?? 0,
      quantity: item.quantity,
      description: item.name,
      hsCode: item.hsCode
    })),
    addresses: {
      shipFrom: {
        // From default address
        line1: '7043 Rue Saint Denis',
        city: 'Montreal',
        region: 'QC',
        country: 'CA',
        postalCode: 'H2S 2S5',
      },
      shipTo: {
        line1: billingDetails.addressLine1,
        line2: billingDetails?.addressLine2,
        city: billingDetails.city,
        region: billingDetails?.state,
        country: billingDetails?.country,
        postalCode: billingDetails.postalCode,
      },
    },
    commit: false, // for calculation only
    currencyCode,
  }

  return await client.createTransaction({ model: taxDocument });
}

/**
 * Calculates VAT and Duty totals for each line in the TAX response.
 * @param taxResponse - object containing a `lines` array with `details` and `nonPassthroughDetails`
 * @returns array of LineTax entries
 */
export function getLineTaxes(taxResponse: any): LineTax[] {
  if (!taxResponse?.lines || !Array.isArray(taxResponse.lines)) {
    return [];
  }

  if (taxResponse?.addresses[0]?.country === 'CA' ){
    return [
      {
        vat: taxResponse?.totalTaxCalculated || 0,
        duty: 0
      }
    ];
  }

  return taxResponse.lines.map((line: any) => {
    const details = Array.isArray(line.nonPassthroughDetails)
      ? line.nonPassthroughDetails
      : [];

    const vatDetail = details[0] || {};
    const dutyDetail = details[1] || {};

    return {
      vat: vatDetail.tax,
      duty: dutyDetail.tax,
    };
  });
}

/**
 * Calculates aggregated VAT and Duty totals across all lines in the TAX response.
 * @param taxResponse - object containing a `lines` array with `details` and `nonPassthroughDetails`
 * @returns an object with totalVAT and totalDuty
 */
export function getTotalTaxes(taxResponse: any): LineTax {
  const lineTaxes = getLineTaxes(taxResponse);
  return lineTaxes.reduce(
    (totals: LineTax, lt: LineTax) => ({
      vat: totals.vat + lt.vat,
      duty: totals.duty + lt.duty,
    }),
    { vat: 0, duty: 0 }
  );
}