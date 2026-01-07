// ================================
// CART FUNCTIONALITY
// ================================

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
        <div class="cart-item" data-item-id="${item.id}" data-stock="${item.stock}">
            <div class="cart-item-image">
                <img src="${item.imagepath || 'https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM='}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
                <h4 class="cart-item-name">${item.name}</h4>
                <span class="cart-item-price">₱${item.price.toFixed(2)}</span>
                <div class="cart-item-quantity">
                    <button class="qty-btn cart-qty-minus" data-item-id="${item.id}">-</button>
                    <input type="number" class="cart-qty-input" data-item-id="${item.id}" value="${item.quantity}" min="1" max="${item.stock}">
                    <button class="qty-btn cart-qty-plus" data-item-id="${item.id}" ${item.quantity >= item.stock ? 'disabled' : ''}>+</button>
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

    // Add event listeners for cart quantity controls
    initCartQuantityControls();
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

// Initialize cart quantity controls (minus, plus, input)
function initCartQuantityControls() {
    const cartItemsContainer = document.getElementById('cartItems');
    if (!cartItemsContainer) return;

    // Minus buttons
    cartItemsContainer.querySelectorAll('.cart-qty-minus').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = parseInt(this.dataset.itemId);
            const input = this.nextElementSibling;
            let qty = parseInt(input.value) || 1;
            if (qty > 1) {
                updateItemQuantity(itemId, qty - 1);
            } else {
                removeCartItem(itemId);
            }
        });
    });

    // Plus buttons
    cartItemsContainer.querySelectorAll('.cart-qty-plus').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = parseInt(this.dataset.itemId);
            const input = this.previousElementSibling;
            const maxStock = parseInt(input.max) || 99;
            let qty = parseInt(input.value) || 1;
            if (qty < maxStock) {
                updateItemQuantity(itemId, qty + 1);
            }
        });
    });

    // Input change
    cartItemsContainer.querySelectorAll('.cart-qty-input').forEach(input => {
        let debounceTimer;

        input.addEventListener('change', function() {
            const itemId = parseInt(this.dataset.itemId);
            const maxStock = parseInt(this.max) || 99;
            let qty = parseInt(this.value) || 1;

            // Validate quantity
            if (qty < 1) qty = 1;
            if (qty > maxStock) qty = maxStock;
            this.value = qty;

            updateItemQuantity(itemId, qty);
        });

        // Also handle input event with debounce for typing
        input.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const itemId = parseInt(this.dataset.itemId);
                const maxStock = parseInt(this.max) || 99;
                let qty = parseInt(this.value) || 1;

                if (qty < 1) qty = 1;
                if (qty > maxStock) qty = maxStock;
                this.value = qty;

                updateItemQuantity(itemId, qty);
            }, 500);
        });
    });
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
