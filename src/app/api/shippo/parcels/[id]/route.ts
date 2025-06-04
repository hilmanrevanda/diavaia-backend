import { Shippo } from "shippo";
import { NextRequest } from "next/server";

const shippo = new Shippo({
    apiKeyHeader: process.env.SHIPPO_API_TOKEN,
    shippoApiVersion: "2018-02-08",
});

export const GET = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const id: string = (await context.params).id;
  
  try {
    const result = await shippo.parcels.list(Number(id));

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