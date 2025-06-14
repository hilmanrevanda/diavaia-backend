import { Shippo } from "shippo";
import { NextRequest } from "next/server";
import { APIContracts, APIControllers, Constants } from "authorizenet";

// Define the shape of the expected request body
interface PaymentRequestBody {
  cardNumber: string;
  expirationDate: string; // format "YYYY-MM"
  cardCode: string;
  amount: string; // e.g. "10.00"
}

// Define the shape of a successful response
interface PaymentSuccessResponse {
  success: true;
  transactionId: string;
  responseCode: string;
  authCode: string;
  message: string;
}

// Define the shape of an error response
interface PaymentErrorResponse {
  success: false;
  error: string;
}

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

export const POST = async (req: NextRequest) => {
  // Validate and typecast the incoming body
  const { cardNumber, expirationDate, cardCode, amount } = await req.json()

  if (
    typeof cardNumber !== "string" ||
    typeof expirationDate !== "string" ||
    typeof cardCode !== "string" ||
    typeof amount !== "string"
  ) {
    return new Response(
      JSON.stringify(
        { 
          data: { 
            success: false, 
            error: "Missing or invalid fields in request body." 
          }
        }
      ),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const apiLoginId = process.env.AUTHORIZE_LOGIN_ID;
  const transactionKey = process.env.AUTHORIZE_TRANSACTION_KEY;
  const environment = (process.env.AUTHORIZE_ENVIRONMENT as "sandbox" | "production") || "sandbox";

  if (!apiLoginId || !transactionKey) {
    return new Response(
      JSON.stringify(
        { 
          data: { 
            success: false, 
            error: "API credentials not set in environment."
          }
        }
      ),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // 1) Merchant Authentication
    const merchantAuthentication = new APIContracts.MerchantAuthenticationType();
    merchantAuthentication.setName(apiLoginId);
    merchantAuthentication.setTransactionKey(transactionKey);

    // 2) Credit Card details
    const creditCard = new APIContracts.CreditCardType();
    creditCard.setCardNumber(cardNumber);
    creditCard.setExpirationDate(expirationDate);
    creditCard.setCardCode(cardCode);

    // 3) PaymentType container
    const payment = new APIContracts.PaymentType();
    payment.setCreditCard(creditCard);

    // 4) TransactionRequestType (AUTH_CAPTURE)
    const transactionRequest = new APIContracts.TransactionRequestType();
    transactionRequest.setTransactionType(
      APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION
    );
    transactionRequest.setPayment(payment);
    transactionRequest.setAmount(amount);

    // 5) Top‐level CreateTransactionRequest
    const createRequest = new APIContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuthentication);
    createRequest.setTransactionRequest(transactionRequest);

    // 6) Execute
    const requestJSON = createRequest.getJSON();
    const result = await runAuthorizeNetTransaction(requestJSON, environment);

    return new Response(
      JSON.stringify(
        { 
          data: {
            success: true,
            transactionId: result.transactionId,
            responseCode: result.responseCode,
            authCode: result.authCode,
            message: result.message,
          }
        }
      ),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message ?? "Unknown error." }),
      { status: 500 }
    )
  }
}