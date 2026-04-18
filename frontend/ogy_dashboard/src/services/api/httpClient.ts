export interface HttpError extends Error {
  status: number;
  statusText: string;
  url: string;
  data?: unknown;
}

interface HttpClientOptions {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

interface HttpResponse<T> {
  data: T;
}

const parseBody = async (res: Response) => {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("json")) {
    return res.json().catch(() => undefined);
  }
  const text = await res.text();
  return text === "" ? undefined : text;
};

export const createHttpClient = ({
  baseURL,
  timeout = 10_000,
  headers: defaultHeaders,
}: HttpClientOptions) => {
  const request = async <T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<HttpResponse<T>> => {
    const url = `${baseURL}${path}`;
    const signal = options?.signal ?? AbortSignal.timeout(timeout);

    const res = await fetch(url, {
      method,
      signal,
      headers: {
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...defaultHeaders,
        ...options?.headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const data = await parseBody(res);

    if (!res.ok) {
      const error = new Error(
        `HTTP ${res.status} ${res.statusText || method + " " + url}`.trim()
      ) as HttpError;
      error.status = res.status;
      error.statusText = res.statusText;
      error.url = url;
      error.data = data;
      throw error;
    }

    return { data: data as T };
  };

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get: <T = any>(path: string, options?: RequestOptions) =>
      request<T>("GET", path, undefined, options),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    post: <T = any>(
      path: string,
      body?: unknown,
      options?: RequestOptions
    ) => request<T>("POST", path, body, options),
  };
};
