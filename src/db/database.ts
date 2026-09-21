import * as SQLite from 'expo-sqlite';

import { newId } from '@/src/lib/id';
import type {
  Business,
  ChatMessage,
  ChatThread,
  Client,
  LedgerEntry,
  MessagingConfig,
  Reminder,
} from '@/src/types/models';
import { defaultMessagingConfig } from '@/src/types/models';

let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('businessbooks.db');
    initSchema(db);
  }
  return db;
}

function initSchema(database: SQLite.SQLiteDatabase) {
  database.execSync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      currency TEXT NOT NULL,
      worker_pay_numerator REAL NOT NULL,
      worker_pay_denominator REAL NOT NULL,
      custom_ratios_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY NOT NULL,
      business_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY NOT NULL,
      business_id TEXT NOT NULL,
      client_id TEXT,
      job_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      entry_date TEXT NOT NULL,
      is_draft INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY NOT NULL,
      business_id TEXT NOT NULL,
      client_id TEXT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      notified INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_threads (
      id TEXT PRIMARY KEY NOT NULL,
      business_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      last_message_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY NOT NULL,
      thread_id TEXT NOT NULL,
      direction TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      external_id TEXT,
      FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  const count = database.getFirstSync<{ c: number }>('SELECT COUNT(*) as c FROM businesses');
  if (count && count.c === 0) {
    seedDemoBusiness(database);
  }
}

function seedDemoBusiness(database: SQLite.SQLiteDatabase) {
  const id = newId();
  const now = new Date().toISOString();
  database.runSync(
    `INSERT INTO businesses (id, name, currency, worker_pay_numerator, worker_pay_denominator, custom_ratios_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    'Main business',
    'USD',
    1,
    3,
    '[]',
    now
  );
  database.runSync(
    `INSERT INTO app_meta (key, value) VALUES ('active_business_id', ?)`,
    id
  );
}

function rowToBusiness(row: Record<string, unknown>): Business {
  return {
    id: String(row.id),
    name: String(row.name),
    currency: String(row.currency),
    workerPayNumerator: Number(row.worker_pay_numerator),
    workerPayDenominator: Number(row.worker_pay_denominator),
    customRatios: JSON.parse(String(row.custom_ratios_json || '[]')),
    createdAt: String(row.created_at),
  };
}

export function listBusinesses(): Business[] {
  return getDb()
    .getAllSync<Record<string, unknown>>('SELECT * FROM businesses ORDER BY created_at ASC')
    .map(rowToBusiness);
}

export function getActiveBusinessId(): string | null {
  const row = getDb().getFirstSync<{ value: string }>(
    `SELECT value FROM app_meta WHERE key = 'active_business_id'`
  );
  return row?.value ?? null;
}

export function setActiveBusinessId(id: string) {
  getDb().runSync(
    `INSERT INTO app_meta (key, value) VALUES ('active_business_id', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    id
  );
}

export function createBusiness(input: Omit<Business, 'id' | 'createdAt'>): Business {
  const business: Business = {
    ...input,
    id: newId(),
    createdAt: new Date().toISOString(),
  };
  getDb().runSync(
    `INSERT INTO businesses (id, name, currency, worker_pay_numerator, worker_pay_denominator, custom_ratios_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    business.id,
    business.name,
    business.currency,
    business.workerPayNumerator,
    business.workerPayDenominator,
    JSON.stringify(business.customRatios),
    business.createdAt
  );
  if (!getActiveBusinessId()) setActiveBusinessId(business.id);
  return business;
}

export function updateBusiness(business: Business) {
  getDb().runSync(
    `UPDATE businesses SET name = ?, currency = ?, worker_pay_numerator = ?, worker_pay_denominator = ?, custom_ratios_json = ?
     WHERE id = ?`,
    business.name,
    business.currency,
    business.workerPayNumerator,
    business.workerPayDenominator,
    JSON.stringify(business.customRatios),
    business.id
  );
}

export function listClients(businessId: string): Client[] {
  return getDb()
    .getAllSync<Record<string, unknown>>(
      'SELECT * FROM clients WHERE business_id = ? ORDER BY name ASC',
      businessId
    )
    .map((row) => ({
      id: String(row.id),
      businessId: String(row.business_id),
      name: String(row.name),
      phone: String(row.phone),
      notes: String(row.notes),
      createdAt: String(row.created_at),
    }));
}

export function upsertClient(client: Client) {
  getDb().runSync(
    `INSERT INTO clients (id, business_id, name, phone, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, phone = excluded.phone, notes = excluded.notes`,
    client.id,
    client.businessId,
    client.name,
    client.phone,
    client.notes,
    client.createdAt
  );
}

export function getClient(id: string): Client | null {
  const row = getDb().getFirstSync<Record<string, unknown>>(
    'SELECT * FROM clients WHERE id = ?',
    id
  );
  if (!row) return null;
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    name: String(row.name),
    phone: String(row.phone),
    notes: String(row.notes),
    createdAt: String(row.created_at),
  };
}

export function listEntries(businessId: string): LedgerEntry[] {
  return getDb()
    .getAllSync<Record<string, unknown>>(
      'SELECT * FROM entries WHERE business_id = ? ORDER BY entry_date DESC',
      businessId
    )
    .map(rowToEntry);
}

function rowToEntry(row: Record<string, unknown>): LedgerEntry {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    clientId: row.client_id ? String(row.client_id) : null,
    jobId: String(row.job_id),
    type: row.type as LedgerEntry['type'],
    amount: Number(row.amount),
    description: String(row.description),
    entryDate: String(row.entry_date),
    isDraft: Boolean(row.is_draft),
  };
}

export function upsertEntry(entry: LedgerEntry) {
  getDb().runSync(
    `INSERT INTO entries (id, business_id, client_id, job_id, type, amount, description, entry_date, is_draft)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       client_id = excluded.client_id,
       job_id = excluded.job_id,
       type = excluded.type,
       amount = excluded.amount,
       description = excluded.description,
       entry_date = excluded.entry_date,
       is_draft = excluded.is_draft`,
    entry.id,
    entry.businessId,
    entry.clientId,
    entry.jobId,
    entry.type,
    entry.amount,
    entry.description,
    entry.entryDate,
    entry.isDraft ? 1 : 0
  );
}

export function deleteEntry(id: string) {
  getDb().runSync('DELETE FROM entries WHERE id = ?', id);
}

export function listReminders(businessId: string): Reminder[] {
  return getDb()
    .getAllSync<Record<string, unknown>>(
      'SELECT * FROM reminders WHERE business_id = ? ORDER BY scheduled_at ASC',
      businessId
    )
    .map((row) => ({
      id: String(row.id),
      businessId: String(row.business_id),
      clientId: row.client_id ? String(row.client_id) : null,
      title: String(row.title),
      body: String(row.body),
      scheduledAt: String(row.scheduled_at),
      notified: Boolean(row.notified),
    }));
}

export function upsertReminder(reminder: Reminder) {
  getDb().runSync(
    `INSERT INTO reminders (id, business_id, client_id, title, body, scheduled_at, notified)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       body = excluded.body,
       scheduled_at = excluded.scheduled_at,
       notified = excluded.notified,
       client_id = excluded.client_id`,
    reminder.id,
    reminder.businessId,
    reminder.clientId,
    reminder.title,
    reminder.body,
    reminder.scheduledAt,
    reminder.notified ? 1 : 0
  );
}

export function deleteReminder(id: string) {
  getDb().runSync('DELETE FROM reminders WHERE id = ?', id);
}

export function listThreads(businessId: string): ChatThread[] {
  return getDb()
    .getAllSync<Record<string, unknown>>(
      'SELECT * FROM chat_threads WHERE business_id = ? ORDER BY last_message_at DESC',
      businessId
    )
    .map((row) => ({
      id: String(row.id),
      businessId: String(row.business_id),
      clientId: String(row.client_id),
      channel: row.channel as ChatThread['channel'],
      lastMessageAt: String(row.last_message_at),
    }));
}

export function upsertThread(thread: ChatThread) {
  getDb().runSync(
    `INSERT INTO chat_threads (id, business_id, client_id, channel, last_message_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET channel = excluded.channel, last_message_at = excluded.last_message_at`,
    thread.id,
    thread.businessId,
    thread.clientId,
    thread.channel,
    thread.lastMessageAt
  );
}

export function listMessages(threadId: string): ChatMessage[] {
  return getDb()
    .getAllSync<Record<string, unknown>>(
      'SELECT * FROM chat_messages WHERE thread_id = ? ORDER BY created_at ASC',
      threadId
    )
    .map((row) => ({
      id: String(row.id),
      threadId: String(row.thread_id),
      direction: row.direction as ChatMessage['direction'],
      body: String(row.body),
      createdAt: String(row.created_at),
      externalId: row.external_id ? String(row.external_id) : null,
    }));
}

export function insertMessage(message: ChatMessage) {
  getDb().runSync(
    `INSERT INTO chat_messages (id, thread_id, direction, body, created_at, external_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    message.id,
    message.threadId,
    message.direction,
    message.body,
    message.createdAt,
    message.externalId
  );
}

export function getMessagingConfig(): MessagingConfig {
  const row = getDb().getFirstSync<{ value: string }>(
    `SELECT value FROM app_meta WHERE key = 'messaging_config'`
  );
  if (!row) return defaultMessagingConfig();
  try {
    return { ...defaultMessagingConfig(), ...JSON.parse(row.value) };
  } catch {
    return defaultMessagingConfig();
  }
}

export function saveMessagingConfig(config: MessagingConfig) {
  getDb().runSync(
    `INSERT INTO app_meta (key, value) VALUES ('messaging_config', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    JSON.stringify(config)
  );
}
