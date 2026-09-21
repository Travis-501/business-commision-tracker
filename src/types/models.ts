export type EntryType = 'income' | 'expense' | 'worker_pay' | 'payment';

export type ChatChannel = 'internal' | 'sms' | 'whatsapp';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface Invoice {
  id: string;
  businessId: string;
  clientId: string | null;
  clientName: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  subtotal: number;
  taxRate: number;
  discount: number;
  notes: string;
  lineItems: InvoiceLineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  id: string;
  name: string;
  currency: string;
  location: string;
  email: string;
  brandColor: string;
  invoiceFooter: string;
  /** e.g. pay workers 1 part of every 3 parts of daily income */
  workerPayNumerator: number;
  workerPayDenominator: number;
  customRatios: CustomRatio[];
  createdAt: string;
}

export interface CustomRatio {
  id: string;
  label: string;
  numerator: number;
  denominator: number;
  appliesTo: 'daily_income' | 'monthly_income';
}

export interface Client {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  notes: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  businessId: string;
  clientId: string | null;
  clientName: string;
  amount: number;
  paidAmount: number;
  note: string;
  reminderTemplate: string;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerEntry {
  id: string;
  businessId: string;
  clientId: string | null;
  clientReference: string;
  jobId: string;
  jobType: string;
  type: EntryType;
  amount: number;
  spentMoney: number;
  description: string;
  entryDate: string;
  invoiceId: string | null;
  invoiceNumber: string;
  /** draft entries let you "play" with numbers before saving */
  isDraft: boolean;
}

export interface Reminder {
  id: string;
  businessId: string;
  clientId: string | null;
  title: string;
  body: string;
  scheduledAt: string;
  notified: boolean;
}

export interface ChatThread {
  id: string;
  businessId: string;
  clientId: string;
  channel: ChatChannel;
  lastMessageAt: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  direction: 'in' | 'out';
  body: string;
  createdAt: string;
  externalId: string | null;
}

export interface MessagingConfig {
  smsProvider: 'none' | 'twilio';
  whatsappProvider: 'none' | 'twilio' | 'meta';
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioFromNumber: string;
  metaWhatsappToken: string;
  metaPhoneNumberId: string;
}

export const defaultMessagingConfig = (): MessagingConfig => ({
  smsProvider: 'none',
  whatsappProvider: 'none',
  twilioAccountSid: '',
  twilioAuthToken: '',
  twilioFromNumber: '',
  metaWhatsappToken: '',
  metaPhoneNumberId: '',
});
