import type { ChatChannel, MessagingConfig } from '@/src/types/models';

export type SendResult =
  | { ok: true; externalId: string }
  | { ok: false; error: string; queuedLocally: boolean };

/**
 * Outbound SMS/WhatsApp requires a backend or provider credentials.
 * This module validates config and returns clear errors until wired up.
 */
export async function sendExternalMessage(
  config: MessagingConfig,
  channel: ChatChannel,
  toPhone: string,
  body: string
): Promise<SendResult> {
  if (channel === 'internal') {
    return { ok: false, error: 'Internal channel does not use external APIs', queuedLocally: true };
  }

  if (channel === 'sms') {
    if (config.smsProvider !== 'twilio' || !config.twilioAccountSid || !config.twilioAuthToken) {
      return {
        ok: false,
        error: 'Configure Twilio in Settings to send SMS',
        queuedLocally: true,
      };
    }
    // Hook: POST to your server or Twilio REST API from a secure backend.
    return {
      ok: false,
      error: 'SMS API stub — add a small backend proxy with your Twilio keys',
      queuedLocally: true,
    };
  }

  if (config.whatsappProvider === 'none') {
    return {
      ok: false,
      error: 'Configure WhatsApp (Twilio or Meta) in Settings',
      queuedLocally: true,
    };
  }

  void toPhone;
  void body;
  return {
    ok: false,
    error: 'WhatsApp API stub — connect Meta Cloud API or Twilio WhatsApp',
    queuedLocally: true,
  };
}
