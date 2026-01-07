// ================================
// CHECKOUT FUNCTIONALITY
// ================================

let checkoutStep = 1;
let currentOrderData = null;

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

    if (selectedMethod === 'Cash on Delivery') {
        paymentDetails.style.display = 'none';
    } else {
        paymentDetails.style.display = 'block';

        let instructions = '';
        switch (selectedMethod) {
            case 'GCash':
                instructions = `
                    <p>Send payment to:</p>
                    <p class="payment-account"><strong>GCash Number:</strong> 0917 123 4567</p>
                    <p class="payment-account"><strong>Account Name:</strong> HealthCart Inc.</p>
                    <p class="payment-note">Please upload your payment screenshot after placing the order.</p>
                `;
                break;
            case 'PayPal':
                instructions = `
                    <p>Send payment to:</p>
                    <p class="payment-account"><strong>PayPal Email:</strong> payments@healthcart.com</p>
                    <p class="payment-note">Please upload your payment confirmation after placing the order.</p>
                `;
                break;
            case 'Credit Card':
            case 'Debit Card':
                instructions = `
                    <p>Card payment will be processed securely.</p>
                    <p class="payment-note">You will receive a confirmation email after payment.</p>
                `;
                break;
            case 'Bank Transfer':
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

    // Payment - values now match database enum directly
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
    document.getElementById('summaryPayment').textContent = paymentMethod.value;
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
        case 'GCash':
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
        case 'PayPal':
            detailsHTML += `
                <div class="proof-payment-row">
                    <span class="label">Method</span>
                    <span class="proof-method-badge paypal">PayPal</span>
                </div>
                <div class="proof-payment-row">
                    <span class="label">Send to</span>
                    <span class="value copyable">payments@healthcart.com</span>
                </div>
            `;
            break;
        case 'Bank Transfer':
            detailsHTML += `
                <div class="proof-payment-row">
                    <span class="label">Method</span>
                    <span class="proof-method-badge bank">Bank Transfer</span>
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
        case 'Credit Card':
        case 'Debit Card':
            detailsHTML += `
                <div class="proof-payment-row">
                    <span class="label">Method</span>
                    <span class="proof-method-badge card">${orderData.payment_method}</span>
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

    if (orderData.payment_method === 'Cash on Delivery') {
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
    document.querySelector('input[name="paymentMethod"][value="Cash on Delivery"]').checked = true;
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
