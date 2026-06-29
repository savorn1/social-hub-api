export interface FacebookWebhookEntry {
  id: string;
  time: number;
  messaging: FacebookMessagingEvent[];
}

export interface FacebookMessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: { mid: string; text?: string; attachments?: unknown[] };
  postback?: { title: string; payload: string };
}

export interface FacebookWebhookPayload {
  object: string;
  entry: FacebookWebhookEntry[];
}
