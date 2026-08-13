export type LeadStatus = "NEW" | "REVIEWED" | "CONTACTED" | "DISMISSED";
export type FollowUpFilter = "TODAY" | "OVERDUE";
export type LeadFilter = LeadStatus | FollowUpFilter | "ALL";

export type LeadSearchFilters = {
  search: string;
  chat: string;
  keyword: string;
  dateFrom: string;
  dateTo: string;
};

export type Chat = {
  id: string;
  identifier: string;
  title: string | null;
  active: boolean;
};

export type KeywordRule = {
  id: string;
  phrase: string;
  type: "INCLUDE" | "EXCLUDE";
  active: boolean;
};

export type Settings = {
  chats: Chat[];
  keywordRules: KeywordRule[];
};

export type TelegramStatus = {
  enabled: boolean;
  listening: boolean;
  connected: boolean;
  reconnecting: boolean;
  reconnectAttempt: number;
  lastError: string | null;
  lastErrorAt: string | null;
  lastProcessedMessageAt: string | null;
};

export type Lead = {
  id: string;
  matchedKeywords: string[];
  status: LeadStatus;
  note: string | null;
  followUpAt: string | null;
  createdAt: string;
  message: {
    text: string;
    link: string | null;
    senderUsername: string | null;
    senderId: string | null;
    publishedAt: string;
    channel: {
      title: string;
      username: string | null;
      telegramId: string;
    };
  };
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type LeadsResponse = {
  leads: Lead[];
  counts: Record<LeadStatus, number>;
  followUp: Record<"today" | "overdue", number>;
  pagination: Pagination;
};

export const initialSettings: Settings = {
  chats: [],
  keywordRules: [],
};

export const initialTelegramStatus: TelegramStatus | null = null;

export const emptyCounts: Record<LeadStatus, number> = {
  NEW: 0,
  REVIEWED: 0,
  CONTACTED: 0,
  DISMISSED: 0,
};

export const emptyFollowUpCounts = {
  today: 0,
  overdue: 0,
};

export const initialPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

export const emptyLeadSearchFilters: LeadSearchFilters = {
  search: "",
  chat: "",
  keyword: "",
  dateFrom: "",
  dateTo: "",
};

export const statusLabels: Record<LeadStatus, string> = {
  NEW: "Новые",
  REVIEWED: "Просмотрены",
  CONTACTED: "Связались",
  DISMISSED: "Неактуальные",
};

export const statusClasses: Record<LeadStatus, string> = {
  NEW: "bg-cyan-400/15 text-cyan-300",
  REVIEWED: "bg-violet-400/15 text-violet-300",
  CONTACTED: "bg-emerald-400/15 text-emerald-300",
  DISMISSED: "bg-slate-700 text-slate-300",
};