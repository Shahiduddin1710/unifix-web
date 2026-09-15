import { getValidAccessToken, clearAuthTokens } from './auth';

const BASE_URL = import.meta.env.VITE_BASE_URL;

let refreshing: Promise<string> | null = null;

const request = async (method: string, endpoint: string, body?: object, requiresAuth = true): Promise<any> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (requiresAuth) {
    const token = await getValidAccessToken();
    if (!token) { clearAuthTokens(); window.location.href = '/login'; throw new Error('SESSION_EXPIRED'); }
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const contentType = res.headers.get('content-type');
  const data = contentType?.includes('application/json') ? await res.json() : { message: await res.text() };
  if (res.status === 401 && requiresAuth) { clearAuthTokens(); window.location.href = '/login'; throw new Error('SESSION_EXPIRED'); }
  if (!res.ok) {
    const err: any = new Error(data?.error || data?.message || 'Request failed');
    err.code = data?.code ?? null;
    throw err;
  }
  return data;
};

const get = (endpoint: string) => request('GET', endpoint);
const post = (endpoint: string, body: object, requiresAuth = true) => request('POST', endpoint, body, requiresAuth);
const patch = (endpoint: string, body: object) => request('PATCH', endpoint, body);
const del = (endpoint: string) => request('DELETE', endpoint);

export const authAPI = {
  login: (email: string, password: string) => post('/auth/login', { email, password }, false),
  signup: (fullName: string, email: string, password: string, role: string) => post('/auth/signup', { fullName, email, password, role }, false),
  verifyOtp: (email: string, otp: string, fullName: string, password: string, role: string) => post('/auth/verify-otp', { email, otp, fullName, password, role }, false),
  resendOtp: (email: string, fullName: string, type: string) => post('/auth/resend-otp', { email, fullName, type }, false),
  forgotPassword: (email: string) => post('/auth/forgot-password', { email }, false),
  validateResetOtp: (email: string, otp: string) => post('/auth/validate-reset-otp', { email, otp }, false),
  verifyResetOtp: (email: string, otp: string, newPassword: string) => post('/auth/verify-reset-otp', { email, otp, newPassword }, false),
  googleSignIn: (idToken: string) => post('/auth/firebase', { idToken }, false),
  selectRole: (role: string) => post('/auth/select-role', { role }),
  completeProfile: (data: object) => post('/auth/complete-profile', data),
  myProfile: () => get('/auth/my-profile'),
  updateProfile: (fullName: string, phone?: string) => post('/auth/update-profile', { fullName, phone }),
  changePassword: (currentPassword: string, newPassword: string) => post('/auth/change-password', { currentPassword, newPassword }),
  logoutAllDevices: () => post('/auth/logout-all-devices', {}),
  deleteAccount: () => post('/auth/delete-account', {}),
  reportSecurityIssue: (issueType: string, description: string) => post('/auth/report-security-issue', { issueType, description }),
  requestIdCardUpdate: (newIdCardUrl: string, newIdCardName?: string) => post('/auth/request-idcard-update', { newIdCardUrl, newIdCardName }),
  reportRagging: (payload: object) => post('/auth/report-ragging', payload),
};

export const complaintsAPI = {
  submit: (payload: object) => post('/complaints/submit', payload),
  myComplaints: () => get('/complaints/my-complaints'),
  getById: (id: string) => get(`/complaints/${id}`),
  rate: (complaintId: string, rating: number, comment?: string) => post('/complaints/rate', { complaintId, rating, comment: comment ?? '' }),
  settings: () => fetch(`${BASE_URL}/complaints/settings`).then(r => r.json()),
};

export const lostFoundAPI = {
  feed: () => get('/lost-found/feed'),
  myPosts: () => get('/lost-found/my-posts'),
  claims: () => get('/lost-found/claims'),
  postItem: (payload: object) => post('/lost-found/post', payload),
  handover: (itemId: string, handedToName: string) => post('/lost-found/handover', { itemId, handedToName }),
  deletePost: (itemId: string) => del(`/lost-found/${itemId}`),
};

export const lostReportsAPI = {
  feed: () => get('/lost-reports/feed'),
  post: (payload: object) => post('/lost-reports/post', payload),
  markFound: (id: string) => patch(`/lost-reports/${id}/found`, {}),
  deleteReport: (id: string) => del(`/lost-reports/${id}`),
};

export const masterAPI = {
  getData: () => get('/master/data'),
};