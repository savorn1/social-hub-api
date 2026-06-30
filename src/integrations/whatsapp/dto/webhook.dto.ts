export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: { phone_number_id: string; display_phone_number: string };
        contacts?: Array<{ profile: { name: string }; wa_id: string }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          image?: { id: string; mime_type: string; caption?: string };
          document?: {
            id: string;
            mime_type: string;
            filename?: string;
            caption?: string;
          };
          audio?: { id: string; mime_type: string };
          video?: { id: string; mime_type: string; caption?: string };
        }>;
      };
      field: string;
    }>;
  }>;
}
