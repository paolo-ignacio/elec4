// ================================
// PRODUCT MODAL FUNCTIONALITY
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

    // Checkout from modal - add to cart then go to checkout
    const modalCheckoutBtn = document.getElementById('modalCheckout');
    if (modalCheckoutBtn) {
        modalCheckoutBtn.addEventListener('click', function() {
            if (!currentProduct || currentProduct.stock <= 0) return;
            const qty = parseInt(modalQtyInput.value) || 1;
            checkoutFromModal(currentProduct.id, qty, this);
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
    const checkoutBtn = document.getElementById('modalCheckout');
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
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.style.display = 'none';
        }
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
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.style.display = 'inline-flex';
        }
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
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.style.display = 'inline-flex';
        }
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

// Checkout directly from product modal
async function checkoutFromModal(productId, quantity, button) {
    const originalHTML = button.innerHTML;

    button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        Processing...
    `;
    button.disabled = true;

    try {
        // First add to cart
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ product_id: productId, quantity: quantity })
        });

        const data = await response.json();

        if (data.success) {
            // Update cart count
            updateCartCount(data.count);

            // Reload cart data
            await loadCart();

            // Close the product modal
            closeProductModal();

            // Open checkout
            openCheckout();

            button.innerHTML = originalHTML;
            button.disabled = false;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error during checkout:', error);
        showToast(error.message || 'Error processing checkout', 'error');
        button.innerHTML = originalHTML;
        button.disabled = false;
    }
}
