/**
 * ERPNext API Authentication Module
 * Handles API key/secret authentication for ERPNext
 */

interface ERPNextAuthConfig {
  apiUrl: string;
  apiKey: string;
  apiSecret: string;
}

let cachedConfig: ERPNextAuthConfig | null = null;

export function getERPNextConfig(): ERPNextAuthConfig {
  if (cachedConfig) return cachedConfig;

  const apiUrl = process.env.ERPNEXT_API_URL;
  const apiKey = process.env.ERPNEXT_API_KEY;
  const apiSecret = process.env.ERPNEXT_API_SECRET;

  if (!apiUrl || !apiKey || !apiSecret) {
    throw new Error(
      "Missing ERPNext configuration env vars: ERPNEXT_API_URL, ERPNEXT_API_KEY, ERPNEXT_API_SECRET"
    );
  }

  cachedConfig = {
    apiUrl: apiUrl.replace(/\/$/, ""), // Remove trailing slash
    apiKey,
    apiSecret,
  };

  return cachedConfig;
}

/**
 * Make an authenticated request to ERPNext API
 */
export async function makeERPNextRequest<T = any>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    body?: Record<string, any>;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const config = getERPNextConfig();
  const { method = "GET", body, headers = {} } = options;

  const url = `${config.apiUrl}/api/resource${endpoint}`;

  // Create basic auth header
  const authHeader = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString(
    "base64"
  );

  const requestOptions: RequestInit = {
    method,
    headers: {
      "Authorization": `Basic ${authHeader}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...headers,
    },
  };

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const detail =
        (errorData as { exception?: string }).exception ||
        (errorData as { message?: string }).message ||
        (errorData as { exc?: string }).exc ||
        response.statusText;
      throw new Error(`ERPNext API error (${response.status}): ${detail}`);
    }

    const data = await response.json();

    if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      if (d.exc_type != null && String(d.exc_type).length > 0) {
        const msg =
          (typeof d.exception === "string" && d.exception) ||
          (typeof d.exc === "string" && d.exc) ||
          (typeof d.message === "string" && d.message) ||
          String(d.exc_type);
        throw new Error(`ERPNext API error (${response.status}): ${msg}`);
      }
    }

    return data as T;
  } catch (error) {
    console.error(`ERPNext API request failed: ${endpoint}`, error);
    throw error;
  }
}

/**
 * Create a new document in ERPNext
 */
export async function createERPNextDocument<T = any>(
  doctype: string,
  data: Record<string, any>
): Promise<T> {
  return makeERPNextRequest(`/${encodeURIComponent(doctype)}`, {
    method: "POST",
    body: data,
  });
}

/**
 * Update an existing document in ERPNext
 */
export async function updateERPNextDocument<T = any>(
  doctype: string,
  name: string,
  data: Record<string, any>
): Promise<T> {
  return makeERPNextRequest(`/${doctype}/${name}`, {
    method: "PUT",
    body: data,
  });
}

/**
 * Get a document from ERPNext
 */
export async function getERPNextDocument<T = any>(
  doctype: string,
  name: string
): Promise<T> {
  return makeERPNextRequest(`/${doctype}/${name}`);
}

/**
 * List documents with filters from ERPNext
 */
export type ListERPNextDocumentsOptions = {
  /** e.g. `modified desc` or `creation desc` */
  orderBy?: string;
  limit?: number;
};

export async function listERPNextDocuments<T = any>(
  doctype: string,
  filters?: Record<string, any>,
  fields?: string[],
  listOptions?: ListERPNextDocumentsOptions
): Promise<{ data: T[] }> {
  let endpoint = `/${doctype}?`;

  if (filters && Object.keys(filters).length > 0) {
    const filterTuples: unknown[][] = [];
    for (const [key, value] of Object.entries(filters)) {
      if (Array.isArray(value)) {
        filterTuples.push([key, value[0], value[1]]);
      } else {
        filterTuples.push([key, "=", value]);
      }
    }
    endpoint += `filters=${encodeURIComponent(JSON.stringify(filterTuples))}&`;
  }

  if (fields && fields.length > 0) {
    endpoint += `fields=${encodeURIComponent(JSON.stringify(fields))}&`;
  }

  if (listOptions?.orderBy) {
    endpoint += `order_by=${encodeURIComponent(listOptions.orderBy)}&`;
  }
  if (listOptions?.limit != null) {
    endpoint += `limit_page_length=${listOptions.limit}&`;
  }

  console.log(`[ERPNext API] Fetching ${doctype} with endpoint:`, endpoint);
  const result = await makeERPNextRequest(endpoint);
  console.log(`[ERPNext API] Response for ${doctype}:`, JSON.stringify(result).substring(0, 500));
  return result as { data: T[] };
}
