// ================================
// SHOP CORE - Shared State & Utilities
// ================================

// Global state
let cartData = { items: [], total: 0, count: 0 };
let currentProduct = null;

// ================================
// TOAST NOTIFICATIONS
// ================================
function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ================================
// DEBOUNCE UTILITY
// ================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ================================
// TIME AGO UTILITY
// ================================
function getTimeAgo(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

// ================================
// PROFILE DROPDOWN
// ================================
function initProfileDropdown() {
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.querySelector('.profile-dropdown');

    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });

        // Close on outside click
        document.addEventListener('click', function(e) {
            if (!profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove('active');
            }
        });
    }
}

// ================================
// LIST VIEW STYLES (Dynamic)
// ================================
const listViewStyles = document.createElement('style');
listViewStyles.textContent = `
    .shop-products-grid.list-view {
        grid-template-columns: 1fr;
    }

    .shop-products-grid.list-view .shop-product-card {
        display: flex;
        flex-direction: row;
    }

    .shop-products-grid.list-view .product-image-wrapper {
        width: 200px;
        flex-shrink: 0;
        aspect-ratio: 1;
    }

    .shop-products-grid.list-view .product-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .shop-products-grid.list-view .product-desc {
        -webkit-line-clamp: 3;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .spin {
        animation: spin 0.8s linear infinite;
    }

    @media (max-width: 768px) {
        .shop-products-grid.list-view .shop-product-card {
            flex-direction: column;
        }

        .shop-products-grid.list-view .product-image-wrapper {
            width: 100%;
        }
    }
`;
document.head.appendChild(listViewStyles);
