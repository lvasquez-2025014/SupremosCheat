export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type UserRole = 'superadmin' | 'admin' | 'cliente';

export interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  avatar?: string;
  bio?: string;
  discord?: string;
  country?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface PricePlan {
  duration: string;
  price: number;
}

export interface Product {
  _id: string;
  id?: string;
  name: string;
  description: string;
  category: string;
  prices: PricePlan[];
  stock: number;
  isActive?: boolean;
  badge?: string;
  badgeType?: string;
  icon?: string;
  image?: string;
  sales: number;
  createdAt: string;
  updatedAt: string;
  priceFrom?: number;
  priceTo?: number;
}

export type OrderStatus = 'pending' | 'completed' | 'cancelled';
export type PaymentMethod = 'paypal' | 'binance' | 'transferencia';

export interface Order {
  _id: string;
  product: Product | string;
  buyer?: User | string;
  buyerName?: string;
  buyerEmail?: string;
  planDuration: string;
  amount: number;
  method: PaymentMethod;
  status: OrderStatus;
  salesCounted?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  name: string;
  type: 'direct' | 'group' | 'channel';
  members: string[];
  memberDetails?: User[];
  isActive?: boolean;
  description?: string;
  unreadCount?: number;
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface MessageReaction {
  emoji: string;
  user: string;
}

export interface Message {
  _id: string;
  sender: User | { _id: string; name: string; email: string; role: UserRole };
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  conversation?: string;
  isRead?: boolean;
  readBy?: string[];
  reactions?: MessageReaction[];
  replyTo?: Message | string | null;
  isPinned?: boolean;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
  _new?: boolean;
}

export interface Notification {
  _id: string;
  user: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  link?: string;
  icon?: string;
  targetRole?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totalUsers: number;
  admins: number;
  superadmins: number;
  clientes: number;
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
}

export interface EarningsData {
  weekly: { label: string; amount: number }[];
  totalRevenue: number;
  totalOrders: number;
  transactions: Transaction[];
}

export interface Transaction {
  description: string;
  amount: number;
  method: string;
  status: string;
  date: string;
  icon: string;
  color: string;
  type: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface NavItem {
  name: string;
  icon: string;
  section: string;
}

export interface StatsCard {
  title: string;
  value: string;
  change: string;
  changeType: string;
  icon: string;
  color: string;
}

export interface ActivityItem {
  type: string;
  user: string;
  action: string;
  detail: string;
  timestamp: string;
}

export interface TopProduct {
  name: string;
  sales: number;
  revenue: string;
  trend: number;
  priceRange: string;
}

export interface PaymentMethodOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface BankDetails {
  bank: string;
  account: string;
  holder: string;
  clabe: string;
  note: string;
}
