import { NextRequest } from "next/server";
import Avatax from 'avatax';

const ACCOUNT_ID = process.env.AVALARA_ACCOUNT_ID!;
const LICENSE_KEY = process.env.AVALARA_LICENSE_KEY!;

// Initialize the AvaTax client using default export and Basic auth
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

export const POST = async (req: NextRequest) => {
  try {
    // Parse JSON body
    const requestJson = await req.json();
    const taxDocument = {
      lines: requestJson.lines,
      type: 0,
      companyCode: 'DEFAULT',
      date: new Date(),
      customerCode: requestJson.customerCode,
      addresses: {
        shipFrom: {
          // From default address
          line1: "7043 Rue Saint Denis",
          city: "Montreal",
          region: "BC",
          country: "CA",
          postalCode: "H2S 2S5"
        },
        shipTo: requestJson.address
      },
      commit: false, // for calculation only
      currencyCode: 'USD'
    };

    // Create transaction (sales tax)
    const result = await client.createTransaction({ model: taxDocument });
    return new Response(
      JSON.stringify({ data : result }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    )
  }
}