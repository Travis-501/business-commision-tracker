import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import * as db from '@/src/db/database';
import { newId } from '@/src/lib/id';
import { sendExternalMessage } from '@/src/services/messagingBridge';
import {
    cancelAppointmentReminder,
    scheduleAppointmentReminder,
} from '@/src/services/reminderNotifications';
import type {
    Business,
    ChatMessage,
    ChatThread,
    Client,
    Debt,
    Invoice,
    LedgerEntry,
    MessagingConfig,
    Reminder,
} from '@/src/types/models';

type Refreshable = () => void;

interface BusinessBooksContextValue {
  ready: boolean;
  businesses: Business[];
  activeBusiness: Business | null;
  clients: Client[];
  debts: Debt[];
  invoices: Invoice[];
  entries: LedgerEntry[];
  reminders: Reminder[];
  threads: ChatThread[];
  messagingConfig: MessagingConfig;
  refresh: Refreshable;
  setActiveBusiness: (id: string) => void;
  addBusiness: (
    name: string,
    currency: string,
    profile?: Partial<Pick<Business, 'location' | 'email' | 'brandColor' | 'invoiceFooter'>>
  ) => void;
  deleteBusiness: (id: string) => void;
  updateActiveBusiness: (patch: Partial<Business>) => void;
  saveClient: (input: Omit<Client, 'id' | 'createdAt' | 'businessId'> & { id?: string }) => void;
  saveDebt: (input: Omit<Debt, 'id' | 'businessId' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  deleteDebt: (id: string) => void;
  saveInvoice: (input: Omit<Invoice, 'id' | 'businessId' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  deleteInvoice: (id: string) => void;
  sendInvoice: (invoiceId: string, channel: ChatThread['channel']) => Promise<{ ok: boolean; error?: string }>;
  saveEntry: (input: Omit<LedgerEntry, 'id' | 'businessId'> & { id?: string }) => void;
  removeEntry: (id: string) => void;
  saveReminder: (
    input: Omit<Reminder, 'id' | 'businessId' | 'notified'> & { id?: string }
  ) => Promise<void>;
  removeReminder: (id: string) => Promise<void>;
  getOrCreateThread: (clientId: string, channel: ChatThread['channel']) => ChatThread;
  sendChatMessage: (threadId: string, body: string) => Promise<{ error?: string }>;
  getThreadMessages: (threadId: string) => ChatMessage[];
  saveMessagingConfig: (config: MessagingConfig) => void;
}

const BusinessBooksContext = createContext<BusinessBooksContextValue | null>(null);

function loadSnapshot(activeId: string | null) {
  const businesses = db.listBusinesses();
  const id = activeId ?? businesses[0]?.id ?? null;
  if (id && id !== activeId) db.setActiveBusinessId(id);
  const activeBusiness = businesses.find((b) => b.id === id) ?? null;
  return {
    businesses,
    activeBusiness,
    clients: id ? db.listClients(id) : [],
    debts: id ? db.listDebts(id) : [],
    invoices: id ? db.listInvoices(id) : [],
    entries: id ? db.listEntries(id) : [],
    reminders: id ? db.listReminders(id) : [],
    threads: id ? db.listThreads(id) : [],
    messagingConfig: db.getMessagingConfig(),
  };
}

export function BusinessBooksProvider({ children }: { children: React.ReactNode }) {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const snapshot = useMemo(() => {
    void tick;
    db.getDb();
    return loadSnapshot(db.getActiveBusinessId());
  }, [tick]);

  const activeId = snapshot.activeBusiness?.id ?? null;

  const setActiveBusiness = useCallback(
    (id: string) => {
      db.setActiveBusinessId(id);
      refresh();
    },
    [refresh]
  );

  const addBusiness = useCallback(
    (
      name: string,
      currency: string,
      profile?: Partial<Pick<Business, 'location' | 'email' | 'brandColor' | 'invoiceFooter'>>
    ) => {
      db.createBusiness({
        name,
        currency,
        location: profile?.location ?? '',
        email: profile?.email ?? '',
        brandColor: profile?.brandColor ?? '#2563eb',
        invoiceFooter: profile?.invoiceFooter ?? '',
        workerPayNumerator: 1,
        workerPayDenominator: 3,
        customRatios: [],
      });
      refresh();
    },
    [refresh]
  );

  const deleteBusiness = useCallback(
    (id: string) => {
      db.deleteBusiness(id);
      refresh();
    },
    [refresh]
  );

  const updateActiveBusiness = useCallback(
    (patch: Partial<Business>) => {
      if (!snapshot.activeBusiness) return;
      db.updateBusiness({ ...snapshot.activeBusiness, ...patch });
      refresh();
    },
    [refresh, snapshot.activeBusiness]
  );

  const saveClient = useCallback(
    (input: Omit<Client, 'id' | 'createdAt' | 'businessId'> & { id?: string }) => {
      if (!activeId) return;
      const client: Client = {
        id: input.id ?? newId(),
        businessId: activeId,
        name: input.name,
        phone: input.phone,
        notes: input.notes,
        createdAt: input.id ? db.getClient(input.id)?.createdAt ?? new Date().toISOString() : new Date().toISOString(),
      };
      db.upsertClient(client);
      refresh();
    },
    [activeId, refresh]
  );

  const saveDebt = useCallback(
    (input: Omit<Debt, 'id' | 'businessId' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      if (!activeId) return;
      const debt: Debt = {
        id: input.id ?? newId(),
        businessId: activeId,
        clientId: input.clientId,
        clientName: input.clientName,
        amount: Number(input.amount) || 0,
        paidAmount: Number(input.paidAmount) || 0,
        note: input.note,
        reminderTemplate: input.reminderTemplate,
        createdAt: input.id ? db.getDebt(input.id)?.createdAt ?? new Date().toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.upsertDebt(debt);
      refresh();
    },
    [activeId, refresh]
  );

  const deleteDebt = useCallback(
    (id: string) => {
      db.deleteDebt(id);
      refresh();
    },
    [refresh]
  );

  const saveInvoice = useCallback(
    (input: Omit<Invoice, 'id' | 'businessId' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      if (!activeId) return;
      const invoice: Invoice = {
        id: input.id ?? newId(),
        businessId: activeId,
        clientId: input.clientId,
        clientName: input.clientName,
        invoiceNumber: input.invoiceNumber,
        issueDate: input.issueDate,
        dueDate: input.dueDate,
        status: input.status,
        paymentMethod: (input as any).paymentMethod ?? '',
        paymentStatus: (input as any).paymentStatus ?? 'not_paid',
        subtotal: Number(input.subtotal) || 0,
        taxRate: Number(input.taxRate) || 0,
        discount: Number(input.discount) || 0,
        notes: input.notes,
        lineItems: input.lineItems,
        createdAt: input.id ? db.getInvoice(input.id)?.createdAt ?? new Date().toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.upsertInvoice(invoice);
      refresh();
    },
    [activeId, refresh]
  );

  const deleteInvoice = useCallback(
    (id: string) => {
      db.deleteInvoice(id);
      refresh();
    },
    [refresh]
  );

  const sendInvoice = useCallback(
    async (invoiceId: string, channel: ChatThread['channel']) => {
      const invoice = snapshot.invoices.find((item) => item.id === invoiceId);
      if (!invoice) return { ok: false, error: 'Invoice not found' };
      const client = invoice.clientId ? db.getClient(invoice.clientId) : null;
      const phone = client?.phone ?? '';
      if (!phone && channel !== 'internal') {
        return { ok: false, error: 'Add a phone number to the customer first.' };
      }

      const total = Math.max(invoice.subtotal - invoice.discount + (invoice.subtotal - invoice.discount) * (invoice.taxRate / 100), 0);
      const message = [
        `Invoice ${invoice.invoiceNumber}`,
        `Customer: ${invoice.clientName}`,
        `Due: ${invoice.dueDate}`,
        `Total: ${total.toFixed(2)}`,
        invoice.notes ? `Notes: ${invoice.notes}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      if (channel === 'internal') {
        return { ok: false, error: 'Choose SMS or WhatsApp to send this invoice.' };
      }

      const result = await sendExternalMessage(snapshot.messagingConfig, channel, phone, message);
      if (result.ok) {
        saveInvoice({ ...invoice, status: 'sent' });
      }
      return { ok: result.ok, error: result.ok ? undefined : result.error };
    },
    [saveInvoice, snapshot.invoices, snapshot.messagingConfig]
  );

  const saveEntry = useCallback(
    (input: Omit<LedgerEntry, 'id' | 'businessId'> & { id?: string }) => {
      if (!activeId) return;

      const entryId = input.id ?? newId();
      const client = input.clientId ? db.getClient(input.clientId) : null;
      const invoiceId = input.invoiceId ?? newId();
      const invoiceNumber = input.invoiceNumber || `INV-${entryId.slice(0, 8).toUpperCase()}`;
      const entryClientName = client?.name || input.clientReference || 'Customer';

      const invoice: Invoice = {
        id: invoiceId,
        businessId: activeId,
        clientId: input.clientId,
        clientName: entryClientName,
        invoiceNumber,
        issueDate: input.entryDate.slice(0, 10),
        dueDate: input.entryDate.slice(0, 10),
        status: 'draft',
        paymentMethod: input['paymentMethod'] ?? '',
        paymentStatus: (input as any)['paymentStatus'] ?? 'not_paid',
        subtotal: Number(input.amount) || 0,
        taxRate: 0,
        discount: 0,
        notes: input.description,
        lineItems: [
          {
            id: newId(),
            description: input.description || `${input.type} entry`,
            quantity: 1,
            rate: Number(input.amount) || 0,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.upsertInvoice(invoice);

      const entry: LedgerEntry = {
        ...input,
        id: entryId,
        businessId: activeId,
        clientId: input.clientId,
        clientReference: input.clientReference ?? '',
        jobId: input.jobId || newId().slice(0, 8).toUpperCase(),
        jobType: input.jobType ?? '',
        type: input.type,
        amount: input.amount,
        spentMoney: Number(input.spentMoney) || 0,
        paymentMethod: (input as any).paymentMethod ?? '',
        paymentStatus: (input as any).paymentStatus ?? 'not_paid',
        description: input.description,
        entryDate: input.entryDate,
        invoiceId,
        invoiceNumber,
        isDraft: input.isDraft,
      };
      db.upsertEntry(entry);
      refresh();
    },
    [activeId, refresh]
  );

  const removeEntry = useCallback(
    (id: string) => {
      db.deleteEntry(id);
      refresh();
    },
    [refresh]
  );

  const saveReminder = useCallback(
    async (input: Omit<Reminder, 'id' | 'businessId' | 'notified'> & { id?: string }) => {
      if (!activeId) return;
      const id = input.id ?? newId();
      const reminder: Reminder = {
        id,
        businessId: activeId,
        clientId: input.clientId,
        title: input.title,
        body: input.body,
        scheduledAt: input.scheduledAt,
        notified: false,
      };
      db.upsertReminder(reminder);
      await cancelAppointmentReminder(id);
      await scheduleAppointmentReminder(id, reminder.title, reminder.body, new Date(reminder.scheduledAt));
      refresh();
    },
    [activeId, refresh]
  );

  const removeReminder = useCallback(
    async (id: string) => {
      await cancelAppointmentReminder(id);
      db.deleteReminder(id);
      refresh();
    },
    [refresh]
  );

  const getOrCreateThread = useCallback(
    (clientId: string, channel: ChatThread['channel']) => {
      if (!activeId) throw new Error('No active business');
      const existing = db
        .listThreads(activeId)
        .find((t) => t.clientId === clientId && t.channel === channel);
      if (existing) return existing;
      const thread: ChatThread = {
        id: newId(),
        businessId: activeId,
        clientId,
        channel,
        lastMessageAt: new Date().toISOString(),
      };
      db.upsertThread(thread);
      refresh();
      return thread;
    },
    [activeId, refresh]
  );

  const getThreadMessages = useCallback((threadId: string) => db.listMessages(threadId), []);

  const sendChatMessage = useCallback(
    async (threadId: string, body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return {};

      const thread = snapshot.threads.find((t) => t.id === threadId);
      if (!thread) {
        return { error: 'This chat thread is unavailable.' };
      }

      const client = db.getClient(thread.clientId);
      const message: ChatMessage = {
        id: newId(),
        threadId,
        direction: 'out',
        body: trimmed,
        createdAt: new Date().toISOString(),
        externalId: null,
      };
      db.insertMessage(message);
      db.upsertThread({ ...thread, lastMessageAt: message.createdAt });
      refresh();

      if (thread.channel !== 'internal' && client?.phone) {
        const result = await sendExternalMessage(
          snapshot.messagingConfig,
          thread.channel,
          client.phone,
          trimmed
        );
        if (!result.ok) return { error: result.error };
      }
      return {};
    },
    [refresh, snapshot.messagingConfig, snapshot.threads]
  );

  const saveMessagingConfig = useCallback(
    (config: MessagingConfig) => {
      db.saveMessagingConfig(config);
      refresh();
    },
    [refresh]
  );

  const value: BusinessBooksContextValue = {
    ready: true,
    ...snapshot,
    refresh,
    setActiveBusiness,
    addBusiness,
    deleteBusiness,
    updateActiveBusiness,
    saveClient,
    saveDebt,
    deleteDebt,
    saveInvoice,
    deleteInvoice,
    sendInvoice,
    saveEntry,
    removeEntry,
    saveReminder,
    removeReminder,
    getOrCreateThread,
    sendChatMessage,
    getThreadMessages,
    saveMessagingConfig,
  };

  return (
    <BusinessBooksContext.Provider value={value}>{children}</BusinessBooksContext.Provider>
  );
}

export function useBusinessBooks() {
  const ctx = useContext(BusinessBooksContext);
  if (!ctx) throw new Error('useBusinessBooks must be used within BusinessBooksProvider');
  return ctx;
}
