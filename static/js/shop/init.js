// ================================
// SHOP PAGE INITIALIZATION
// ================================

document.addEventListener('DOMContentLoaded', function() {
    // Core functionality
    initProfileDropdown();

    // Cart
    initCartSidebar();
    initAddToCart();

    // Filters & Search
    initFilters();
    initSearch();
    initViewToggle();

    // Product Modal
    initProductModal();

    // Wishlist
    initWishlist();

    // Checkout
    initCheckout();

    // Orders
    initOrders();

    // Notifications
    initNotifications();

    // Profile Modal
    initProfileModal();

    // Load initial data
    loadCart();
    loadNotifications();
});
