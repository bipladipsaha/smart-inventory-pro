/**
 * Centralized API helper with automatic JWT handling
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Token storage keys
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: "owner" | "buyer";
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  qrCode: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lowStock: boolean;
}

export interface ApiError {
  error: string;
}

// Token management
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

export function setStoredUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Generic fetch wrapper with JWT
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle unauthorized (token expired or invalid)
  if (response.status === 401) {
    removeToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Session expired. Please login again.");
  }

  // Handle forbidden (insufficient permissions)
  if (response.status === 403) {
    throw new Error("You do not have permission to perform this action.");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "An error occurred");
  }

  return data;
}

// Auth APIs
export async function register(
  name: string,
  email: string,
  password: string
): Promise<{ user: User; token: string }> {
  // Note: Only buyer registration is allowed. Role is forced to "buyer" on backend.
  const data = await apiFetch<{ user: User; token: string; message: string }>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }
  );

  setToken(data.token);
  setStoredUser(data.user);

  return data;
}

export async function login(
  email: string,
  password: string
): Promise<{ user: User; token: string }> {
  const data = await apiFetch<{ user: User; token: string; message: string }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }
  );

  setToken(data.token);
  setStoredUser(data.user);

  return data;
}

export function logout(): void {
  removeToken();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

// Inventory APIs
export async function getItems(): Promise<InventoryItem[]> {
  const data = await apiFetch<{ items: InventoryItem[] }>("/items");
  return data.items;
}

export async function getItem(id: string): Promise<InventoryItem> {
  const data = await apiFetch<{ item: InventoryItem }>(`/items/${id}`);
  return data.item;
}

export async function getItemByQrCode(qrCode: string): Promise<InventoryItem> {
  const data = await apiFetch<{ item: InventoryItem }>(`/items/qr/${qrCode}`);
  return data.item;
}

export async function createItem(item: {
  name: string;
  category: string;
  quantity: number;
  price: number;
}): Promise<InventoryItem> {
  const data = await apiFetch<{ item: InventoryItem; message: string }>(
    "/items",
    {
      method: "POST",
      body: JSON.stringify(item),
    }
  );
  return data.item;
}

export async function updateItem(
  id: string,
  item: Partial<{
    name: string;
    category: string;
    quantity: number;
    price: number;
  }>
): Promise<InventoryItem> {
  const data = await apiFetch<{ item: InventoryItem; message: string }>(
    `/items/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(item),
    }
  );
  return data.item;
}

export async function deleteItem(id: string): Promise<void> {
  await apiFetch<{ message: string }>(`/items/${id}`, {
    method: "DELETE",
  });
}

export async function getQrImage(
  id: string
): Promise<{ qrCode: string; qrImage: string }> {
  return apiFetch<{ qrCode: string; qrImage: string }>(`/items/${id}/qr-image`);
}

// Public item info returned from the public QR lookup API
export interface PublicItemInfo {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  qrCode: string;
  inStock: boolean;
}

/**
 * PUBLIC API: Get item info by QR token.
 * 
 * This function calls the PUBLIC endpoint that does NOT require authentication.
 * It returns product information suitable for public display and cart.
 * 
 * @param qrToken - The QR token (e.g., "INV-XXXXXXXX")
 * @returns Public item info
 */
export async function getPublicItemByQrToken(qrToken: string): Promise<PublicItemInfo> {
  // Note: This does NOT use apiFetch because it doesn't need JWT
  const response = await fetch(`${API_URL}/items/qr/${qrToken}`);

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Too many requests. Please wait a moment and try again.");
    }
    throw new Error(data.error || "Item not found");
  }

  return data;
}

// Order types
export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
}

// Order APIs
export async function createOrder(items: { productId: string; quantity: number }[]): Promise<Order> {
  const data = await apiFetch<{ order: Order; message: string }>(
    "/orders",
    {
      method: "POST",
      body: JSON.stringify({ items }),
    }
  );
  return data.order;
}

export async function getOrders(): Promise<Order[]> {
  const data = await apiFetch<{ orders: Order[] }>("/orders");
  return data.orders;
}

export async function getOrder(id: string): Promise<Order> {
  const data = await apiFetch<{ order: Order }>(`/orders/${id}`);
  return data.order;
}

export async function updateOrderStatus(
  id: string,
  status: "pending" | "completed" | "cancelled"
): Promise<Order> {
  const data = await apiFetch<{ order: Order; message: string }>(
    `/orders/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );
  return data.order;
}
