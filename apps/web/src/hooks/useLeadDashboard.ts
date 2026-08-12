"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { request } from "../lib/api";
import { buildLeadsQuery } from "../lib/lead-utils";
import {
  emptyCounts,
  emptyFollowUpCounts,
  emptyLeadSearchFilters,
  initialPagination,
  initialSettings,
  initialTelegramStatus,
  type Lead,
  type LeadFilter,
  type LeadSearchFilters,
  type LeadStatus,
  type LeadsResponse,
  type Settings,
  type TelegramStatus,
} from "../lib/types";

export function useLeadDashboard() {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatus | null>(
    initialTelegramStatus,
  );
  const [leads, setLeads] = useState<Lead[]>([]);
  const [counts, setCounts] = useState(emptyCounts);
  const [followUpCounts, setFollowUpCounts] = useState(emptyFollowUpCounts);
  const [leadFilter, setLeadFilter] = useState<LeadFilter>("ALL");
  const [leadSearch, setLeadSearch] = useState<LeadSearchFilters>(
    emptyLeadSearchFilters,
  );
  const [pagination, setPagination] = useState(initialPagination);

  const [chatIdentifier, setChatIdentifier] = useState("");
  const [chatTitle, setChatTitle] = useState("");
  const [phrase, setPhrase] = useState("");
  const [ruleType, setRuleType] = useState<"INCLUDE" | "EXCLUDE">("INCLUDE");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingLeadIds, setSavingLeadIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  const latestLeadSearch = useRef(leadSearch);
  const didMountSearch = useRef(false);

  const loadSettings = useCallback(async () => {
    const data = await request<Settings>("/api/monitoring-settings");
    setSettings(data);
  }, []);

  const loadTelegramStatus = useCallback(async () => {
    try {
      const data = await request<TelegramStatus>("/api/telegram/status");
      setTelegramStatus(data);
    } catch {
      setTelegramStatus(null);
    }
  }, []);

  const loadLeads = useCallback(
    async (status: LeadFilter, filters: LeadSearchFilters, page = 1) => {
      const query = buildLeadsQuery(
        status,
        filters,
        page,
        initialPagination.limit,
      );
      const data = await request<LeadsResponse>(`/api/leads?${query}`);

      setLeads(data.leads);
      setCounts(data.counts);
      setFollowUpCounts(data.followUp);
      setPagination(data.pagination);
    },
    [],
  );

  const loadDashboard = useCallback(
    async (status: LeadFilter, filters: LeadSearchFilters) => {
      try {
        setLoading(true);
        setError("");

        await Promise.all([
          loadSettings(),
          loadLeads(status, filters, 1),
          loadTelegramStatus(),
        ]);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Не удалось загрузить данные dashboard.",
        );
      } finally {
        setLoading(false);
      }
    },
    [loadLeads, loadSettings, loadTelegramStatus],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard("ALL", emptyLeadSearchFilters);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  useEffect(() => {
    latestLeadSearch.current = leadSearch;
  }, [leadSearch]);

  useEffect(() => {
    if (!didMountSearch.current) {
      didMountSearch.current = true;
      return;
    }

    const timer = window.setTimeout(() => {
      void loadLeads(leadFilter, latestLeadSearch.current, 1);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [leadFilter, leadSearch.search, loadLeads]);

  const changeLeadFilter = useCallback((status: LeadFilter) => {
    setLeadFilter(status);
  }, []);

  async function mutateLead(
    id: string,
    path: string,
    options: RequestInit,
    fallbackError: string,
  ) {
    try {
      setSavingLeadIds((current) => [...current, id]);
      setError("");

      await request<Lead>(`/api/leads/${id}${path}`, options);
      await loadLeads(leadFilter, leadSearch, pagination.page);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : fallbackError,
      );
    } finally {
      setSavingLeadIds((current) => current.filter((leadId) => leadId !== id));
    }
  }

  const updateLeadStatus = (id: string, status: LeadStatus) =>
    mutateLead(
      id,
      "/status",
      { method: "PATCH", body: JSON.stringify({ status }) },
      "Не удалось обновить статус лида.",
    );

  const updateLeadNote = (id: string, note: string) =>
    mutateLead(
      id,
      "/note",
      { method: "PATCH", body: JSON.stringify({ note }) },
      "Не удалось сохранить заметку.",
    );

  const updateLeadFollowUp = (id: string, followUpAt: string | null) =>
    mutateLead(
      id,
      "/follow-up",
      { method: "PATCH", body: JSON.stringify({ followUpAt }) },
      "Не удалось сохранить дату следующего действия.",
    );

  const completeLead = (id: string) =>
    mutateLead(
      id,
      "/complete",
      { method: "PATCH" },
      "Не удалось завершить работу с лидом.",
    );

  function exportLeads() {
    const query = buildLeadsQuery(leadFilter, leadSearch);
    window.location.assign(`/api/leads/export${query ? `?${query}` : ""}`);
  }

  async function mutateSettings(path: string, options: RequestInit) {
    try {
      setSaving(true);
      setError("");

      await request(`/api/monitoring-settings${path}`, options);
      await loadSettings();

      return true;
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось сохранить изменения.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function addChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!chatIdentifier.trim()) {
      setError("Укажи username или ID Telegram-чата.");
      return;
    }

    const created = await mutateSettings("/chats", {
      method: "POST",
      body: JSON.stringify({
        identifier: chatIdentifier.trim(),
        title: chatTitle.trim() || undefined,
      }),
    });

    if (created) {
      setChatIdentifier("");
      setChatTitle("");
    }
  }

  async function addRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!phrase.trim()) {
      setError("Укажи ключевую фразу.");
      return;
    }

    const created = await mutateSettings("/keyword-rules", {
      method: "POST",
      body: JSON.stringify({ phrase: phrase.trim(), type: ruleType }),
    });

    if (created) {
      setPhrase("");
    }
  }

  const updateLeadDraft = (
    id: string,
    changes: Partial<Pick<Lead, "note" | "followUpAt">>,
  ) => {
    setLeads((current) =>
      current.map((lead) =>
        lead.id === id ? { ...lead, ...changes } : lead,
      ),
    );
  };

  const changePage = (page: number) => {
    void loadLeads(leadFilter, leadSearch, page);
  };

  return {
    settings,
    telegramStatus,
    leads,
    counts,
    followUpCounts,
    leadFilter,
    leadSearch,
    pagination,
    chatIdentifier,
    chatTitle,
    phrase,
    ruleType,
    loading,
    saving,
    savingLeadIds,
    error,
    setLeadSearch,
    setChatIdentifier,
    setChatTitle,
    setPhrase,
    setRuleType,
    setError,
    loadDashboard,
    loadLeads,
    changeLeadFilter,
    updateLeadStatus,
    updateLeadNote,
    updateLeadFollowUp,
    completeLead,
    exportLeads,
    mutateSettings,
    addChat,
    addRule,
    updateLeadDraft,
    changePage,
  };
}
