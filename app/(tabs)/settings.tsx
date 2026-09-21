import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { Text, useThemeColor } from '@/components/Themed';
import { BusinessSwitcher } from '@/src/components/BusinessSwitcher';
import { useBusinessBooks } from '@/src/context/BusinessBooksContext';
import { useThemePreference } from '@/src/context/ThemeContext';

export default function SettingsScreen() {
  const {
    businesses,
    activeBusiness,
    addBusiness,
    deleteBusiness,
    updateActiveBusiness,
    clients,
    debts,
    saveDebt,
    deleteDebt,
    messagingConfig,
    saveMessagingConfig,
  } = useBusinessBooks();
  const { theme, toggleTheme } = useThemePreference();
  const screenBackground = useThemeColor({ light: '#f8fafc', dark: '#020817' }, 'background');
  const cardBackground = useThemeColor({ light: '#ffffff', dark: '#111827' }, 'background');
  const cardBorder = useThemeColor({ light: '#dbe2ea', dark: '#334155' }, 'background');
  const inputBackground = useThemeColor({ light: '#ffffff', dark: '#0f172a' }, 'background');
  const inputBorder = useThemeColor({ light: '#cbd5e1', dark: '#475569' }, 'background');
  const inputText = useThemeColor({ light: '#0f172a', dark: '#f8fafc' }, 'text');
  const inputPlaceholder = useThemeColor({ light: '#64748b', dark: '#94a3b8' }, 'text');
  const chipBackground = useThemeColor({ light: '#e2e8f0', dark: '#1f2937' }, 'background');
  const chipActive = useThemeColor({ light: '#bfdbfe', dark: '#2563eb' }, 'background');

  const [newBizName, setNewBizName] = useState('');
  const [newBizCurrency, setNewBizCurrency] = useState('USD');
  const [newBizLocation, setNewBizLocation] = useState('');
  const [newBizEmail, setNewBizEmail] = useState('');
  const [workerNum, setWorkerNum] = useState(String(activeBusiness?.workerPayNumerator ?? 1));
  const [workerDen, setWorkerDen] = useState(String(activeBusiness?.workerPayDenominator ?? 3));
  const [msg, setMsg] = useState(messagingConfig);
  const [debtClientId, setDebtClientId] = useState<string | null>(null);
  const [debtClientName, setDebtClientName] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtPaidAmount, setDebtPaidAmount] = useState('');
  const [debtNote, setDebtNote] = useState('');
  const [debtTemplate, setDebtTemplate] = useState(
    'Hi {{clientName}}, this is a reminder that your outstanding balance is {{balance}}. Please settle it at your earliest convenience.'
  );
  const [editingDebtId, setEditingDebtId] = useState<string | null>(null);

  const fillDebtForm = (debt: (typeof debts)[number]) => {
    setEditingDebtId(debt.id);
    setDebtClientId(debt.clientId ?? null);
    setDebtClientName(debt.clientName);
    setDebtAmount(String(debt.amount));
    setDebtPaidAmount(String(debt.paidAmount));
    setDebtNote(debt.note);
    setDebtTemplate(debt.reminderTemplate || debtTemplate);
  };

  const resetDebtForm = () => {
    setEditingDebtId(null);
    setDebtClientId(null);
    setDebtClientName('');
    setDebtAmount('');
    setDebtPaidAmount('');
    setDebtNote('');
    setDebtTemplate(
      'Hi {{clientName}}, this is a reminder that your outstanding balance is {{balance}}. Please settle it at your earliest convenience.'
    );
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: screenBackground }]}>
      <Text style={styles.title}>Settings</Text>
      <BusinessSwitcher />

      <View style={[styles.card, { backgroundColor: cardBackground, borderColor: cardBorder }]}> 
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <Switch value={theme === 'dark'} onValueChange={() => void toggleTheme()} />
        </View>
        <Text style={styles.hint}>{theme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled'}</Text>
      </View>

      {activeBusiness && businesses.length > 1 && (
        <View style={[styles.card, { backgroundColor: cardBackground, borderColor: cardBorder }]}> 
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Business settings</Text>
          </View>
          <Pressable
            style={styles.deleteBusinessBtn}
            onPress={() => deleteBusiness(activeBusiness.id)}>
            <Text style={styles.deleteBusinessText}>Delete current business profile</Text>
          </Pressable>
        </View>
      )}

      <View style={[styles.card, { backgroundColor: cardBackground, borderColor: cardBorder }]}> 
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Business profile</Text>
        </View>

        {activeBusiness ? (
          <>
            <TextInput
              style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
              placeholder="Organisation name"
              placeholderTextColor={inputPlaceholder}
              value={activeBusiness.name}
              onChangeText={(text) => updateActiveBusiness({ name: text })}
            />
            <TextInput
              style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
              placeholder="Location"
              placeholderTextColor={inputPlaceholder}
              value={activeBusiness.location}
              onChangeText={(text) => updateActiveBusiness({ location: text })}
            />
            <TextInput
              style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
              placeholder="Email address"
              placeholderTextColor={inputPlaceholder}
              value={activeBusiness.email}
              onChangeText={(text) => updateActiveBusiness({ email: text })}
            />
            <TextInput
              style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
              placeholder="Currency code"
              placeholderTextColor={inputPlaceholder}
              value={activeBusiness.currency}
              onChangeText={(text) => updateActiveBusiness({ currency: text.toUpperCase().slice(0, 10) || 'USD' })}
            />
            <TextInput
              style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
              placeholder="Brand colour (#RRGGBB)"
              placeholderTextColor={inputPlaceholder}
              value={activeBusiness.brandColor}
              onChangeText={(text) => updateActiveBusiness({ brandColor: text })}
            />
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
              placeholder="Invoice footer / notes"
              placeholderTextColor={inputPlaceholder}
              multiline
              value={activeBusiness.invoiceFooter}
              onChangeText={(text) => updateActiveBusiness({ invoiceFooter: text })}
            />
          </>
        ) : (
          <>
            <TextInput
              style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
              placeholder="Business name"
              placeholderTextColor={inputPlaceholder}
              value={newBizName}
              onChangeText={setNewBizName}
            />
            <TextInput
              style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
              placeholder="Location"
              placeholderTextColor={inputPlaceholder}
              value={newBizLocation}
              onChangeText={setNewBizLocation}
            />
            <TextInput
              style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
              placeholder="Email address"
              placeholderTextColor={inputPlaceholder}
              value={newBizEmail}
              onChangeText={setNewBizEmail}
            />
            <TextInput
              style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
              placeholder="Currency code"
              placeholderTextColor={inputPlaceholder}
              value={newBizCurrency}
              onChangeText={setNewBizCurrency}
            />
            <Pressable
              style={styles.primaryBtn}
              onPress={() => {
                if (!newBizName.trim()) return;
                addBusiness(newBizName.trim(), newBizCurrency.trim() || 'USD', {
                  location: newBizLocation.trim(),
                  email: newBizEmail.trim(),
                });
                setNewBizName('');
                setNewBizLocation('');
                setNewBizEmail('');
              }}>
              <Text style={styles.primaryBtnText}>Create separate books</Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: cardBackground, borderColor: cardBorder }]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Customer debts</Text>
        </View>

        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
          placeholder="Customer name"
          placeholderTextColor={inputPlaceholder}
          value={debtClientName}
          onChangeText={setDebtClientName}
        />

        <Text style={styles.label}>Linked client</Text>
        <View style={styles.chips}>
          <Pressable
            style={[styles.chip, { backgroundColor: debtClientId === null ? chipActive : chipBackground }]}
            onPress={() => setDebtClientId(null)}>
            <Text>None</Text>
          </Pressable>
          {clients.map((client) => (
            <Pressable
              key={client.id}
              style={[styles.chip, { backgroundColor: debtClientId === client.id ? chipActive : chipBackground }]}
              onPress={() => setDebtClientId(client.id)}>
              <Text>{client.name}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
          placeholder="Debt amount"
          placeholderTextColor={inputPlaceholder}
          keyboardType="decimal-pad"
          value={debtAmount}
          onChangeText={setDebtAmount}
        />
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
          placeholder="Paid so far"
          placeholderTextColor={inputPlaceholder}
          keyboardType="decimal-pad"
          value={debtPaidAmount}
          onChangeText={setDebtPaidAmount}
        />
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
          placeholder="Notes / reason"
          placeholderTextColor={inputPlaceholder}
          value={debtNote}
          onChangeText={setDebtNote}
        />
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
          placeholder="Reminder template"
          placeholderTextColor={inputPlaceholder}
          multiline
          value={debtTemplate}
          onChangeText={setDebtTemplate}
        />

        <View style={styles.rowActions}>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => {
              const name = debtClientName.trim() || clients.find((c) => c.id === debtClientId)?.name || 'Customer';
              saveDebt({
                id: editingDebtId ?? undefined,
                clientId: debtClientId,
                clientName: name,
                amount: Number(debtAmount) || 0,
                paidAmount: Number(debtPaidAmount) || 0,
                note: debtNote,
                reminderTemplate: debtTemplate,
              });
              resetDebtForm();
            }}>
            <Text style={styles.primaryBtnText}>{editingDebtId ? 'Update debt' : 'Add debt'}</Text>
          </Pressable>
          {editingDebtId && (
            <Pressable style={styles.secondaryBtn} onPress={resetDebtForm}>
              <Text>Cancel</Text>
            </Pressable>
          )}
        </View>

        {debts.length === 0 ? (
          <Text style={styles.hint}>No debt entries yet.</Text>
        ) : (
          debts.map((debt) => {
            const remaining = Math.max(debt.amount - debt.paidAmount, 0);
            return (
              <View key={debt.id} style={styles.debtRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.debtTitle}>{debt.clientName}</Text>
                  <Text style={styles.hint}>Balance: {remaining.toFixed(2)} · Paid: {debt.paidAmount.toFixed(2)}</Text>
                  {debt.note ? <Text style={styles.hint}>{debt.note}</Text> : null}
                </View>
                <View style={styles.debtButtons}>
                  <Pressable onPress={() => fillDebtForm(debt)}>
                    <Text style={styles.linkText}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => {
                    saveDebt({
                      id: debt.id,
                      clientId: debt.clientId,
                      clientName: debt.clientName,
                      amount: debt.amount,
                      paidAmount: debt.amount,
                      note: debt.note,
                      reminderTemplate: debt.reminderTemplate,
                    });
                  }}>
                    <Text style={styles.linkText}>Clear</Text>
                  </Pressable>
                  <Pressable onPress={() => deleteDebt(debt.id)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </View>

      {activeBusiness && (
        <View style={[styles.card, { backgroundColor: cardBackground, borderColor: cardBorder }]}> 
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Pay ratios — {activeBusiness.name}</Text>
          </View>
          <Text style={styles.hint}>
            Worker pay as a fraction of daily income (e.g. 1:3 means one third).
          </Text>
          <View style={styles.ratioRow}>
            <TextInput
              style={[styles.input, styles.ratioInput, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
              keyboardType="number-pad"
              placeholderTextColor={inputPlaceholder}
              value={workerNum}
              onChangeText={setWorkerNum}
            />
            <Text>:</Text>
            <TextInput
              style={[styles.input, styles.ratioInput, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
              keyboardType="number-pad"
              placeholderTextColor={inputPlaceholder}
              value={workerDen}
              onChangeText={setWorkerDen}
            />
          </View>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() =>
              updateActiveBusiness({
                workerPayNumerator: parseFloat(workerNum) || 1,
                workerPayDenominator: parseFloat(workerDen) || 3,
              })
            }>
            <Text>Save ratio for this business</Text>
          </Pressable>
        </View>
      )}

      <View style={[styles.card, { backgroundColor: cardBackground, borderColor: cardBorder }]}> 
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Messaging APIs</Text>
        </View>
        <Text style={styles.hint}>
          Store keys here for development. For production, use a backend so secrets are not on the
          phone.
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
          placeholder="Twilio Account SID"
          placeholderTextColor={inputPlaceholder}
          value={msg.twilioAccountSid}
          onChangeText={(v) => setMsg({ ...msg, twilioAccountSid: v, smsProvider: v ? 'twilio' : 'none' })}
        />
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
          placeholder="Twilio Auth Token"
          placeholderTextColor={inputPlaceholder}
          secureTextEntry
          value={msg.twilioAuthToken}
          onChangeText={(v) => setMsg({ ...msg, twilioAuthToken: v })}
        />
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
          placeholder="From number (SMS)"
          placeholderTextColor={inputPlaceholder}
          value={msg.twilioFromNumber}
          onChangeText={(v) => setMsg({ ...msg, twilioFromNumber: v })}
        />
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, borderColor: inputBorder, color: inputText }]}
          placeholder="Meta WhatsApp token"
          placeholderTextColor={inputPlaceholder}
          secureTextEntry
          value={msg.metaWhatsappToken}
          onChangeText={(v) =>
            setMsg({ ...msg, metaWhatsappToken: v, whatsappProvider: v ? 'meta' : msg.whatsappProvider })
          }
        />
        <Pressable style={styles.primaryBtn} onPress={() => saveMessagingConfig(msg)}>
          <Text style={styles.primaryBtnText}>Save messaging config</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: { fontWeight: '600' },
  hint: { fontSize: 13, opacity: 0.65, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  ratioRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  ratioInput: { flex: 1, marginBottom: 0 },
  label: { fontWeight: '600', marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#bfdbfe' },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  rowActions: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  debtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#cbd5e1',
  },
  debtTitle: { fontWeight: '700', marginBottom: 2 },
  debtButtons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  linkText: { color: '#2563eb', fontWeight: '600' },
  deleteText: { color: '#dc2626', fontWeight: '600' },
  deleteBusinessBtn: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  deleteBusinessText: { color: '#991b1b', fontWeight: '700' },
  primaryBtn: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  secondaryBtn: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
  },
});
