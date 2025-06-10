import { Shippo } from "shippo";
import { NextRequest } from "next/server";

const shippo = new Shippo({
    apiKeyHeader: process.env.SHIPPO_API_TOKEN,
    shippoApiVersion: "2018-02-08",
});

// addressFrom [Default]: 88eb1a1791fc43a399c45153e107eb0d
export const GET = async (req: NextRequest) => {
  // const { name, street1, street2, city, state, zip, country, phone, email} = req;
  const addressFrom = "88eb1a1791fc43a399c45153e107eb0d",
        parcel = "66aa4d058dc84a318edfdfcc4c001355",
        name = "Rahul Sharma",
        street1 = "5th Floor, Shapath V",
        street2 = "Near Karnavati Club, S.G. Highway",
        city = "Ahmedabad",
        state = "Gujarat",
        zip = "380015",
        country = "IN",
        phone = "912267000000",
        email = "rahulsharma@example.com",
        totalPrice = "1000",
        quantity = 1;
  
  try {
    const result = await shippo.ratesAtCheckout.create({
      addressFrom,
      addressTo: { name, street1, street2, city, state, zip, country, phone, email },
      lineItems: [ {
        currency: "USD",
        manufactureCountry: "US",
        quantity,
        totalPrice,
        weight: "800",
        weightUnit: "g"
      } ],
      parcel
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