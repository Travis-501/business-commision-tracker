import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/Themed';
import { BusinessSwitcher } from '@/src/components/BusinessSwitcher';
import { useBusinessBooks } from '@/src/context/BusinessBooksContext';

export default function SettingsScreen() {
  const {
    activeBusiness,
    addBusiness,
    updateActiveBusiness,
    messagingConfig,
    saveMessagingConfig,
  } = useBusinessBooks();

  const [newBizName, setNewBizName] = useState('');
  const [newBizCurrency, setNewBizCurrency] = useState('USD');
  const [workerNum, setWorkerNum] = useState(String(activeBusiness?.workerPayNumerator ?? 1));
  const [workerDen, setWorkerDen] = useState(String(activeBusiness?.workerPayDenominator ?? 3));
  const [msg, setMsg] = useState(messagingConfig);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <BusinessSwitcher />

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Add business</Text>
        <TextInput
          style={styles.input}
          placeholder="Business name"
          value={newBizName}
          onChangeText={setNewBizName}
        />
        <TextInput
          style={styles.input}
          placeholder="Currency code"
          value={newBizCurrency}
          onChangeText={setNewBizCurrency}
        />
        <Pressable
          style={styles.primaryBtn}
          onPress={() => {
            if (!newBizName.trim()) return;
            addBusiness(newBizName.trim(), newBizCurrency.trim() || 'USD');
            setNewBizName('');
          }}>
          <Text style={styles.primaryBtnText}>Create separate books</Text>
        </Pressable>
      </View>

      {activeBusiness && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pay ratios — {activeBusiness.name}</Text>
          <Text style={styles.hint}>
            Worker pay as a fraction of daily income (e.g. 1:3 means one third).
          </Text>
          <View style={styles.ratioRow}>
            <TextInput
              style={[styles.input, styles.ratioInput]}
              keyboardType="number-pad"
              value={workerNum}
              onChangeText={setWorkerNum}
            />
            <Text>:</Text>
            <TextInput
              style={[styles.input, styles.ratioInput]}
              keyboardType="number-pad"
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

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Messaging APIs</Text>
        <Text style={styles.hint}>
          Store keys here for development. For production, use a backend so secrets are not on the
          phone.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Twilio Account SID"
          value={msg.twilioAccountSid}
          onChangeText={(v) => setMsg({ ...msg, twilioAccountSid: v, smsProvider: v ? 'twilio' : 'none' })}
        />
        <TextInput
          style={styles.input}
          placeholder="Twilio Auth Token"
          secureTextEntry
          value={msg.twilioAuthToken}
          onChangeText={(v) => setMsg({ ...msg, twilioAuthToken: v })}
        />
        <TextInput
          style={styles.input}
          placeholder="From number (SMS)"
          value={msg.twilioFromNumber}
          onChangeText={(v) => setMsg({ ...msg, twilioFromNumber: v })}
        />
        <TextInput
          style={styles.input}
          placeholder="Meta WhatsApp token"
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
    borderColor: '#cbd5e1',
    marginBottom: 16,
  },
  sectionTitle: { fontWeight: '600', marginBottom: 8 },
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
