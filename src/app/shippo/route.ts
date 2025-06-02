import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Shippo } from "shippo";

const shippo = new Shippo({
    apiKeyHeader: process.env.SHIPPO_API_TOKEN,
    shippoApiVersion: "2018-02-08",
});

export const GET = async () => {
  const addressFrom = {
    name: "J. Ntolla",
    company: "Diavaia Inc.",
    street1: "7043 RUE SAINT DENIS",
    city: "MONTREAL",
    state: "Quebec",
    zip: "H2S 2S5",
    country: "CA",
    phone: "6808955559",
    email: "ntolla@shippo.com"
  }

  const addressTo = {
    name: "Diavaia / FedEx Dollar General",
    company: "DIAVAIA INC. / JERUJOHN NTOLLA",
    street1: "64 Lake St",
    street2: "FedEx - Hold for Pickup",
    city: "Rouses Point",
    state: "NY",
    zip: "12979-1028",
    country: "US",
    phone: "6808955559",
    email: "shipping@shippo.com"
  }

  try {
    const shipment = await shippo.shipments.create({
      addressFrom,
      addressTo,
      parcels: [{
          length: "33.66",
          width: "29.21",
          height: "6.03",
          distanceUnit: "cm",
          weight: "800",
          massUnit: "g"
      }],
      async: false,
      carrierAccounts: [ '9bf6d77c4b654f108d254177e506766e' ]
    })

    return new Response(
      JSON.stringify({ rates: shipment }),
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