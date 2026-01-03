/**
 * Real-time notifications utility
 * Ready for WebSocket integration
 */

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

class RealtimeNotifications {
  private notifications: Notification[] = [];
  private listeners: Set<(notifications: Notification[]) => void> = new Set();
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Initialize WebSocket connection
   */
  connect(wsUrl?: string) {
    if (typeof window === 'undefined') return;

    // For now, use polling. Replace with WebSocket when backend is ready
    // const url = wsUrl || `ws://localhost:4000/ws`;
    // this.ws = new WebSocket(url);
    // 
    // this.ws.onopen = () => {
    //   console.log('WebSocket connected');
    //   this.reconnectAttempts = 0;
    // };
    // 
    // this.ws.onmessage = (event) => {
    //   const notification = JSON.parse(event.data);
    //   this.addNotification(notification);
    // };
    // 
    // this.ws.onerror = (error) => {
    //   console.error('WebSocket error:', error);
    // };
    // 
    // this.ws.onclose = () => {
    //   console.log('WebSocket disconnected');
    //   this.reconnect();
    // };

    // Polling fallback
    this.startPolling();
  }

  /**
   * Start polling for notifications
   */
  private startPolling() {
    // Poll every 30 seconds
    setInterval(() => {
      this.fetchNotifications();
    }, 30000);

    // Initial fetch
    this.fetchNotifications();
  }

  /**
   * Fetch notifications from API
   */
  private async fetchNotifications() {
    try {
      // Uncomment when backend endpoint is ready
      // const response = await fetch('/api/notifications');
      // const data = await response.json();
      // if (data.success) {
      //   data.data.forEach((notification: Notification) => {
      //     this.addNotification(notification);
      //   });
      // }
    } catch (error) {
      console.warn('Failed to fetch notifications:', error);
    }
  }

  /**
   * Reconnect WebSocket
   */
  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Add notification
   */
  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date(),
      read: false,
    };

    this.notifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.notifyListeners();
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  /**
   * Mark all as read
   */
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.notifyListeners();
  }

  /**
   * Remove notification
   */
  remove(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  /**
   * Get all notifications
   */
  getAll(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Subscribe to notifications
   */
  subscribe(callback: (notifications: Notification[]) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners() {
    this.listeners.forEach(listener => {
      listener(this.getAll());
    });
  }

  /**
   * Disconnect
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Singleton instance
export const realtimeNotifications = new RealtimeNotifications();

// Auto-connect on initialization
if (typeof window !== 'undefined') {
  realtimeNotifications.connect();
}

export default realtimeNotifications;







