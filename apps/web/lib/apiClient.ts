/**
 * Client-side API utility that handles authenticated requests
 */

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers || {});
  const isFormDataBody =
    typeof FormData !== 'undefined' && options.body instanceof FormData;

  // Add Authorization header if token exists (browser only)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('lms_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Always set Content-Type for POST/PUT/PATCH if not already set
  if (
    ['POST', 'PUT', 'PATCH'].includes(options.method || 'GET') &&
    !headers.has('Content-Type') &&
    !isFormDataBody
  ) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  return response;
}

