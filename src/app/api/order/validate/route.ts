import { NextRequest } from "next/server";
import type { BillingDetails, CardDetails, CartDetails, CartItem } from "../interfaces";
import { getProductDocs, calculateTotalPrice, getProductById, getProductPriceById } from "../helper/products";
import { taxCalculate, getTotalTaxes } from "../helper/avalara";
import { authorizePayment } from "../helper/authorize";
import { generateInvoiceNumber } from "../helper/invoice";

export const POST = async (req: NextRequest) => {
  const {
    currencyCode,
    billingDetails,
    cardDetails,
    cartDetails,
    coupon
  }: {
    currencyCode: string;
    coupon?: string;
    billingDetails: BillingDetails;
    cardDetails: CardDetails;
    cartDetails: CartDetails;
  } = await req.json();  
  
  try {
    let cart: CartDetails = {};

    // Get product details
    const productOnPayload = await getProductDocs(cartDetails);

    // Calculate total
    const total = calculateTotalPrice(productOnPayload);

    let items: CartItem[] = [];
    cartDetails.items?.flatMap(item => {
      items.push({
        id: item.id,
        stockID: item.stockID,
        name: item.name,
        quantity: item.quantity,
        price: getProductPriceById(productOnPayload, item.id),
        hsCode: item.hsCode
      });
    });

    cart.items = items;
    cart.total = total;

    // Calculate tax
    const taxDocument = await taxCalculate(billingDetails, cart, currencyCode);
    const tax = getTotalTaxes(taxDocument);

    cart.tax = tax.vat;
    cart.duty = tax.duty;

    // Authorize Payment
    const invoiceNumber = generateInvoiceNumber();
    const authorize = await authorizePayment(invoiceNumber, cardDetails, billingDetails, cart);

    return new Response(
      JSON.stringify({
        invoiceNumber,
        cart,
        authorize
      }),
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