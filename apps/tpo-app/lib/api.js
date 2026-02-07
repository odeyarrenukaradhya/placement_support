const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function apiFetch(endpoint, options = {}) {
  const token =
    typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const skipRedirect = options.skipRedirect || endpoint.startsWith('/auth');

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && !skipRedirect && typeof window !== 'undefined') {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    const errorData = (data && Object.keys(data).length > 0) ? data : { error: response.statusText || `Error ${response.status}` };
    throw errorData;
  }

  return data;
}
