export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
  status: number;
}

/**
 * Standard client fetch helper to communicate with BFF route handlers
 */
export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const res = await fetch(path, {
      ...options,
      headers,
    });

    let data: any = null;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = text ? { message: text } : null;
    }

    if (!res.ok) {
      // Map standard BFF / Backend errors
      let errorMsg = data?.error || data?.message || "An unexpected error occurred.";
      let fieldErrors = data?.fieldErrors || data?.errors;

      // Handle raw NestJS/Spring-like arrays of errors sometimes returned under "message"
      if (Array.isArray(data?.message)) {
        errorMsg = "Validation failed.";
        fieldErrors = data.message.reduce((acc: Record<string, string>, err: any) => {
          // If the element has property "property" and "constraints", map it (NestJS convention)
          if (err?.property && err?.constraints) {
            acc[err.property] = Object.values(err.constraints)[0] as string;
          } else if (typeof err === "string") {
            // General string validations
            if (err.toLowerCase().includes("email")) acc["email"] = err;
            else if (err.toLowerCase().includes("password")) acc["password"] = err;
            else acc["form"] = err;
          }
          return acc;
        }, {});
      }

      // Map special status codes
      if (res.status === 409) {
        errorMsg = data?.message || "This email address is already registered.";
        // Often a duplicate conflict relates to the email field
        if (!fieldErrors) {
          fieldErrors = { email: errorMsg };
        }
      } else if (res.status === 429) {
        errorMsg = "Too many requests. Please slow down and try again later.";
      }

      return {
        success: false,
        error: errorMsg,
        fieldErrors,
        status: res.status,
      };
    }

    return {
      success: true,
      data,
      status: res.status,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Network error. Please check your connection and try again.",
      status: 500,
    };
  }
}
