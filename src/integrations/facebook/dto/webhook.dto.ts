export interface FacebookFeedChangeValue {
  item: string;
  verb: string;
  comment_id?: string;
  post_id?: string;
  parent_id?: string;
  message?: string;
  from?: { id: string; name: string };
  created_time?: number;
}

export interface FacebookFeedChange {
  field: string;
  value: FacebookFeedChangeValue;
}

export interface FacebookMessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: { mid: string; text?: string; attachments?: unknown[] };
  postback?: { title: string; payload: string };
}

export interface FacebookWebhookEntry {
  id: string;
  time: number;
  messaging?: FacebookMessagingEvent[];
  changes?: FacebookFeedChange[];
}

export interface FacebookWebhookPayload {
  object: string;
  entry: FacebookWebhookEntry[];
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}
