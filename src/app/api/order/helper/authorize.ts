import { APIContracts, APIControllers, Constants } from "authorizenet";
import type { BillingDetails, CartDetails, CardDetails } from "../interfaces";

// Helper to wrap the Authorize.Net callback API into a Promise
function runAuthorizeNetTransaction(
  requestJSON: any,
  environment: "sandbox" | "production"
): Promise<{
  transactionId: string;
  responseCode: string;
  authCode: string;
  message: string;
}> {
  return new Promise((resolve, reject) => {
    const controller = new APIControllers.CreateTransactionController(requestJSON);

    if (environment === "production") {
      controller.setEnvironment(Constants.endpoint.production);
    } else {
      controller.setEnvironment(Constants.endpoint.sandbox);
    }

    controller.execute(() => {
      const apiResponse = controller.getResponse();
      if (!apiResponse) {
        return reject(new Error("No response from Authorize.Net."));
      }

      const response = new APIContracts.CreateTransactionResponse(apiResponse);

      const resultCode = response.getMessages().getResultCode();
      if (resultCode === APIContracts.MessageTypeEnum.OK) {
        const txnResponse = response.getTransactionResponse();
        if (txnResponse && txnResponse.getMessages()) {
          const msg = txnResponse.getMessages().getMessage()[0];
          return resolve({
            transactionId: txnResponse.getTransId(),
            responseCode: txnResponse.getResponseCode(),
            authCode: txnResponse.getAuthCode(),
            message: msg.getDescription(),
          });
        } else if (txnResponse && txnResponse.getErrors()) {
          const err = txnResponse.getErrors().getError()[0];
          return reject(
            new Error(
              `Transaction Error. Code: ${err.getErrorCode()}, Text: ${err.getErrorText()}`
            )
          );
        } else {
          return reject(
            new Error("Unknown transactionResponse status (no messages, no errors).")
          );
        }
      } else {
        const topError = response.getMessages().getMessage()[0];
        return reject(
          new Error(`API Error. Code: ${topError.getCode()}, Text: ${topError.getText()}`)
        );
      }
    });
  });
}

export async function authorizePayment(invoiceNumber: string, cardDetails: CardDetails, billingDetails: BillingDetails, cartDetails: CartDetails): Promise<any> {
  const apiLoginId = process.env.AUTHORIZE_LOGIN_ID as string;
  const transactionKey = process.env.AUTHORIZE_TRANSACTION_KEY as string;
  const environment = (process.env.ENVIRONMENT as "sandbox" | "production") || "sandbox";

  // 1) Merchant Authentication
  const merchantAuthentication = new APIContracts.MerchantAuthenticationType();
  merchantAuthentication.setName(apiLoginId);
  merchantAuthentication.setTransactionKey(transactionKey);

  // 2) Credit Card details
  const creditCard = new APIContracts.CreditCardType();
  creditCard.setCardNumber(cardDetails.cardNumber);
  creditCard.setExpirationDate(cardDetails.expiryMonth + cardDetails.expiryYear);
  creditCard.setCardCode(cardDetails.cvv);

  // 3) PaymentType container
  const payment = new APIContracts.PaymentType();
  payment.setCreditCard(creditCard);

  const orderDetails = new APIContracts.OrderType();
	orderDetails.setInvoiceNumber(invoiceNumber);

  const tax = new APIContracts.ExtendedAmountType();
	tax.setAmount(cartDetails.tax);

	const duty = new APIContracts.ExtendedAmountType();
	duty.setAmount(cartDetails.duty);

	const billTo = new APIContracts.CustomerAddressType();
	billTo.setFirstName(billingDetails.firstName);
	billTo.setLastName(billingDetails.lastName);
	billTo.setAddress(billingDetails.addressLine1 + ', ' + billingDetails.addressLine2);
	billTo.setCity(billingDetails.city);
	billTo.setState(billingDetails.state);
	billTo.setZip(billingDetails.postalCode);
	billTo.setCountry(billingDetails.country);

	const shipTo = new APIContracts.CustomerAddressType();
	shipTo.setFirstName(billingDetails.firstName);
	shipTo.setLastName(billingDetails.lastName);
	shipTo.setAddress(billingDetails.addressLine1 + ', ' + billingDetails.addressLine2);
	shipTo.setCity(billingDetails.city);
	shipTo.setState(billingDetails.state);
	shipTo.setZip(billingDetails.postalCode);
	shipTo.setCountry(billingDetails.country);

  let lineItemList: APIContracts.LineItemType[] = [];
  let itemCount = 1;
  cartDetails.items?.flatMap(item => {
    console.log({item})
    const lineItem = new APIContracts.LineItemType();
    lineItem.setItemId(itemCount + '');
    lineItem.setName(item.name);
    lineItem.setDescription("");
    lineItem.setQuantity(item.quantity);
    lineItem.setUnitPrice(item.price);
    lineItem.setTaxable(true);

    lineItemList.push(lineItem);
    itemCount++;
  });

	const lineItems = new APIContracts.ArrayOfLineItem();
	lineItems.setLineItem(lineItemList);

  // 4) TransactionRequestType (AUTH_CAPTURE)
  const transactionRequest = new APIContracts.TransactionRequestType();
  transactionRequest.setTransactionType(
    APIContracts.TransactionTypeEnum.AUTHONLYTRANSACTION
  );
  transactionRequest.setPayment(payment);
  transactionRequest.setAmount(cartDetails.total);
	transactionRequest.setLineItems(lineItems);
	transactionRequest.setOrder(orderDetails);
	transactionRequest.setTax(tax);
	transactionRequest.setDuty(duty);
	transactionRequest.setBillTo(billTo);
	transactionRequest.setShipTo(shipTo);

  // 5) Top‐level CreateTransactionRequest
  const createRequest = new APIContracts.CreateTransactionRequest();
  createRequest.setMerchantAuthentication(merchantAuthentication);
  createRequest.setTransactionRequest(transactionRequest);

  // 6) Execute
  const requestJSON = createRequest.getJSON();
  const result = await runAuthorizeNetTransaction(requestJSON, environment);

  return result;
}