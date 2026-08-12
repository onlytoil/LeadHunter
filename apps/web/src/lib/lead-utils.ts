import type { LeadFilter, LeadSearchFilters, LeadStatus } from "./types";

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isOverdue(value: string | null) {
  return value ? value.slice(0, 10) < getLocalDateKey() : false;
}

export function isLeadStatus(value: LeadFilter): value is LeadStatus {
  return !["ALL", "TODAY", "OVERDUE"].includes(value);
}

export function buildLeadsQuery(
  status: LeadFilter,
  filters: LeadSearchFilters,
  page?: number,
  limit?: number,
) {
  const params = new URLSearchParams();

  if (isLeadStatus(status)) {
    params.set("status", status);
  }

  if (status === "TODAY" || status === "OVERDUE") {
    params.set("followUp", status);
  }

  if (filters.search.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.chat.trim()) {
    params.set("chat", filters.chat.trim());
  }

  if (filters.keyword.trim()) {
    params.set("keyword", filters.keyword.trim());
  }

  if (filters.dateFrom) {
    params.set("dateFrom", filters.dateFrom);
  }

  if (filters.dateTo) {
    params.set("dateTo", filters.dateTo);
  }

  if (page) {
    params.set("page", String(page));
  }

  if (limit) {
    params.set("limit", String(limit));
  }

  return params.toString();
}