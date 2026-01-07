// ================================
// NOTIFICATIONS FUNCTIONALITY
// ================================

function initNotifications() {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationPopup = document.getElementById('notificationPopup');
    const markAllReadBtn = document.getElementById('markAllRead');

    if (notificationBtn && notificationPopup) {
        notificationBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationPopup.classList.toggle('active');

            // Close profile dropdown if open
            const profileDropdown = document.querySelector('.profile-dropdown');
            if (profileDropdown) {
                profileDropdown.classList.remove('active');
            }
        });

        // Close on outside click
        document.addEventListener('click', function(e) {
            if (!notificationPopup.contains(e.target) && !notificationBtn.contains(e.target)) {
                notificationPopup.classList.remove('active');
            }
        });
    }

    // Mark all as read
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', function() {
            markAllNotificationsRead();
        });
    }
}

async function loadNotifications() {
    try {
        const response = await fetch('/api/notifications');
        const data = await response.json();

        if (data.success) {
            renderNotifications(data.notifications);
            updateNotificationBadge();
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

async function addNotification(title, message, type = 'info') {
    try {
        const response = await fetch('/api/notifications/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, message, type })
        });

        const data = await response.json();

        if (data.success) {
            // Reload notifications to show the new one
            loadNotifications();
            return data.notification;
        }
    } catch (error) {
        console.error('Error adding notification:', error);
    }
    return null;
}

function renderNotifications(notifications) {
    const notificationList = document.getElementById('notificationList');
    if (!notificationList) return;

    if (notifications.length === 0) {
        notificationList.innerHTML = `
            <div class="notification-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <p>No notifications yet</p>
            </div>
        `;
        return;
    }

    const iconsByType = {
        order: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                    <path d="M3 6h18"></path>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>`,
        success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>`,
        info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>`,
        warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>`
    };

    notificationList.innerHTML = notifications.map(notif => {
        // Support both API format (createdat, is_read) and legacy format (timestamp, read)
        const timestamp = notif.createdat || notif.timestamp;
        const isRead = notif.is_read !== undefined ? notif.is_read : notif.read;
        const timeAgo = getTimeAgo(timestamp);
        const icon = iconsByType[notif.type] || iconsByType.info;

        return `
            <div class="notification-item ${isRead ? 'read' : 'unread'}" data-id="${notif.id}">
                <div class="notification-icon ${notif.type}">
                    ${icon}
                </div>
                <div class="notification-content">
                    <h4 class="notification-title">${notif.title}</h4>
                    <p class="notification-message">${notif.message}</p>
                    <span class="notification-time">${timeAgo}</span>
                </div>
                <button class="notification-dismiss" onclick="dismissNotification(${notif.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `;
    }).join('');

    // Add click handlers to mark as read
    notificationList.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (!e.target.closest('.notification-dismiss')) {
                markNotificationRead(parseInt(this.dataset.id));
            }
        });
    });
}

async function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;

    try {
        const response = await fetch('/api/notifications/unread-count');
        const data = await response.json();

        if (data.success) {
            const unreadCount = data.count;
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error fetching unread count:', error);
    }
}

async function markNotificationRead(id) {
    try {
        const response = await fetch(`/api/notifications/read/${id}`, {
            method: 'PUT'
        });

        const data = await response.json();

        if (data.success) {
            // Reload notifications to update UI
            loadNotifications();
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

async function markAllNotificationsRead() {
    try {
        const response = await fetch('/api/notifications/read-all', {
            method: 'PUT'
        });

        const data = await response.json();

        if (data.success) {
            // Reload notifications to update UI
            loadNotifications();
        }
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
}

async function dismissNotification(id) {
    try {
        const response = await fetch(`/api/notifications/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            // Reload notifications to update UI
            loadNotifications();
        }
    } catch (error) {
        console.error('Error dismissing notification:', error);
    }
}
