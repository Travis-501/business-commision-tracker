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
  entries: LedgerEntry[];
  reminders: Reminder[];
  threads: ChatThread[];
  messagingConfig: MessagingConfig;
  refresh: Refreshable;
  setActiveBusiness: (id: string) => void;
  addBusiness: (name: string, currency: string) => void;
  updateActiveBusiness: (patch: Partial<Business>) => void;
  saveClient: (input: Omit<Client, 'id' | 'createdAt' | 'businessId'> & { id?: string }) => void;
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
    (name: string, currency: string) => {
      db.createBusiness({
        name,
        currency,
        workerPayNumerator: 1,
        workerPayDenominator: 3,
        customRatios: [],
      });
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

  const saveEntry = useCallback(
    (input: Omit<LedgerEntry, 'id' | 'businessId'> & { id?: string }) => {
      if (!activeId) return;
      const entry: LedgerEntry = {
        id: input.id ?? newId(),
        businessId: activeId,
        clientId: input.clientId,
        jobId: input.jobId || newId().slice(0, 8).toUpperCase(),
        type: input.type,
        amount: input.amount,
        description: input.description,
        entryDate: input.entryDate,
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
      const client = thread ? db.getClient(thread.clientId) : null;
      const message: ChatMessage = {
        id: newId(),
        threadId,
        direction: 'out',
        body: trimmed,
        createdAt: new Date().toISOString(),
        externalId: null,
      };
      db.insertMessage(message);
      if (thread) {
        db.upsertThread({ ...thread, lastMessageAt: message.createdAt });
      }
      refresh();

      if (thread && thread.channel !== 'internal' && client?.phone) {
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
    updateActiveBusiness,
    saveClient,
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
