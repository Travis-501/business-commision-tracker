export type EntryType = 'income' | 'expense' | 'worker_pay' | 'payment';

export type ChatChannel = 'internal' | 'sms' | 'whatsapp';

export interface Business {
  id: string;
  name: string;
  currency: string;
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

export interface LedgerEntry {
  id: string;
  businessId: string;
  clientId: string | null;
  jobId: string;
  type: EntryType;
  amount: number;
  description: string;
  entryDate: string;
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
