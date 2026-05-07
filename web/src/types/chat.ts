export interface User {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
  isOnline: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface LastMessage {
  id: number;
  conversationId: number;
  senderId: number;
  content: string | null;
  messageType: 'text' | 'image';
  fileName: string | null;
  objectName: string | null;
  fileMimeType: string | null;
  fileSize: string | null;
  imageUrl?: string | null;
  createdAt: string;
  sender: User | null;
}

export interface Conversation {
  id: number;
  type: 'private' | 'group';
  name: string | null;
  createdById: number | null;
  createdAt: string;
  updatedAt: string;

  lastMessageAt?: string | null;
  lastMessage?: LastMessage | null;

  otherUser?: User | null;
  memberCount?: number;
  unreadCount?: number;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string | null;
  messageType: 'text' | 'image';
  fileName: string | null;
  objectName: string | null;
  fileMimeType: string | null;
  fileSize: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  sender: User | null;
}

export interface NotificationItem {
  id: number;
  userId: number;
  type: 'new_message' | 'added_to_group' | 'system';
  title: string;
  content: string;
  relatedConversationId: number | null;
  isRead: boolean;
  createdAt: string;
}

export interface TypingUser {
  conversationId: number;
  userId: number;
  username?: string;
  isTyping: boolean;
}