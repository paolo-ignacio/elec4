// ================================
// SHOP PAGE JAVASCRIPT
// ================================

// Global state
let cartData = { items: [], total: 0, count: 0 };
let checkoutStep = 1;
let currentOrderData = null;
let currentProduct = null;
let pendingOrderData = null; // For orders requiring proof before success

document.addEventListener('DOMContentLoaded', function() {
    // Profile Dropdown
    initProfileDropdown();

    // Cart Sidebar
    initCartSidebar();

    // Filters
    initFilters();

    // Search
    initSearch();

    // View Toggle
    initViewToggle();

    // Add to Cart
    initAddToCart();

    // Wishlist
    initWishlist();

    // Checkout
    initCheckout();

    // Orders
    initOrders();

    // Product Modal
    initProductModal();

    // Notifications
    initNotifications();

    // Profile Modal
    initProfileModal();

    // Load cart on page load
    loadCart();

    // Load notifications
    loadNotifications();
});

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
// CART SIDEBAR
// ================================
function initCartSidebar() {
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const closeCartBtn = document.getElementById('closeCart');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (cartBtn && cartSidebar && cartOverlay) {
        cartBtn.addEventListener('click', function() {
            openCart();
        });

        if (closeCartBtn) {
            closeCartBtn.addEventListener('click', closeCart);
        }

        cartOverlay.addEventListener('click', closeCart);

        // Close on Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && cartSidebar.classList.contains('active')) {
                closeCart();
            }
        });
    }

    // Checkout button
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (cartData.items.length === 0) {
                showToast('Your cart is empty', 'error');
                return;
            }
            closeCart();
            openCheckout();
        });
    }
}

function openCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    cartSidebar.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    loadCart();
}

function closeCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    cartSidebar.classList.remove('active');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

// ================================
// CART OPERATIONS
// ================================
async function loadCart() {
    try {
        const response = await fetch('/api/cart');
        const data = await response.json();

        if (data.success) {
            cartData = data;
            renderCartItems();
            updateCartCount(data.count);
            updateCartTotal(data.total);
        }
    } catch (error) {
        console.error('Error loading cart:', error);
    }
}

function renderCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    if (!cartItemsContainer) return;

    if (cartData.items.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <p>Your cart is empty</p>
            </div>
        `;
        return;
    }

    cartItemsContainer.innerHTML = cartData.items.map(item => `
        <div class="cart-item" data-item-id="${item.id}">
            <div class="cart-item-image">
                <img src="${item.imagepath || 'https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM='}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
                <h4 class="cart-item-name">${item.name}</h4>
                <span class="cart-item-price">₱${item.price.toFixed(2)}</span>
                <div class="cart-item-quantity">
                    <button class="qty-btn" onclick="updateItemQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateItemQuantity(${item.id}, ${item.quantity + 1})" ${item.quantity >= item.stock ? 'disabled' : ''}>+</button>
                </div>
            </div>
            <div class="cart-item-actions">
                <span class="cart-item-subtotal">₱${item.subtotal.toFixed(2)}</span>
                <button class="remove-item-btn" onclick="removeCartItem(${item.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

function updateCartCount(count) {
    const cartCountBadge = document.getElementById('cartCount');
    if (cartCountBadge) {
        cartCountBadge.textContent = count;
    }
}

function updateCartTotal(total) {
    const cartTotalEl = document.getElementById('cartTotal');
    if (cartTotalEl) {
        cartTotalEl.textContent = `₱${total.toFixed(2)}`;
    }
}

async function updateItemQuantity(itemId, quantity) {
    if (quantity <= 0) {
        removeCartItem(itemId);
        return;
    }

    try {
        const response = await fetch('/api/cart/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ item_id: itemId, quantity: quantity })
        });

        const data = await response.json();

        if (data.success) {
            loadCart();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Error updating cart:', error);
        showToast('Error updating cart', 'error');
    }
}

async function removeCartItem(itemId) {
    try {
        const response = await fetch('/api/cart/remove', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ item_id: itemId })
        });

        const data = await response.json();

        if (data.success) {
            loadCart();
            showToast('Item removed from cart', 'success');
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Error removing item:', error);
        showToast('Error removing item', 'error');
    }
}

// ================================
// FILTERS
// ================================
function initFilters() {
    const categoryCheckboxes = document.querySelectorAll('input[name="category"]');
    const inStockFilter = document.getElementById('inStockFilter');
    const applyPriceBtn = document.getElementById('applyPrice');
    const clearFiltersBtn = document.getElementById('clearFilters');
    const sortSelect = document.getElementById('sortSelect');

    // Handle "All Categories" checkbox
    const allCategoriesCheckbox = document.querySelector('input[name="category"][value="all"]');

    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.value === 'all') {
                // If "All" is checked, uncheck others
                if (this.checked) {
                    categoryCheckboxes.forEach(cb => {
                        if (cb.value !== 'all') cb.checked = false;
                    });
                }
            } else {
                // If any other is checked, uncheck "All"
                if (allCategoriesCheckbox) {
                    allCategoriesCheckbox.checked = false;
                }
            }
            applyFilters();
        });
    });

    // In Stock filter
    if (inStockFilter) {
        inStockFilter.addEventListener('change', applyFilters);
    }

    // Apply Price filter
    if (applyPriceBtn) {
        applyPriceBtn.addEventListener('click', applyFilters);
    }

    // Sort select
    if (sortSelect) {
        sortSelect.addEventListener('change', applyFilters);
    }

    // Clear all filters
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            window.location.href = '/shop';
        });
    }
}

function applyFilters() {
    const params = new URLSearchParams();

    // Categories
    const categoryCheckboxes = document.querySelectorAll('input[name="category"]:checked');
    categoryCheckboxes.forEach(cb => {
        if (cb.value !== 'all') {
            params.append('category', cb.value);
        }
    });

    // Price range
    const minPrice = document.getElementById('minPrice')?.value;
    const maxPrice = document.getElementById('maxPrice')?.value;
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);

    // In Stock
    const inStock = document.getElementById('inStockFilter')?.checked;
    if (inStock) params.set('in_stock', '1');

    // Sort
    const sort = document.getElementById('sortSelect')?.value;
    if (sort && sort !== 'newest') params.set('sort', sort);

    // Search
    const search = document.getElementById('searchInput')?.value?.trim();
    if (search) params.set('search', search);

    // Navigate
    const queryString = params.toString();
    window.location.href = '/shop' + (queryString ? '?' + queryString : '');
}

// ================================
// SEARCH
// ================================
function initSearch() {
    const searchInput = document.getElementById('searchInput');

    if (searchInput) {
        // Get current search value from URL
        const urlParams = new URLSearchParams(window.location.search);
        const currentSearch = urlParams.get('search');
        if (currentSearch) {
            searchInput.value = currentSearch;
        }

        // Debounced search
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (this.value.trim().length >= 2 || this.value.trim().length === 0) {
                    applyFilters();
                }
            }, 500);
        });

        // Search on Enter
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                applyFilters();
            }
        });

        // Keyboard shortcut Ctrl+K
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
            }
        });
    }
}

// ================================
// VIEW TOGGLE
// ================================
function initViewToggle() {
    const viewBtns = document.querySelectorAll('.view-btn');
    const productsGrid = document.getElementById('productsGrid');

    viewBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            viewBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const view = this.dataset.view;
            if (productsGrid) {
                if (view === 'list') {
                    productsGrid.classList.add('list-view');
                } else {
                    productsGrid.classList.remove('list-view');
                }
            }
        });
    });
}

// ================================
// ADD TO CART
// ================================
function initAddToCart() {
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn:not(.disabled)');

    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.dataset.productId;
            addToCart(productId, this);
        });
    });
}

async function addToCart(productId, button) {
    // Store original content
    const originalHTML = button.innerHTML;

    // Show loading state
    button.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
    `;
    button.disabled = true;

    try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ product_id: parseInt(productId), quantity: 1 })
        });

        const data = await response.json();

        if (data.success) {
            // Show success state
            button.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Added!
            `;
            button.style.background = '#059669';

            // Update cart count
            updateCartCount(data.count);

            // Reset after delay
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.style.background = '';
                button.disabled = false;
            }, 1500);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showToast(error.message || 'Error adding to cart', 'error');
        button.innerHTML = originalHTML;
        button.disabled = false;
    }
}

// ================================
// WISHLIST
// ================================
function initWishlist() {
    // Wishlist modal controls
    const wishlistBtn = document.getElementById('wishlistBtn');
    const wishlistModal = document.getElementById('wishlistModal');
    const wishlistOverlay = document.getElementById('wishlistOverlay');
    const closeWishlistBtn = document.getElementById('closeWishlist');
    const myWishlistLink = document.getElementById('myWishlistLink');
    const addAllToCartBtn = document.getElementById('addAllToCart');

    // Open wishlist modal
    if (wishlistBtn) {
        wishlistBtn.addEventListener('click', openWishlist);
    }

    if (myWishlistLink) {
        myWishlistLink.addEventListener('click', function(e) {
            e.preventDefault();
            // Close profile dropdown
            const profileDropdown = document.querySelector('.profile-dropdown');
            if (profileDropdown) profileDropdown.classList.remove('active');
            openWishlist();
        });
    }

    // Close wishlist modal
    if (closeWishlistBtn) {
        closeWishlistBtn.addEventListener('click', closeWishlist);
    }
    if (wishlistOverlay) {
        wishlistOverlay.addEventListener('click', closeWishlist);
    }

    // Add all to cart
    if (addAllToCartBtn) {
        addAllToCartBtn.addEventListener('click', addAllWishlistToCart);
    }

    // Load wishlist count on init
    loadWishlistCount();

    // Handle product modal wishlist button
    const modalWishlistBtn = document.getElementById('modalWishlist');
    if (modalWishlistBtn) {
        modalWishlistBtn.addEventListener('click', function() {
            const productId = this.dataset.productId;
            if (productId) {
                toggleWishlist(productId, this);
            }
        });
    }
}

// ================================
// CHECKOUT
// ================================
function initCheckout() {
    const checkoutModal = document.getElementById('checkoutModal');
    const checkoutOverlay = document.getElementById('checkoutOverlay');
    const closeCheckoutBtn = document.getElementById('closeCheckout');
    const checkoutBackBtn = document.getElementById('checkoutBack');
    const checkoutNextBtn = document.getElementById('checkoutNext');
    const paymentOptions = document.querySelectorAll('input[name="paymentMethod"]');

    // Close handlers
    if (closeCheckoutBtn) {
        closeCheckoutBtn.addEventListener('click', closeCheckout);
    }
    if (checkoutOverlay) {
        checkoutOverlay.addEventListener('click', closeCheckout);
    }

    // Navigation
    if (checkoutBackBtn) {
        checkoutBackBtn.addEventListener('click', goToPreviousStep);
    }
    if (checkoutNextBtn) {
        checkoutNextBtn.addEventListener('click', goToNextStep);
    }

    // Payment method change
    paymentOptions.forEach(option => {
        option.addEventListener('change', handlePaymentMethodChange);
    });

    // Continue shopping
    const continueShoppingBtn = document.getElementById('continueShopping');
    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', function() {
            closeCheckout();
            window.location.reload();
        });
    }

    // Init proof upload
    initProofUpload();
}

function openCheckout() {
    const checkoutModal = document.getElementById('checkoutModal');
    checkoutModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    checkoutStep = 1;
    updateCheckoutUI();
}

function closeCheckout() {
    const checkoutModal = document.getElementById('checkoutModal');
    checkoutModal.classList.remove('active');
    document.body.style.overflow = '';
    // Reset to step 1
    checkoutStep = 1;
    resetCheckoutForm();
}

function updateCheckoutUI() {
    // Update step indicators
    document.querySelectorAll('.checkout-step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 < checkoutStep) {
            step.classList.add('completed');
        } else if (index + 1 === checkoutStep) {
            step.classList.add('active');
        }
    });

    // Show/hide step content
    document.querySelectorAll('.checkout-step-content').forEach(content => {
        content.classList.remove('active');
    });
    const currentStepContent = document.getElementById(`step${checkoutStep}`);
    if (currentStepContent) {
        currentStepContent.classList.add('active');
    }

    // Update navigation buttons
    const backBtn = document.getElementById('checkoutBack');
    const nextBtn = document.getElementById('checkoutNext');

    backBtn.style.display = checkoutStep > 1 ? 'flex' : 'none';

    if (checkoutStep === 3) {
        nextBtn.innerHTML = `
            Place Order
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
    } else {
        nextBtn.innerHTML = `
            Continue
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
        `;
    }

    // Populate summary on step 3
    if (checkoutStep === 3) {
        populateOrderSummary();
    }
}

function goToPreviousStep() {
    if (checkoutStep > 1) {
        checkoutStep--;
        updateCheckoutUI();
    }
}

async function goToNextStep() {
    // Validate current step
    if (!validateCurrentStep()) {
        return;
    }

    if (checkoutStep < 3) {
        checkoutStep++;
        updateCheckoutUI();
    } else {
        // Place order
        await placeOrder();
    }
}

function validateCurrentStep() {
    if (checkoutStep === 1) {
        const phone = document.getElementById('shippingPhone').value.trim();
        const address = document.getElementById('shippingAddress').value.trim();

        if (!phone) {
            showToast('Please enter your phone number', 'error');
            document.getElementById('shippingPhone').focus();
            return false;
        }

        if (!address) {
            showToast('Please enter your delivery address', 'error');
            document.getElementById('shippingAddress').focus();
            return false;
        }
    }

    return true;
}

function handlePaymentMethodChange() {
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const paymentDetails = document.getElementById('paymentDetails');
    const paymentInstructions = document.getElementById('paymentInstructions');

    if (selectedMethod === 'cod') {
        paymentDetails.style.display = 'none';
    } else {
        paymentDetails.style.display = 'block';

        let instructions = '';
        switch (selectedMethod) {
            case 'gcash':
                instructions = `
                    <p>Send payment to:</p>
                    <p class="payment-account"><strong>GCash Number:</strong> 0917 123 4567</p>
                    <p class="payment-account"><strong>Account Name:</strong> HealthCart Inc.</p>
                    <p class="payment-note">Please upload your payment screenshot after placing the order.</p>
                `;
                break;
            case 'maya':
                instructions = `
                    <p>Send payment to:</p>
                    <p class="payment-account"><strong>Maya Number:</strong> 0918 765 4321</p>
                    <p class="payment-account"><strong>Account Name:</strong> HealthCart Inc.</p>
                    <p class="payment-note">Please upload your payment screenshot after placing the order.</p>
                `;
                break;
            case 'card':
                instructions = `
                    <p>Card payment will be processed securely.</p>
                    <p class="payment-note">You will receive a confirmation email after payment.</p>
                `;
                break;
            case 'bank_transfer':
                instructions = `
                    <p>Bank Transfer Details:</p>
                    <p class="payment-account"><strong>Bank:</strong> BDO</p>
                    <p class="payment-account"><strong>Account Number:</strong> 1234 5678 9012</p>
                    <p class="payment-account"><strong>Account Name:</strong> HealthCart Inc.</p>
                    <p class="payment-note">Please upload your deposit slip after placing the order.</p>
                `;
                break;
        }

        paymentInstructions.innerHTML = instructions;
    }
}

function populateOrderSummary() {
    // Items
    const summaryItems = document.getElementById('summaryItems');
    summaryItems.innerHTML = cartData.items.map(item => `
        <div class="summary-item">
            <img src="${item.imagepath || 'https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM='}" alt="${item.name}">
            <div class="summary-item-info">
                <span class="summary-item-name">${item.name}</span>
                <span class="summary-item-qty">Qty: ${item.quantity}</span>
            </div>
            <span class="summary-item-price">₱${item.subtotal.toFixed(2)}</span>
        </div>
    `).join('');

    // Totals
    document.getElementById('summarySubtotal').textContent = `₱${cartData.total.toFixed(2)}`;
    document.getElementById('summaryTotal').textContent = `₱${cartData.total.toFixed(2)}`;

    // Shipping
    document.getElementById('summaryAddress').textContent = document.getElementById('shippingAddress').value;
    document.getElementById('summaryPhone').textContent = document.getElementById('shippingPhone').value;

    // Payment
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
    const paymentNames = {
        'cod': 'Cash on Delivery',
        'gcash': 'GCash',
        'maya': 'Maya',
        'card': 'Credit/Debit Card',
        'bank_transfer': 'Bank Transfer'
    };
    document.getElementById('summaryPayment').textContent = paymentNames[paymentMethod.value] || paymentMethod.value;
}

async function placeOrder() {
    const nextBtn = document.getElementById('checkoutNext');
    const originalHTML = nextBtn.innerHTML;

    nextBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        Processing...
    `;
    nextBtn.disabled = true;

    try {
        const phone = document.getElementById('shippingPhone').value.trim();
        const address = document.getElementById('shippingAddress').value.trim();
        const notes = document.getElementById('shippingNotes').value.trim();
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

        // Combine phone and address for shipping info
        let shippingInfo = `${address}\nPhone: ${phone}`;
        if (notes) {
            shippingInfo += `\nNotes: ${notes}`;
        }

        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                payment_method: paymentMethod,
                shipping_address: shippingInfo
            })
        });

        const data = await response.json();

        if (data.success) {
            currentOrderData = data;

            // Check if payment requires proof upload
            if (data.requires_proof) {
                showProofUploadStep(data);
            } else {
                showOrderSuccess(data);
            }
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error placing order:', error);
        showToast(error.message || 'Error placing order', 'error');
        nextBtn.innerHTML = originalHTML;
        nextBtn.disabled = false;
    }
}

function showProofUploadStep(orderData) {
    // Show step 4 indicator
    document.querySelector('.step-line-proof').style.display = 'block';
    document.querySelector('.step-proof').style.display = 'flex';

    // Update step indicators - mark steps 1-3 as completed, step 4 as active
    document.querySelectorAll('.checkout-step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        const stepNum = parseInt(step.dataset.step);
        if (stepNum < 4) {
            step.classList.add('completed');
        } else if (stepNum === 4) {
            step.classList.add('active');
        }
    });

    // Hide other step contents, show step 4
    document.querySelectorAll('.checkout-step-content').forEach(c => {
        c.classList.remove('active');
        c.style.display = 'none';
    });

    const step4Content = document.getElementById('step4');
    step4Content.style.display = 'block';
    step4Content.classList.add('active');

    // Hide footer navigation (we use the submit button in step 4)
    document.querySelector('.checkout-modal-footer').style.display = 'none';

    // Populate order info
    document.getElementById('proofOrderNumber').textContent = `#${String(orderData.order_id).padStart(6, '0')}`;

    // Update total amount
    document.getElementById('proofTotalAmount').textContent = `₱${orderData.total.toFixed(2)}`;

    // Populate payment details with new card layout
    const paymentDetails = document.getElementById('proofPaymentDetails');

    let detailsHTML = '<div class="proof-payment-info">';

    switch (orderData.payment_method) {
        case 'gcash':
            detailsHTML += `
                <div class="proof-payment-row">
                    <span class="label">Method</span>
                    <span class="proof-method-badge gcash">GCash</span>
                </div>
                <div class="proof-payment-row">
                    <span class="label">Send to</span>
                    <span class="value copyable">0917 123 4567</span>
                </div>
                <div class="proof-payment-row">
                    <span class="label">Account Name</span>
                    <span class="value">HealthCart Inc.</span>
                </div>
            `;
            break;
        case 'maya':
            detailsHTML += `
                <div class="proof-payment-row">
                    <span class="label">Method</span>
                    <span class="proof-method-badge maya">Maya</span>
                </div>
                <div class="proof-payment-row">
                    <span class="label">Send to</span>
                    <span class="value copyable">0918 765 4321</span>
                </div>
                <div class="proof-payment-row">
                    <span class="label">Account Name</span>
                    <span class="value">HealthCart Inc.</span>
                </div>
            `;
            break;
        case 'bank_transfer':
            detailsHTML += `
                <div class="proof-payment-row">
                    <span class="label">Method</span>
                    <span class="proof-method-badge bank_transfer">Bank Transfer</span>
                </div>
                <div class="proof-payment-row">
                    <span class="label">Bank</span>
                    <span class="value">BDO Unibank</span>
                </div>
                <div class="proof-payment-row">
                    <span class="label">Account No.</span>
                    <span class="value copyable">1234 5678 9012</span>
                </div>
                <div class="proof-payment-row">
                    <span class="label">Account Name</span>
                    <span class="value">HealthCart Inc.</span>
                </div>
            `;
            break;
        case 'card':
            detailsHTML += `
                <div class="proof-payment-row">
                    <span class="label">Method</span>
                    <span class="proof-method-badge card">Card Payment</span>
                </div>
                <div class="proof-payment-row">
                    <span class="label">Reference</span>
                    <span class="value copyable">${orderData.reference_no || 'N/A'}</span>
                </div>
            `;
            break;
    }

    detailsHTML += '</div>';
    paymentDetails.innerHTML = detailsHTML;

    // Store payment ID for upload
    document.getElementById('step4').dataset.paymentId = orderData.payment_id;

    // Update cart count
    updateCartCount(0);
    cartData = { items: [], total: 0, count: 0 };
}

function showOrderSuccess(orderData) {
    // Hide step content and footer
    document.querySelectorAll('.checkout-step-content').forEach(c => {
        c.classList.remove('active');
        c.style.display = 'none';
    });
    document.querySelector('.checkout-modal-footer').style.display = 'none';
    document.querySelector('.checkout-steps').style.display = 'none';

    // Show success
    const successStep = document.getElementById('stepSuccess');
    successStep.style.display = 'block';
    successStep.classList.add('active');

    // Update order number
    const orderNumber = `#${String(orderData.order_id).padStart(6, '0')}`;
    document.getElementById('orderNumber').textContent = orderNumber;

    // Set appropriate message based on payment method
    const orderMessage = document.getElementById('orderMessage');

    if (orderData.payment_method === 'cod') {
        orderMessage.textContent = 'Please prepare the exact amount for payment upon delivery.';
    } else if (orderData.proof_uploaded) {
        orderMessage.textContent = 'Your payment proof has been submitted. We will verify it shortly.';
    } else {
        orderMessage.textContent = 'Thank you for shopping with us!';
    }

    // Reload notifications to show the new order notification from backend
    loadNotifications();

    // Update cart count
    updateCartCount(0);
    cartData = { items: [], total: 0, count: 0 };
}

function resetCheckoutForm() {
    // Reset step
    checkoutStep = 1;

    // Clear only notes (phone and address are pre-populated from session)
    document.getElementById('shippingNotes').value = '';

    // Reset payment method
    document.querySelector('input[name="paymentMethod"][value="cod"]').checked = true;
    handlePaymentMethodChange();

    // Show footer and steps
    document.querySelector('.checkout-modal-footer').style.display = 'flex';
    document.querySelector('.checkout-steps').style.display = 'flex';

    // Hide step 4 indicator
    document.querySelector('.step-line-proof').style.display = 'none';
    document.querySelector('.step-proof').style.display = 'none';

    // Hide success and step 4
    const successStep = document.getElementById('stepSuccess');
    successStep.style.display = 'none';
    successStep.classList.remove('active');

    const step4 = document.getElementById('step4');
    step4.style.display = 'none';
    step4.classList.remove('active');

    // Reset proof upload elements
    document.getElementById('uploadPreview').style.display = 'none';
    document.getElementById('uploadArea').style.display = 'flex';
    const submitBtn = document.getElementById('submitProofBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        Submit Payment Proof
    `;
    document.getElementById('proofImage').value = '';

    updateCheckoutUI();
}

// ================================
// PROOF UPLOAD
// ================================
function initProofUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const proofInput = document.getElementById('proofImage');
    const removePreviewBtn = document.getElementById('removePreview');
    const submitProofBtn = document.getElementById('submitProofBtn');
    const skipProofLink = document.getElementById('skipProofLink');

    if (uploadArea) {
        uploadArea.addEventListener('click', () => proofInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                handleProofFile(e.dataTransfer.files[0]);
            }
        });
    }

    if (proofInput) {
        proofInput.addEventListener('change', function() {
            if (this.files.length) {
                handleProofFile(this.files[0]);
            }
        });
    }

    if (removePreviewBtn) {
        removePreviewBtn.addEventListener('click', () => {
            document.getElementById('uploadPreview').style.display = 'none';
            document.getElementById('uploadArea').style.display = 'flex';
            document.getElementById('submitProofBtn').disabled = true;
            proofInput.value = '';
        });
    }

    if (submitProofBtn) {
        submitProofBtn.addEventListener('click', uploadProof);
    }

    // Skip proof link - go to success without uploading
    if (skipProofLink) {
        skipProofLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentOrderData) {
                showOrderSuccess(currentOrderData);
            }
        });
    }
}

function handleProofFile(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Please upload an image file', 'error');
        return;
    }

    if (file.size > 16 * 1024 * 1024) {
        showToast('File size must be less than 16MB', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('previewImage').src = e.target.result;
        document.getElementById('uploadPreview').style.display = 'block';
        document.getElementById('uploadArea').style.display = 'none';
        document.getElementById('submitProofBtn').disabled = false;
    };
    reader.readAsDataURL(file);
}

async function uploadProof() {
    const step4Section = document.getElementById('step4');
    const paymentId = step4Section.dataset.paymentId;
    const proofInput = document.getElementById('proofImage');
    const submitBtn = document.getElementById('submitProofBtn');

    if (!proofInput.files.length) {
        showToast('Please select a file', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('proof_image', proofInput.files[0]);
    formData.append('payment_id', paymentId);

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        Uploading...
    `;

    try {
        const response = await fetch('/api/payment/upload-proof', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showToast('Payment proof uploaded successfully!', 'success');

            // Update order data and show success
            if (currentOrderData) {
                currentOrderData.proof_uploaded = true;
                showOrderSuccess(currentOrderData);
            }
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error uploading proof:', error);
        showToast(error.message || 'Error uploading proof', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Submit Payment Proof
        `;
    }
}

// ================================
// ORDERS
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

// Simple debounce function
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
// LIST VIEW STYLES
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

// ================================
// PRODUCT MODAL
// ================================
function initProductModal() {
    const productModal = document.getElementById('productModal');
    const productModalOverlay = document.getElementById('productModalOverlay');
    const closeProductModalBtn = document.getElementById('closeProductModal');
    const modalQtyMinus = document.getElementById('modalQtyMinus');
    const modalQtyPlus = document.getElementById('modalQtyPlus');
    const modalQtyInput = document.getElementById('modalQty');
    const modalAddToCart = document.getElementById('modalAddToCart');

    // Click on product card to open modal
    document.querySelectorAll('.shop-product-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't open modal if clicking add to cart or wishlist
            if (e.target.closest('.add-to-cart-btn') || e.target.closest('.wishlist-btn')) {
                return;
            }
            const productId = this.dataset.productId;
            openProductModal(productId);
        });
    });

    // Close modal
    if (closeProductModalBtn) {
        closeProductModalBtn.addEventListener('click', closeProductModal);
    }
    if (productModalOverlay) {
        productModalOverlay.addEventListener('click', closeProductModal);
    }

    // Quantity controls
    if (modalQtyMinus) {
        modalQtyMinus.addEventListener('click', function() {
            let qty = parseInt(modalQtyInput.value) || 1;
            if (qty > 1) {
                modalQtyInput.value = qty - 1;
            }
        });
    }

    if (modalQtyPlus) {
        modalQtyPlus.addEventListener('click', function() {
            let qty = parseInt(modalQtyInput.value) || 1;
            const maxQty = currentProduct ? currentProduct.stock : 99;
            if (qty < maxQty) {
                modalQtyInput.value = qty + 1;
            }
        });
    }

    if (modalQtyInput) {
        modalQtyInput.addEventListener('change', function() {
            let qty = parseInt(this.value) || 1;
            const maxQty = currentProduct ? currentProduct.stock : 99;
            if (qty < 1) qty = 1;
            if (qty > maxQty) qty = maxQty;
            this.value = qty;
        });
    }

    // Add to cart from modal
    if (modalAddToCart) {
        modalAddToCart.addEventListener('click', function() {
            if (!currentProduct || currentProduct.stock <= 0) return;
            const qty = parseInt(modalQtyInput.value) || 1;
            addToCartFromModal(currentProduct.id, qty, this);
        });
    }

    // Close on escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && productModal.classList.contains('active')) {
            closeProductModal();
        }
    });
}

async function openProductModal(productId) {
    const productModal = document.getElementById('productModal');

    try {
        const response = await fetch(`/api/product/${productId}`);
        const data = await response.json();

        if (data.success) {
            currentProduct = data.product;
            populateProductModal(data.product);
            productModal.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Check wishlist status for the heart button
            checkProductWishlistStatus(productId);
        } else {
            showToast('Error loading product', 'error');
        }
    } catch (error) {
        console.error('Error loading product:', error);
        showToast('Error loading product', 'error');
    }
}

function closeProductModal() {
    const productModal = document.getElementById('productModal');
    productModal.classList.remove('active');
    document.body.style.overflow = '';
    currentProduct = null;
    document.getElementById('modalQty').value = 1;
}

function populateProductModal(product) {
    const placeholderImage = 'https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM=';

    document.getElementById('modalProductImage').src = product.imagepath || placeholderImage;
    document.getElementById('modalProductCategory').textContent = product.category_name || 'Uncategorized';
    document.getElementById('modalProductTitle').textContent = product.name;
    document.getElementById('modalProductDesc').textContent = product.description || 'No description available.';
    document.getElementById('modalProductPrice').textContent = `₱${product.price.toFixed(2)}`;

    // Stock status
    const stockEl = document.getElementById('modalProductStock');
    const badgeEl = document.getElementById('modalProductBadge');
    const addToCartBtn = document.getElementById('modalAddToCart');
    const qtySection = document.querySelector('.product-modal-quantity');

    badgeEl.className = 'product-modal-badge';
    badgeEl.textContent = '';

    if (product.stock === 0) {
        stockEl.textContent = 'Out of Stock';
        stockEl.className = 'product-modal-stock out-of-stock';
        badgeEl.textContent = 'Out of Stock';
        badgeEl.classList.add('out-of-stock');
        addToCartBtn.disabled = true;
        addToCartBtn.innerHTML = 'Out of Stock';
        qtySection.style.display = 'none';
    } else if (product.stock < 10) {
        stockEl.textContent = `Only ${product.stock} left`;
        stockEl.className = 'product-modal-stock low-stock';
        badgeEl.textContent = 'Low Stock';
        badgeEl.classList.add('low-stock');
        addToCartBtn.disabled = false;
        addToCartBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            Add to Cart
        `;
        qtySection.style.display = 'flex';
    } else {
        stockEl.textContent = `${product.stock} in stock`;
        stockEl.className = 'product-modal-stock in-stock';
        addToCartBtn.disabled = false;
        addToCartBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            Add to Cart
        `;
        qtySection.style.display = 'flex';
    }

    // Reset quantity
    document.getElementById('modalQty').value = 1;
    document.getElementById('modalQty').max = product.stock;
}

async function addToCartFromModal(productId, quantity, button) {
    const originalHTML = button.innerHTML;

    button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        Adding...
    `;
    button.disabled = true;

    try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ product_id: productId, quantity: quantity })
        });

        const data = await response.json();

        if (data.success) {
            button.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Added!
            `;
            button.style.background = '#059669';
            updateCartCount(data.count);
            showToast(`Added ${quantity} item(s) to cart`, 'success');

            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.style.background = '';
                button.disabled = false;
            }, 1500);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showToast(error.message || 'Error adding to cart', 'error');
        button.innerHTML = originalHTML;
        button.disabled = false;
    }
}

// ================================
// NOTIFICATIONS
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
// PROFILE MODAL
// ================================
function initProfileModal() {
    const profileModal = document.getElementById('profileModal');
    const profileModalOverlay = document.getElementById('profileModalOverlay');
    const closeProfileModalBtn = document.getElementById('closeProfileModal');
    const myProfileLink = document.getElementById('myProfileLink');
    const profileForm = document.getElementById('profileForm');

    // Open profile modal
    if (myProfileLink) {
        myProfileLink.addEventListener('click', function(e) {
            e.preventDefault();
            openProfileModal();
        });
    }

    // Close handlers
    if (closeProfileModalBtn) {
        closeProfileModalBtn.addEventListener('click', closeProfileModal);
    }
    if (profileModalOverlay) {
        profileModalOverlay.addEventListener('click', closeProfileModal);
    }

    // Save profile
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProfile();
        });
    }

    // Close on escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && profileModal && profileModal.classList.contains('active')) {
            closeProfileModal();
        }
    });
}

function openProfileModal() {
    const profileModal = document.getElementById('profileModal');
    if (profileModal) {
        profileModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Close profile dropdown
        const profileDropdown = document.querySelector('.profile-dropdown');
        if (profileDropdown) {
            profileDropdown.classList.remove('active');
        }
    }
}

function closeProfileModal() {
    const profileModal = document.getElementById('profileModal');
    if (profileModal) {
        profileModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

async function saveProfile() {
    const saveBtn = document.getElementById('saveProfileBtn');
    const phone = document.getElementById('profilePhone').value.trim();
    const address = document.getElementById('profileAddress').value.trim();

    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        Saving...
    `;

    try {
        const response = await fetch('/api/profile/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phone, address })
        });

        const data = await response.json();

        if (data.success) {
            showToast('Profile updated successfully!', 'success');

            // Update shipping form if it exists
            const shippingPhone = document.getElementById('shippingPhone');
            const shippingAddress = document.getElementById('shippingAddress');
            if (shippingPhone) shippingPhone.value = phone;
            if (shippingAddress) shippingAddress.value = address;

            closeProfileModal();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast(error.message || 'Error updating profile', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

// ================================
// WISHLIST FUNCTIONS
// ================================
let wishlistData = [];

async function openWishlist() {
    const wishlistModal = document.getElementById('wishlistModal');
    const wishlistItems = document.getElementById('wishlistItems');
    const wishlistFooter = document.getElementById('wishlistFooter');

    wishlistModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Show loading
    wishlistItems.innerHTML = `
        <div class="wishlist-loading">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            <p>Loading wishlist...</p>
        </div>
    `;
    wishlistFooter.style.display = 'none';

    try {
        const response = await fetch('/api/wishlist');
        const data = await response.json();

        if (data.success) {
            wishlistData = data.items;
            renderWishlist(data.items);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error loading wishlist:', error);
        wishlistItems.innerHTML = `
            <div class="wishlist-empty">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <h3>Error loading wishlist</h3>
                <p>Please try again later</p>
            </div>
        `;
    }
}

function closeWishlist() {
    const wishlistModal = document.getElementById('wishlistModal');
    wishlistModal.classList.remove('active');
    document.body.style.overflow = '';
}

function renderWishlist(items) {
    const wishlistItems = document.getElementById('wishlistItems');
    const wishlistFooter = document.getElementById('wishlistFooter');
    const wishlistItemCount = document.getElementById('wishlistItemCount');

    if (items.length === 0) {
        wishlistItems.innerHTML = `
            <div class="wishlist-empty">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <h3>Your wishlist is empty</h3>
                <p>Save items you love by clicking the heart icon</p>
                <button class="btn btn-primary" onclick="closeWishlist()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    Browse Products
                </button>
            </div>
        `;
        wishlistFooter.style.display = 'none';
        return;
    }

    wishlistItems.innerHTML = `
        <div class="wishlist-items-grid">
            ${items.map(item => `
                <div class="wishlist-item" data-product-id="${item.product_id}">
                    <div class="wishlist-item-image">
                        <img src="${item.imagepath || 'https://via.placeholder.com/100'}" alt="${item.name}">
                    </div>
                    <div class="wishlist-item-details">
                        <span class="wishlist-item-category">${item.category || 'Healthcare'}</span>
                        <h4 class="wishlist-item-name">${item.name}</h4>
                        <span class="wishlist-item-price">₱${item.price.toFixed(2)}</span>
                        <span class="wishlist-item-stock ${item.stock > 0 ? 'in-stock' : 'out-of-stock'}">
                            ${item.stock > 0 ? `In Stock (${item.stock} available)` : 'Out of Stock'}
                        </span>
                    </div>
                    <div class="wishlist-item-actions">
                        <button class="btn btn-primary btn-sm" onclick="moveToCart(${item.product_id})" ${item.stock <= 0 ? 'disabled' : ''}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            Add to Cart
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="removeFromWishlist(${item.product_id})">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            Remove
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Show footer
    wishlistFooter.style.display = 'flex';
    wishlistItemCount.textContent = `${items.length} item${items.length > 1 ? 's' : ''}`;
}

async function loadWishlistCount() {
    try {
        const response = await fetch('/api/wishlist/count');
        const data = await response.json();

        if (data.success) {
            updateWishlistBadge(data.count);
        }
    } catch (error) {
        console.error('Error loading wishlist count:', error);
    }
}

function updateWishlistBadge(count) {
    const badge = document.getElementById('wishlistBadge');
    if (!badge) return;

    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

async function toggleWishlist(productId, buttonElement) {
    try {
        const response = await fetch('/api/wishlist/toggle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ product_id: productId })
        });

        const data = await response.json();

        if (data.success) {
            // Update button state
            if (buttonElement) {
                if (data.in_wishlist) {
                    buttonElement.classList.add('wishlist-active');
                    buttonElement.querySelector('svg').style.fill = '#ef4444';
                    buttonElement.querySelector('svg').style.stroke = '#ef4444';
                } else {
                    buttonElement.classList.remove('wishlist-active');
                    buttonElement.querySelector('svg').style.fill = 'none';
                    buttonElement.querySelector('svg').style.stroke = '';
                }
            }

            // Update badge
            loadWishlistCount();

            showToast(data.message, data.in_wishlist ? 'success' : 'info');
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error toggling wishlist:', error);
        showToast(error.message || 'Error updating wishlist', 'error');
    }
}

async function removeFromWishlist(productId) {
    try {
        const response = await fetch('/api/wishlist/remove', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ product_id: productId })
        });

        const data = await response.json();

        if (data.success) {
            // Remove from local data and re-render
            wishlistData = wishlistData.filter(item => item.product_id !== productId);
            renderWishlist(wishlistData);
            loadWishlistCount();
            showToast('Removed from wishlist', 'info');
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        showToast(error.message || 'Error removing item', 'error');
    }
}

async function moveToCart(productId) {
    try {
        const response = await fetch('/api/wishlist/move-to-cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ product_id: productId })
        });

        const data = await response.json();

        if (data.success) {
            // Remove from local data and re-render
            wishlistData = wishlistData.filter(item => item.product_id !== productId);
            renderWishlist(wishlistData);
            loadWishlistCount();
            updateCartCount(data.cart_count);
            showToast(data.message, 'success');
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error moving to cart:', error);
        showToast(error.message || 'Error moving item to cart', 'error');
    }
}

async function addAllWishlistToCart() {
    const inStockItems = wishlistData.filter(item => item.stock > 0);

    if (inStockItems.length === 0) {
        showToast('No items in stock to add', 'warning');
        return;
    }

    const addAllBtn = document.getElementById('addAllToCart');
    const originalHTML = addAllBtn.innerHTML;
    addAllBtn.disabled = true;
    addAllBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        Adding...
    `;

    let successCount = 0;
    let failCount = 0;

    for (const item of inStockItems) {
        try {
            const response = await fetch('/api/wishlist/move-to-cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ product_id: item.product_id })
            });

            const data = await response.json();

            if (data.success) {
                successCount++;
                wishlistData = wishlistData.filter(i => i.product_id !== item.product_id);
                if (data.cart_count) {
                    updateCartCount(data.cart_count);
                }
            } else {
                failCount++;
            }
        } catch (error) {
            failCount++;
        }
    }

    renderWishlist(wishlistData);
    loadWishlistCount();

    addAllBtn.disabled = false;
    addAllBtn.innerHTML = originalHTML;

    if (successCount > 0) {
        showToast(`${successCount} item${successCount > 1 ? 's' : ''} added to cart!`, 'success');
    }
    if (failCount > 0) {
        showToast(`${failCount} item${failCount > 1 ? 's' : ''} could not be added`, 'error');
    }
}

// Check wishlist status when opening product modal
async function checkProductWishlistStatus(productId) {
    try {
        const response = await fetch(`/api/wishlist/check/${productId}`);
        const data = await response.json();

        const modalWishlistBtn = document.getElementById('modalWishlist');
        if (modalWishlistBtn && data.success) {
            modalWishlistBtn.dataset.productId = productId;
            if (data.in_wishlist) {
                modalWishlistBtn.classList.add('wishlist-active');
                modalWishlistBtn.querySelector('svg').style.fill = '#ef4444';
                modalWishlistBtn.querySelector('svg').style.stroke = '#ef4444';
            } else {
                modalWishlistBtn.classList.remove('wishlist-active');
                modalWishlistBtn.querySelector('svg').style.fill = 'none';
                modalWishlistBtn.querySelector('svg').style.stroke = '';
            }
        }
    } catch (error) {
        console.error('Error checking wishlist status:', error);
    }
}
