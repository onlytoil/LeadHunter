function getErrorMessage(data: unknown) {
  if (typeof data === "object" && data !== null && "message" in data) {
    const message = (data as { message: unknown }).message;

    return Array.isArray(message) ? message.join(", ") : String(message);
  }

  return "Не удалось выполнить запрос. Проверь, что API запущен.";
}

export async function request<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let data: unknown;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    throw new Error(getErrorMessage(data));
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}