export interface Order {
  status: string;
  BillingDetails: BillingDetails;
  CartDetails: CartDetails;
}

export interface BillingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface CardDetails {
  cardholderName: string;
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
}

export interface CartItem {
  id: string;
  stockID: string;
  name: string;
  quantity: number;
  price?: number;
  hsCode: string;
  collectionName?: string;
}

export interface CartDetails {
  items?: CartItem[];
  total?: number;
  tax?: number;
  duty?: number; 
}

export interface LineTax {
  vat: number;
  duty: number;
}