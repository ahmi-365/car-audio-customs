export type InvoiceItem = {
  name: string;
  description?: string;
  price: number;
  quantity: number;
};

export type InvoiceClient = {
  name: string;
  regNo?: string;
  address?: string;
  phone?: string;
  email?: string;
};

export type Invoice = {
  _id: string;
  invoiceNumber: string;
  client: InvoiceClient;
  items: InvoiceItem[];
  notes?: string;
  subtotal: number;
  total: number;
  depositPaid: number;
  balanceDue: number;
  paymentMethod: "Cash" | "Card" | "Bank Transfer" | "Mixed" | "None";
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
};

export type InvoicePayload = {
  client: InvoiceClient;
  items: InvoiceItem[];
  notes?: string;
  depositPaid?: number;
  paymentMethod?: "Cash" | "Card" | "Bank Transfer" | "Mixed" | "None";
};
