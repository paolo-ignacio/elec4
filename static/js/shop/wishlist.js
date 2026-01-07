// ================================
// WISHLIST FUNCTIONALITY
// ================================

let wishlistData = [];

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
