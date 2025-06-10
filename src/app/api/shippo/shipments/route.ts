import { Shippo } from "shippo";
import { NextRequest } from "next/server";

const shippo = new Shippo({
    apiKeyHeader: process.env.SHIPPO_API_TOKEN,
    shippoApiVersion: "2018-02-08",
});

// carrierAccounts [Test]: 9bf6d77c4b654f108d254177e506766e
// addressFrom [Default]: 88eb1a1791fc43a399c45153e107eb0d
// parcel 33.66 x 29.21 x 6.03 cm and 800 g: 0831c4b4d19f449c8f27c9c809d904aa
export const POST = async (req: NextRequest) => {
  const requestJson = await req.json(),
        carrierAccounts = ['9bf6d77c4b654f108d254177e506766e'],
        addressFrom = '88eb1a1791fc43a399c45153e107eb0d',
        parcels = ['0831c4b4d19f449c8f27c9c809d904aa'],
        async = false;

  const addressTo = {
    name: requestJson.name,
    street1: requestJson.street1,
    street2: requestJson.street2,
    city: requestJson.city,
    state: requestJson.state,
    zip: requestJson.zip,
    country: requestJson.country,
    phone: requestJson.phone,
    emai: requestJson.email
  };

  try {
    const result = await shippo.shipments.create({
        addressTo,
        addressFrom,
        carrierAccounts,
        parcels,
        async
    });

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