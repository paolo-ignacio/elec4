// ================================
// ORDERS FUNCTIONALITY
// ================================

let allOrders = [];
let currentOrderFilter = 'all';
let currentOrderSearch = '';

function initOrders() {
    const myOrdersLink = document.querySelector('.profile-menu-item[href="#"]:nth-child(2)');
    const viewOrdersBtn = document.getElementById('viewOrdersBtn');
    const closeOrdersBtn = document.getElementById('closeOrders');
    const ordersOverlay = document.getElementById('ordersOverlay');
    const ordersSearch = document.getElementById('ordersSearch');

    // Find the "My Orders" link more reliably
    document.querySelectorAll('.profile-menu-item').forEach(item => {
        if (item.textContent.trim().includes('My Orders')) {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                openOrders();
            });
        }
    });

    if (viewOrdersBtn) {
        viewOrdersBtn.addEventListener('click', function() {
            closeCheckout();
            openOrders();
        });
    }

    if (closeOrdersBtn) {
        closeOrdersBtn.addEventListener('click', closeOrders);
    }

    if (ordersOverlay) {
        ordersOverlay.addEventListener('click', closeOrders);
    }

    // Status tabs
    document.querySelectorAll('.orders-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.orders-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentOrderFilter = this.dataset.status;
            filterAndRenderOrders();
        });
    });

    // Search
    if (ordersSearch) {
        ordersSearch.addEventListener('input', debounce(function(e) {
            currentOrderSearch = e.target.value.toLowerCase().trim();
            filterAndRenderOrders();
        }, 300));
    }
}

async function openOrders() {
    const ordersModal = document.getElementById('ordersModal');
    const ordersList = document.getElementById('ordersList');

    ordersModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Reset filters
    currentOrderFilter = 'all';
    currentOrderSearch = '';
    document.querySelectorAll('.orders-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.orders-tab[data-status="all"]').classList.add('active');
    const searchInput = document.getElementById('ordersSearch');
    if (searchInput) searchInput.value = '';

    ordersList.innerHTML = '<div class="orders-loading"><p>Loading orders...</p></div>';

    try {
        const response = await fetch('/api/orders');
        const data = await response.json();

        if (data.success) {
            allOrders = data.orders;
            updateOrderCounts();
            filterAndRenderOrders();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersList.innerHTML = '<div class="orders-error"><p>Error loading orders</p></div>';
    }
}

function closeOrders() {
    const ordersModal = document.getElementById('ordersModal');
    ordersModal.classList.remove('active');
    document.body.style.overflow = '';
}

function updateOrderCounts() {
    const counts = {
        all: allOrders.length,
        pending: 0,
        processing: 0,
        shipped: 0,
        completed: 0,
        cancelled: 0
    };

    allOrders.forEach(order => {
        const status = order.status.toLowerCase();
        if (counts.hasOwnProperty(status)) {
            counts[status]++;
        }
    });

    // Update count badges
    document.getElementById('countAll').textContent = counts.all;
    document.getElementById('countPending').textContent = counts.pending;
    document.getElementById('countProcessing').textContent = counts.processing;
    document.getElementById('countShipped').textContent = counts.shipped;
    document.getElementById('countCompleted').textContent = counts.completed;
    document.getElementById('countCancelled').textContent = counts.cancelled;

    // Hide tabs with zero count (except All)
    document.querySelectorAll('.orders-tab').forEach(tab => {
        const status = tab.dataset.status;
        if (status !== 'all' && counts[status] === 0) {
            tab.style.display = 'none';
        } else {
            tab.style.display = 'flex';
        }
    });
}

function filterAndRenderOrders() {
    let filtered = [...allOrders];

    // Filter by status
    if (currentOrderFilter !== 'all') {
        filtered = filtered.filter(order => order.status.toLowerCase() === currentOrderFilter);
    }

    // Filter by search
    if (currentOrderSearch) {
        filtered = filtered.filter(order => {
            const orderId = `#${String(order.id).padStart(6, '0')}`.toLowerCase();
            const matchesId = orderId.includes(currentOrderSearch);
            const matchesProduct = order.items.some(item =>
                item.name.toLowerCase().includes(currentOrderSearch)
            );
            return matchesId || matchesProduct;
        });
    }

    renderOrders(filtered);
}

function renderOrders(orders) {
    const ordersList = document.getElementById('ordersList');

    if (orders.length === 0) {
        const isFiltered = currentOrderFilter !== 'all' || currentOrderSearch;
        ordersList.innerHTML = `
            <div class="no-orders">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                    <path d="M3 6h18"></path>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                <h3>${isFiltered ? 'No matching orders' : 'No orders yet'}</h3>
                <p>${isFiltered ? 'Try adjusting your filters or search term' : 'Start shopping to see your orders here!'}</p>
            </div>
        `;
        return;
    }

    const statusColors = {
        'pending': '#f59e0b',
        'processing': '#3b82f6',
        'shipped': '#8b5cf6',
        'completed': '#059669',
        'cancelled': '#ef4444'
    };

    const statusIcons = {
        'pending': `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>`,
        'processing': `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                    </svg>`,
        'shipped': `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="1" y="3" width="15" height="13"></rect>
                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                        <circle cx="5.5" cy="18.5" r="2.5"></circle>
                        <circle cx="18.5" cy="18.5" r="2.5"></circle>
                    </svg>`,
        'completed': `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>`,
        'cancelled': `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>`
    };

    ordersList.innerHTML = orders.map(order => {
        const status = order.status.toLowerCase();
        const statusColor = statusColors[status] || '#6b7280';
        const statusIcon = statusIcons[status] || '';
        const date = new Date(order.createdat).toLocaleDateString('en-PH', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        const time = new Date(order.createdat).toLocaleTimeString('en-PH', {
            hour: '2-digit', minute: '2-digit'
        });

        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <div class="order-info">
                        <span class="order-id">#${String(order.id).padStart(6, '0')}</span>
                        <span class="order-date">${date} at ${time}</span>
                    </div>
                    <span class="order-status status-${status}" style="--status-color: ${statusColor}">
                        ${statusIcon}
                        ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                </div>
                <div class="order-items">
                    ${order.items.slice(0, 3).map(item => `
                        <div class="order-item-mini">
                            <img src="${item.imagepath || 'https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM='}" alt="${item.name}">
                            <div class="order-item-info">
                                <span class="item-name">${item.name}</span>
                                <span class="item-details">₱${item.price.toFixed(2)} x ${item.quantity}</span>
                            </div>
                        </div>
                    `).join('')}
                    ${order.items.length > 3 ? `<div class="more-items">+${order.items.length - 3} more item${order.items.length - 3 > 1 ? 's' : ''}</div>` : ''}
                </div>
                <div class="order-footer">
                    <div class="order-payment">
                        <span class="payment-method-badge">${formatPaymentMethod(order.payment_method)}</span>
                        <span class="payment-status-badge ${order.payment_status}">${formatPaymentStatus(order.payment_status)}</span>
                    </div>
                    <div class="order-total-section">
                        <span class="total-label">${order.items.length} item${order.items.length > 1 ? 's' : ''}</span>
                        <span class="order-total">₱${order.totalamount.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function formatPaymentMethod(method) {
    const methods = {
        'cod': 'Cash on Delivery',
        'gcash': 'GCash',
        'maya': 'Maya',
        'card': 'Card',
        'bank_transfer': 'Bank Transfer'
    };
    return methods[method] || method || 'N/A';
}

function formatPaymentStatus(status) {
    const statuses = {
        'pending': 'Payment Pending',
        'paid': 'Paid',
        'failed': 'Failed',
        'refunded': 'Refunded'
    };
    return statuses[status] || status || 'Pending';
}
