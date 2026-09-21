import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Text, useThemeColor } from '@/components/Themed';
import { BusinessSwitcher } from '@/src/components/BusinessSwitcher';
import { useBusinessBooks } from '@/src/context/BusinessBooksContext';
import type { Invoice, InvoiceLineItem } from '@/src/types/models';

const defaultLineItem = (): InvoiceLineItem => ({
  id: `${Date.now()}-${Math.random()}`,
  description: '',
  quantity: 1,
  rate: 0,
});

export default function InvoicesScreen() {
  const { activeBusiness, clients, invoices, saveInvoice, deleteInvoice, sendInvoice } = useBusinessBooks();
  const screenBackground = useThemeColor({ light: '#f8fafc', dark: '#020817' }, 'background');
  const cardBackground = useThemeColor({ light: '#ffffff', dark: '#111827' }, 'background');
  const cardBorder = useThemeColor({ light: '#dbe2ea', dark: '#334155' }, 'background');
  const inputBackground = useThemeColor({ light: '#ffffff', dark: '#0f172a' }, 'background');
  const inputBorder = useThemeColor({ light: '#cbd5e1', dark: '#475569' }, 'background');
  const inputText = useThemeColor({ light: '#0f172a', dark: '#f8fafc' }, 'text');
  const inputPlaceholder = useThemeColor({ light: '#64748b', dark: '#94a3b8' }, 'text');

  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('INV-1001');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10));
  const [taxRate, setTaxRate] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('Thank you for your business.');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { id: 'item-1', description: 'Service', quantity: 1, rate: 0 },
  ]);
  const brandColor = activeBusiness?.brandColor || '#2563eb';

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0),
    [lineItems]
  );

  const total = useMemo(
    () => Math.max(subtotal - Number(discount || 0) + (subtotal - Number(discount || 0)) * (Number(taxRate || 0) / 100), 0),
    [subtotal, discount, taxRate]
  );

  const saveCurrentInvoice = () => {
    if (!activeBusiness) return;
    const name = clientName.trim() || clients.find((c) => c.id === clientId)?.name || 'Customer';
    const nextInvoice: Omit<Invoice, 'id' | 'businessId' | 'createdAt' | 'updatedAt'> & { id?: string } = {
      id: undefined,
      clientId,
      clientName: name,
      invoiceNumber: invoiceNumber.trim() || `INV-${Date.now()}`,
      issueDate,
      dueDate,
      status: 'draft',
      subtotal,
      taxRate: Number(taxRate || 0),
      discount: Number(discount || 0),
      notes,
      lineItems,
    };

    saveInvoice(nextInvoice);
    setClientId(null);
    setClientName('');
    setInvoiceNumber(`INV-${Date.now()}`);
    setIssueDate(new Date().toISOString().slice(0, 10));
    setDueDate(new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10));
    setTaxRate('0');
    setDiscount('0');
    setNotes('Thank you for your business.');
    setLineItems([defaultLineItem()]);
  };

  const downloadInvoice = async (invoice: Invoice) => {
    if (!activeBusiness) return;

    const lines = invoice.lineItems
      .map((item) => {
        const itemTotal = item.quantity * item.rate;
        return `
          <tr>
            <td>${item.description || 'Item'}</td>
            <td>${item.quantity}</td>
            <td>${item.rate.toFixed(2)}</td>
            <td>${itemTotal.toFixed(2)}</td>
          </tr>
        `;
      })
      .join('');

    const totalValue = Math.max(
      invoice.subtotal - invoice.discount + (invoice.subtotal - invoice.discount) * (invoice.taxRate / 100),
      0
    );

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>${invoice.invoiceNumber}</title>
        </head>
        <body style="font-family: Arial, sans-serif; color: #0f172a; margin: 32px;">
          <div style="border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
            <div style="background: ${activeBusiness.brandColor}; color: white; padding: 24px 28px;">
              <h1 style="margin: 0; font-size: 28px;">${activeBusiness.name || 'Business'}</h1>
              <div style="margin-top: 10px;">${activeBusiness.location || 'Location not set'}</div>
              <div>${activeBusiness.email || 'Email not set'}</div>
            </div>
            <div style="padding: 28px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 18px;">
                <div>
                  <div style="font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #64748b;">Invoice</div>
                  <div style="font-size: 26px; font-weight: 700; margin-top: 6px;">${invoice.invoiceNumber}</div>
                </div>
                <div style="text-align: right; color: #334155;">
                  <div><strong>Issue:</strong> ${invoice.issueDate}</div>
                  <div><strong>Due:</strong> ${invoice.dueDate}</div>
                  <div><strong>Customer:</strong> ${invoice.clientName}</div>
                </div>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                  <tr style="background: #f8fafc;">
                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0;">Item</th>
                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0;">Qty</th>
                    <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0;">Rate</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">Total</th>
                  </tr>
                </thead>
                <tbody>${lines}</tbody>
              </table>

              <div style="margin-top: 22px; margin-left: auto; width: 240px;">
                <div style="display: flex; justify-content: space-between; padding: 8px 0;"><span>Subtotal</span><span>${invoice.subtotal.toFixed(2)}</span></div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0;"><span>Discount</span><span>${invoice.discount.toFixed(2)}</span></div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 1px solid #e2e8f0; font-weight: 700; font-size: 18px;"><span>Total</span><span>${totalValue.toFixed(2)}</span></div>
              </div>

              ${invoice.notes ? `<div style="margin-top: 24px; color: #475569;">${invoice.notes}</div>` : ''}
              ${activeBusiness.invoiceFooter ? `<div style="margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 18px; color: #475569;">${activeBusiness.invoiceFooter}</div>` : ''}
            </div>
          </div>
        </body>
      </html>
    `;

    const fileName = `invoice-${invoice.invoiceNumber.replace(/\s+/g, '-').toLowerCase()}.html`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, html, { encoding: FileSystem.EncodingType.UTF8 });

    if (Platform.OS === 'web') {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
      return;
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/html',
      dialogTitle: `Download ${invoice.invoiceNumber}`,
    });
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: screenBackground }]}>
      <Text style={styles.title}>Invoices</Text>
      <BusinessSwitcher />

      <View style={[styles.card, { backgroundColor: cardBackground, borderColor: cardBorder }]}>
        <View style={[styles.brandHeader, { backgroundColor: brandColor }]}>
          <Text style={styles.brandTitle}>{activeBusiness?.name || 'Your business'}</Text>
          <Text style={styles.brandMeta}>{activeBusiness?.location || 'Add your location in Settings'}</Text>
          <Text style={styles.brandMeta}>{activeBusiness?.email || 'Add your email in Settings'}</Text>
        </View>

        <Text style={styles.sectionTitle}>Create invoice</Text>

        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
          placeholder="Customer name"
          placeholderTextColor={inputPlaceholder}
          value={clientName}
          onChangeText={setClientName}
        />

        <Text style={styles.label}>Link client</Text>
        <View style={styles.chips}>
          <Pressable
            style={[styles.chip, clientId === null && styles.chipActive]}
            onPress={() => setClientId(null)}>
            <Text>Custom</Text>
          </Pressable>
          {clients.map((client) => (
            <Pressable
              key={client.id}
              style={[styles.chip, clientId === client.id && styles.chipActive]}
              onPress={() => setClientId(client.id)}>
              <Text>{client.name}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
          placeholder="Invoice number"
          placeholderTextColor={inputPlaceholder}
          value={invoiceNumber}
          onChangeText={setInvoiceNumber}
        />
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
          placeholder="Issue date"
          placeholderTextColor={inputPlaceholder}
          value={issueDate}
          onChangeText={setIssueDate}
        />
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
          placeholder="Due date"
          placeholderTextColor={inputPlaceholder}
          value={dueDate}
          onChangeText={setDueDate}
        />

        {lineItems.map((item, index) => (
          <View key={item.id} style={styles.lineItemRow}>
            <TextInput
              style={[styles.input, styles.flex1, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
              placeholder="Item"
              placeholderTextColor={inputPlaceholder}
              value={item.description}
              onChangeText={(text) => {
                const next = [...lineItems];
                next[index] = { ...item, description: text };
                setLineItems(next);
              }}
            />
            <TextInput
              style={[styles.input, styles.smallInput, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
              placeholder="Qty"
              placeholderTextColor={inputPlaceholder}
              keyboardType="numeric"
              value={String(item.quantity)}
              onChangeText={(text) => {
                const next = [...lineItems];
                next[index] = { ...item, quantity: Number(text) || 0 };
                setLineItems(next);
              }}
            />
            <TextInput
              style={[styles.input, styles.smallInput, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
              placeholder="Rate"
              placeholderTextColor={inputPlaceholder}
              keyboardType="decimal-pad"
              value={String(item.rate)}
              onChangeText={(text) => {
                const next = [...lineItems];
                next[index] = { ...item, rate: Number(text) || 0 };
                setLineItems(next);
              }}
            />
          </View>
        ))}

        <Pressable
          style={styles.secondaryBtn}
          onPress={() => setLineItems((current) => [...current, defaultLineItem()])}>
          <Text>Add line item</Text>
        </Pressable>

        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
          placeholder="Tax %"
          placeholderTextColor={inputPlaceholder}
          keyboardType="decimal-pad"
          value={taxRate}
          onChangeText={setTaxRate}
        />
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
          placeholder="Discount"
          placeholderTextColor={inputPlaceholder}
          keyboardType="decimal-pad"
          value={discount}
          onChangeText={setDiscount}
        />
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
          placeholder="Notes"
          placeholderTextColor={inputPlaceholder}
          multiline
          value={notes}
          onChangeText={setNotes}
        />

        <View style={styles.summaryRow}>
          <Text>Subtotal:</Text>
          <Text>{subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>Discount:</Text>
          <Text>{Number(discount || 0).toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>Total:</Text>
          <Text style={styles.total}>{total.toFixed(2)}</Text>
        </View>

        <Pressable style={styles.primaryBtn} onPress={saveCurrentInvoice}>
          <Text style={styles.primaryBtnText}>Save invoice</Text>
        </Pressable>
      </View>

      {invoices.length === 0 ? (
        <Text style={styles.hint}>No invoices yet.</Text>
      ) : (
        invoices.map((invoice) => {
          const totalValue = Math.max(
            invoice.subtotal - invoice.discount + (invoice.subtotal - invoice.discount) * (invoice.taxRate / 100),
            0
          );
          return (
            <View key={invoice.id} style={[styles.invoiceRow, { backgroundColor: cardBackground, borderColor: cardBorder }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{invoice.invoiceNumber}</Text>
                <Text style={styles.hint}>{invoice.clientName} · Due {invoice.dueDate}</Text>
                <Text style={styles.hint}>Status: {invoice.status}</Text>
                <Text style={styles.hint}>Total: {totalValue.toFixed(2)}</Text>
              </View>
              <View style={styles.actionRow}>
                <Pressable onPress={() => sendInvoice(invoice.id, 'sms')}>
                  <Text style={styles.linkText}>Send SMS</Text>
                </Pressable>
                <Pressable onPress={() => sendInvoice(invoice.id, 'whatsapp')}>
                  <Text style={styles.linkText}>WhatsApp</Text>
                </Pressable>
                <Pressable onPress={() => void downloadInvoice(invoice)}>
                  <Text style={styles.linkText}>Download</Text>
                </Pressable>
                <Pressable onPress={() => deleteInvoice(invoice.id)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  brandHeader: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  brandTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  brandMeta: { color: '#e2e8f0', fontSize: 12, marginTop: 4 },
  sectionTitle: { fontWeight: '600', marginBottom: 8 },
  label: { fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#bfdbfe' },
  lineItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex1: { flex: 1 },
  smallInput: { width: 70 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  primaryBtn: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  secondaryBtn: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceRow: {
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  rowTitle: { fontWeight: '700', marginBottom: 4 },
  hint: { fontSize: 13, opacity: 0.65 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  linkText: { color: '#2563eb', fontWeight: '600' },
  deleteText: { color: '#dc2626', fontWeight: '600' },
  total: { fontWeight: '700' },
});
