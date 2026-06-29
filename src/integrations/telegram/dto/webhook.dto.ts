export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  chat: { id: number; type: string };
  date: number;
  text?: string;
  photo?: unknown[];
  document?: unknown;
}

export interface TelegramCallbackQuery {
  id: string;
  from: { id: number; first_name: string };
  data?: string;
}
