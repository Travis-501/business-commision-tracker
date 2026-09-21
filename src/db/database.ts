import * as SQLite from 'expo-sqlite';

import { newId } from '@/src/lib/id';
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
      location TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      brand_color TEXT NOT NULL DEFAULT '#2563eb',
      invoice_footer TEXT NOT NULL DEFAULT '',
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
      client_reference TEXT NOT NULL DEFAULT '',
      job_id TEXT NOT NULL,
      job_type TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      spent_money REAL NOT NULL DEFAULT 0,
      description TEXT NOT NULL,
      entry_date TEXT NOT NULL,
      is_draft INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS debts (
      id TEXT PRIMARY KEY NOT NULL,
      business_id TEXT NOT NULL,
      client_id TEXT,
      client_name TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      paid_amount REAL NOT NULL DEFAULT 0,
      note TEXT NOT NULL DEFAULT '',
      reminder_template TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
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

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY NOT NULL,
      business_id TEXT NOT NULL,
      client_id TEXT,
      client_name TEXT NOT NULL,
      invoice_number TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      subtotal REAL NOT NULL DEFAULT 0,
      tax_rate REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      line_items_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  ensureEntryColumns(database);
  ensureDebtColumns(database);
  ensureInvoiceColumns(database);
  ensureBusinessProfileColumns(database);

  const count = database.getFirstSync<{ c: number }>('SELECT COUNT(*) as c FROM businesses');
  if (count && count.c === 0) {
    seedDemoBusiness(database);
  }
}

function ensureEntryColumns(database: SQLite.SQLiteDatabase) {
  const rows = database.getAllSync<{ name: string }>("PRAGMA table_info('entries')");
  const existing = new Set(rows.map((row) => row.name));

  if (!existing.has('client_reference')) {
    database.execSync("ALTER TABLE entries ADD COLUMN client_reference TEXT NOT NULL DEFAULT '';");
  }
  if (!existing.has('job_type')) {
    database.execSync("ALTER TABLE entries ADD COLUMN job_type TEXT NOT NULL DEFAULT '';");
  }
  if (!existing.has('spent_money')) {
    database.execSync('ALTER TABLE entries ADD COLUMN spent_money REAL NOT NULL DEFAULT 0;');
  }
  if (!existing.has('invoice_id')) {
    database.execSync('ALTER TABLE entries ADD COLUMN invoice_id TEXT;');
  }
  if (!existing.has('invoice_number')) {
    database.execSync("ALTER TABLE entries ADD COLUMN invoice_number TEXT NOT NULL DEFAULT ''; ");
  }
}

function ensureDebtColumns(database: SQLite.SQLiteDatabase) {
  const rows = database.getAllSync<{ name: string }>("PRAGMA table_info('debts')");
  const existing = new Set(rows.map((row) => row.name));

  if (!existing.has('client_name')) {
    database.execSync("ALTER TABLE debts ADD COLUMN client_name TEXT NOT NULL DEFAULT '';");
  }
  if (!existing.has('amount')) {
    database.execSync('ALTER TABLE debts ADD COLUMN amount REAL NOT NULL DEFAULT 0;');
  }
  if (!existing.has('paid_amount')) {
    database.execSync('ALTER TABLE debts ADD COLUMN paid_amount REAL NOT NULL DEFAULT 0;');
  }
  if (!existing.has('note')) {
    database.execSync("ALTER TABLE debts ADD COLUMN note TEXT NOT NULL DEFAULT '';");
  }
  if (!existing.has('reminder_template')) {
    database.execSync("ALTER TABLE debts ADD COLUMN reminder_template TEXT NOT NULL DEFAULT '';");
  }
  if (!existing.has('created_at')) {
    database.execSync("ALTER TABLE debts ADD COLUMN created_at TEXT NOT NULL DEFAULT '';");
  }
  if (!existing.has('updated_at')) {
    database.execSync("ALTER TABLE debts ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';");
  }
}

function ensureBusinessProfileColumns(database: SQLite.SQLiteDatabase) {
  const rows = database.getAllSync<{ name: string }>("PRAGMA table_info('businesses')");
  const existing = new Set(rows.map((row) => row.name));

  if (!existing.has('location')) {
    database.execSync("ALTER TABLE businesses ADD COLUMN location TEXT NOT NULL DEFAULT ''; ");
  }
  if (!existing.has('email')) {
    database.execSync("ALTER TABLE businesses ADD COLUMN email TEXT NOT NULL DEFAULT ''; ");
  }
  if (!existing.has('brand_color')) {
    database.execSync("ALTER TABLE businesses ADD COLUMN brand_color TEXT NOT NULL DEFAULT '#2563eb'; ");
  }
  if (!existing.has('invoice_footer')) {
    database.execSync("ALTER TABLE businesses ADD COLUMN invoice_footer TEXT NOT NULL DEFAULT ''; ");
  }
}

function ensureInvoiceColumns(database: SQLite.SQLiteDatabase) {
  const rows = database.getAllSync<{ name: string }>("PRAGMA table_info('invoices')");
  const existing = new Set(rows.map((row) => row.name));

  if (!existing.has('client_id')) {
    database.execSync('ALTER TABLE invoices ADD COLUMN client_id TEXT;');
  }
  if (!existing.has('client_name')) {
    database.execSync("ALTER TABLE invoices ADD COLUMN client_name TEXT NOT NULL DEFAULT ''; ");
  }
  if (!existing.has('invoice_number')) {
    database.execSync("ALTER TABLE invoices ADD COLUMN invoice_number TEXT NOT NULL DEFAULT ''; ");
  }
  if (!existing.has('issue_date')) {
    database.execSync("ALTER TABLE invoices ADD COLUMN issue_date TEXT NOT NULL DEFAULT ''; ");
  }
  if (!existing.has('due_date')) {
    database.execSync("ALTER TABLE invoices ADD COLUMN due_date TEXT NOT NULL DEFAULT ''; ");
  }
  if (!existing.has('status')) {
    database.execSync("ALTER TABLE invoices ADD COLUMN status TEXT NOT NULL DEFAULT 'draft';");
  }
  if (!existing.has('subtotal')) {
    database.execSync('ALTER TABLE invoices ADD COLUMN subtotal REAL NOT NULL DEFAULT 0;');
  }
  if (!existing.has('tax_rate')) {
    database.execSync('ALTER TABLE invoices ADD COLUMN tax_rate REAL NOT NULL DEFAULT 0;');
  }
  if (!existing.has('discount')) {
    database.execSync('ALTER TABLE invoices ADD COLUMN discount REAL NOT NULL DEFAULT 0;');
  }
  if (!existing.has('notes')) {
    database.execSync("ALTER TABLE invoices ADD COLUMN notes TEXT NOT NULL DEFAULT ''; ");
  }
  if (!existing.has('line_items_json')) {
    database.execSync("ALTER TABLE invoices ADD COLUMN line_items_json TEXT NOT NULL DEFAULT '[]';");
  }
  if (!existing.has('created_at')) {
    database.execSync("ALTER TABLE invoices ADD COLUMN created_at TEXT NOT NULL DEFAULT ''; ");
  }
  if (!existing.has('updated_at')) {
    database.execSync("ALTER TABLE invoices ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''; ");
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
    location: String(row.location ?? ''),
    email: String(row.email ?? ''),
    brandColor: String(row.brand_color ?? '#2563eb'),
    invoiceFooter: String(row.invoice_footer ?? ''),
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
    `INSERT INTO businesses (id, name, currency, location, email, brand_color, invoice_footer, worker_pay_numerator, worker_pay_denominator, custom_ratios_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    business.id,
    business.name,
    business.currency,
    business.location,
    business.email,
    business.brandColor,
    business.invoiceFooter,
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
    `UPDATE businesses SET name = ?, currency = ?, location = ?, email = ?, brand_color = ?, invoice_footer = ?, worker_pay_numerator = ?, worker_pay_denominator = ?, custom_ratios_json = ?
     WHERE id = ?`,
    business.name,
    business.currency,
    business.location,
    business.email,
    business.brandColor,
    business.invoiceFooter,
    business.workerPayNumerator,
    business.workerPayDenominator,
    JSON.stringify(business.customRatios),
    business.id
  );
}

export function deleteBusiness(id: string) {
  const database = getDb();

  database.runSync(
    'DELETE FROM chat_messages WHERE thread_id IN (SELECT id FROM chat_threads WHERE business_id = ?)',
    id
  );
  database.runSync('DELETE FROM chat_threads WHERE business_id = ?', id);
  database.runSync('DELETE FROM reminders WHERE business_id = ?', id);
  database.runSync('DELETE FROM invoices WHERE business_id = ?', id);
  database.runSync('DELETE FROM debts WHERE business_id = ?', id);
  database.runSync('DELETE FROM entries WHERE business_id = ?', id);
  database.runSync('DELETE FROM clients WHERE business_id = ?', id);
  database.runSync('DELETE FROM businesses WHERE id = ?', id);

  const remaining = listBusinesses();
  if (remaining.length === 0) {
    database.runSync("DELETE FROM app_meta WHERE key = 'active_business_id'");
    return;
  }

  const currentId = getActiveBusinessId();
  if (!currentId || currentId === id) {
    setActiveBusinessId(remaining[0].id);
  }
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

export function listDebts(businessId: string): Debt[] {
  return getDb()
    .getAllSync<Record<string, unknown>>(
      'SELECT * FROM debts WHERE business_id = ? ORDER BY updated_at DESC',
      businessId
    )
    .map((row) => ({
      id: String(row.id),
      businessId: String(row.business_id),
      clientId: row.client_id ? String(row.client_id) : null,
      clientName: String(row.client_name ?? ''),
      amount: Number(row.amount ?? 0),
      paidAmount: Number(row.paid_amount ?? 0),
      note: String(row.note ?? ''),
      reminderTemplate: String(row.reminder_template ?? ''),
      createdAt: String(row.created_at ?? ''),
      updatedAt: String(row.updated_at ?? ''),
    }));
}

export function getDebt(id: string): Debt | null {
  const row = getDb().getFirstSync<Record<string, unknown>>('SELECT * FROM debts WHERE id = ?', id);
  if (!row) return null;
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    clientId: row.client_id ? String(row.client_id) : null,
    clientName: String(row.client_name ?? ''),
    amount: Number(row.amount ?? 0),
    paidAmount: Number(row.paid_amount ?? 0),
    note: String(row.note ?? ''),
    reminderTemplate: String(row.reminder_template ?? ''),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

export function upsertDebt(debt: Debt) {
  getDb().runSync(
    `INSERT INTO debts (id, business_id, client_id, client_name, amount, paid_amount, note, reminder_template, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       client_id = excluded.client_id,
       client_name = excluded.client_name,
       amount = excluded.amount,
       paid_amount = excluded.paid_amount,
       note = excluded.note,
       reminder_template = excluded.reminder_template,
       updated_at = excluded.updated_at`,
    debt.id,
    debt.businessId,
    debt.clientId,
    debt.clientName,
    debt.amount,
    debt.paidAmount,
    debt.note,
    debt.reminderTemplate,
    debt.createdAt,
    debt.updatedAt
  );
}

export function deleteDebt(id: string) {
  getDb().runSync('DELETE FROM debts WHERE id = ?', id);
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
    clientReference: String(row.client_reference ?? ''),
    jobId: String(row.job_id),
    jobType: String(row.job_type ?? ''),
    type: row.type as LedgerEntry['type'],
    amount: Number(row.amount),
    spentMoney: Number(row.spent_money ?? 0),
    description: String(row.description),
    entryDate: String(row.entry_date),
    invoiceId: row.invoice_id ? String(row.invoice_id) : null,
    invoiceNumber: String(row.invoice_number ?? ''),
    isDraft: Boolean(row.is_draft),
  };
}

export function upsertEntry(entry: LedgerEntry) {
  getDb().runSync(
    `INSERT INTO entries (id, business_id, client_id, client_reference, job_id, job_type, type, amount, spent_money, description, entry_date, invoice_id, invoice_number, is_draft)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       client_id = excluded.client_id,
       client_reference = excluded.client_reference,
       job_id = excluded.job_id,
       job_type = excluded.job_type,
       type = excluded.type,
       amount = excluded.amount,
       spent_money = excluded.spent_money,
       description = excluded.description,
       entry_date = excluded.entry_date,
       invoice_id = excluded.invoice_id,
       invoice_number = excluded.invoice_number,
       is_draft = excluded.is_draft`,
    entry.id,
    entry.businessId,
    entry.clientId,
    entry.clientReference,
    entry.jobId,
    entry.jobType,
    entry.type,
    entry.amount,
    entry.spentMoney,
    entry.description,
    entry.entryDate,
    entry.invoiceId,
    entry.invoiceNumber,
    entry.isDraft ? 1 : 0
  );
}

export function deleteEntry(id: string) {
  getDb().runSync('DELETE FROM entries WHERE id = ?', id);
}

export function listInvoices(businessId: string): Invoice[] {
  return getDb()
    .getAllSync<Record<string, unknown>>(
      'SELECT * FROM invoices WHERE business_id = ? ORDER BY updated_at DESC',
      businessId
    )
    .map((row) => ({
      id: String(row.id),
      businessId: String(row.business_id),
      clientId: row.client_id ? String(row.client_id) : null,
      clientName: String(row.client_name ?? ''),
      invoiceNumber: String(row.invoice_number ?? ''),
      issueDate: String(row.issue_date ?? ''),
      dueDate: String(row.due_date ?? ''),
      status: (row.status as Invoice['status']) ?? 'draft',
      subtotal: Number(row.subtotal ?? 0),
      taxRate: Number(row.tax_rate ?? 0),
      discount: Number(row.discount ?? 0),
      notes: String(row.notes ?? ''),
      lineItems: (() => {
        try {
          return JSON.parse(String(row.line_items_json ?? '[]')) as Invoice['lineItems'];
        } catch {
          return [] as Invoice['lineItems'];
        }
      })(),
      createdAt: String(row.created_at ?? ''),
      updatedAt: String(row.updated_at ?? ''),
    }));
}

export function getInvoice(id: string): Invoice | null {
  const row = getDb().getFirstSync<Record<string, unknown>>('SELECT * FROM invoices WHERE id = ?', id);
  if (!row) return null;
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    clientId: row.client_id ? String(row.client_id) : null,
    clientName: String(row.client_name ?? ''),
    invoiceNumber: String(row.invoice_number ?? ''),
    issueDate: String(row.issue_date ?? ''),
    dueDate: String(row.due_date ?? ''),
    status: (row.status as Invoice['status']) ?? 'draft',
    subtotal: Number(row.subtotal ?? 0),
    taxRate: Number(row.tax_rate ?? 0),
    discount: Number(row.discount ?? 0),
    notes: String(row.notes ?? ''),
    lineItems: (() => {
      try {
        return JSON.parse(String(row.line_items_json ?? '[]')) as Invoice['lineItems'];
      } catch {
        return [] as Invoice['lineItems'];
      }
    })(),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

export function upsertInvoice(invoice: Invoice) {
  getDb().runSync(
    `INSERT INTO invoices (id, business_id, client_id, client_name, invoice_number, issue_date, due_date, status, subtotal, tax_rate, discount, notes, line_items_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       client_id = excluded.client_id,
       client_name = excluded.client_name,
       invoice_number = excluded.invoice_number,
       issue_date = excluded.issue_date,
       due_date = excluded.due_date,
       status = excluded.status,
       subtotal = excluded.subtotal,
       tax_rate = excluded.tax_rate,
       discount = excluded.discount,
       notes = excluded.notes,
       line_items_json = excluded.line_items_json,
       updated_at = excluded.updated_at`,
    invoice.id,
    invoice.businessId,
    invoice.clientId,
    invoice.clientName,
    invoice.invoiceNumber,
    invoice.issueDate,
    invoice.dueDate,
    invoice.status,
    invoice.subtotal,
    invoice.taxRate,
    invoice.discount,
    invoice.notes,
    JSON.stringify(invoice.lineItems),
    invoice.createdAt,
    invoice.updatedAt
  );
}

export function deleteInvoice(id: string) {
  getDb().runSync('DELETE FROM invoices WHERE id = ?', id);
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
