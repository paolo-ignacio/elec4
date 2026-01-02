// ================================
// MODAL FUNCTIONS
// ================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Focus first input
        setTimeout(() => {
            const firstInput = modal.querySelector('input:not([type="hidden"])');
            if (firstInput) firstInput.focus();
        }, 100);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Reset forms
        const form = modal.querySelector('form');
        if (form) form.reset();
        // Reset password strength
        resetPasswordStrength();
    }
}

function switchModal(closeModalId, openModalId) {
    closeModal(closeModalId);
    setTimeout(() => {
        openModal(openModalId);
    }, 150);
}

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            activeModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
});

// ================================
// PASSWORD TOGGLE
// ================================
function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const eyeOpen = button.querySelector('.eye-open');
    const eyeClosed = button.querySelector('.eye-closed');

    if (input.type === 'password') {
        input.type = 'text';
        eyeOpen.style.display = 'none';
        eyeClosed.style.display = 'block';
    } else {
        input.type = 'password';
        eyeOpen.style.display = 'block';
        eyeClosed.style.display = 'none';
    }
}

// ================================
// PASSWORD STRENGTH INDICATOR
// ================================
function checkPasswordStrength(password) {
    let strength = 0;
    const requirements = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /[0-9]/.test(password)
    };

    // Count met requirements
    if (requirements.length) strength++;
    if (requirements.upper) strength++;
    if (requirements.lower) strength++;
    if (requirements.number) strength++;

    return { strength, requirements };
}

function updatePasswordStrength(password) {
    const strengthEl = document.getElementById('password-strength');
    const strengthText = strengthEl.querySelector('.strength-text');
    const { strength, requirements } = checkPasswordStrength(password);

    // Remove all strength classes
    strengthEl.classList.remove('weak', 'fair', 'good', 'strong');

    // Update requirement indicators
    updateRequirement('req-length', requirements.length);
    updateRequirement('req-upper', requirements.upper);
    updateRequirement('req-lower', requirements.lower);
    updateRequirement('req-number', requirements.number);

    if (password.length === 0) {
        strengthText.textContent = 'Password strength';
        return;
    }

    // Set strength class and text
    if (strength <= 1) {
        strengthEl.classList.add('weak');
        strengthText.textContent = 'Weak';
    } else if (strength === 2) {
        strengthEl.classList.add('fair');
        strengthText.textContent = 'Fair';
    } else if (strength === 3) {
        strengthEl.classList.add('good');
        strengthText.textContent = 'Good';
    } else {
        strengthEl.classList.add('strong');
        strengthText.textContent = 'Strong';
    }
}

function updateRequirement(id, isValid) {
    const el = document.getElementById(id);
    if (!el) return;

    const icon = el.querySelector('.req-icon');
    if (isValid) {
        el.classList.add('valid');
        icon.textContent = '✓';
    } else {
        el.classList.remove('valid');
        icon.textContent = '○';
    }
}

function resetPasswordStrength() {
    const strengthEl = document.getElementById('password-strength');
    if (strengthEl) {
        strengthEl.classList.remove('weak', 'fair', 'good', 'strong');
        const strengthText = strengthEl.querySelector('.strength-text');
        if (strengthText) strengthText.textContent = 'Password strength';
    }

    ['req-length', 'req-upper', 'req-lower', 'req-number'].forEach(id => {
        updateRequirement(id, false);
    });

    const matchEl = document.getElementById('password-match');
    if (matchEl) {
        matchEl.textContent = '';
        matchEl.classList.remove('match', 'no-match');
    }
}

// ================================
// PASSWORD MATCH CHECK
// ================================
function checkPasswordMatch() {
    const password = document.getElementById('reg-password');
    const confirm = document.getElementById('reg-confirm');
    const matchEl = document.getElementById('password-match');

    if (!password || !confirm || !matchEl) return;

    if (confirm.value.length === 0) {
        matchEl.textContent = '';
        matchEl.classList.remove('match', 'no-match');
        return;
    }

    if (password.value === confirm.value) {
        matchEl.textContent = '✓';
        matchEl.classList.add('match');
        matchEl.classList.remove('no-match');
    } else {
        matchEl.textContent = '✗';
        matchEl.classList.add('no-match');
        matchEl.classList.remove('match');
    }
}

// ================================
// FORM VALIDATION & LOADING
// ================================
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showInputError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    if (input && error) {
        input.style.borderColor = '#ef4444';
        error.textContent = message;
    }
}

function clearInputError(inputId, errorId) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    if (input && error) {
        input.style.borderColor = '';
        error.textContent = '';
    }
}

function setButtonLoading(buttonId, loading) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    if (loading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

// ================================
// EVENT LISTENERS
// ================================
document.addEventListener('DOMContentLoaded', function() {
    // Password strength on register form
    const regPassword = document.getElementById('reg-password');
    if (regPassword) {
        regPassword.addEventListener('input', function() {
            updatePasswordStrength(this.value);
        });
    }

    // Password match check
    const regConfirm = document.getElementById('reg-confirm');
    if (regConfirm) {
        regConfirm.addEventListener('input', checkPasswordMatch);
    }
    if (regPassword) {
        regPassword.addEventListener('input', checkPasswordMatch);
    }

    // Email validation on blur
    const loginEmail = document.getElementById('login-email');
    if (loginEmail) {
        loginEmail.addEventListener('blur', function() {
            if (this.value && !validateEmail(this.value)) {
                showInputError('login-email', 'login-email-error', 'Please enter a valid email');
            } else {
                clearInputError('login-email', 'login-email-error');
            }
        });
    }

    const regEmail = document.getElementById('reg-email');
    if (regEmail) {
        regEmail.addEventListener('blur', function() {
            if (this.value && !validateEmail(this.value)) {
                showInputError('reg-email', 'reg-email-error', 'Please enter a valid email');
            } else {
                clearInputError('reg-email', 'reg-email-error');
            }
        });
    }

    // Form submission with loading state
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function() {
            setButtonLoading('loginBtn', true);
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function() {
            setButtonLoading('registerBtn', true);
        });
    }
});

// ================================
// MOBILE NAVIGATION
// ================================
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking a link
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }
});

// ================================
// FLASH MESSAGE AUTO-DISMISS
// ================================
document.addEventListener('DOMContentLoaded', function() {
    const flashMessages = document.querySelectorAll('.flash-message');

    flashMessages.forEach(message => {
        setTimeout(() => {
            message.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                message.remove();
            }, 300);
        }, 5000);
    });
});

// Add slideOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ================================
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const navHeight = document.querySelector('.navbar').offsetHeight;
                    const targetPosition = target.offsetTop - navHeight;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
});

// ================================
// ADD TO CART (Placeholder)
// ================================
document.addEventListener('DOMContentLoaded', function() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart');

    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.productId;

            // Add animation feedback
            const originalHTML = this.innerHTML;
            this.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Added';
            this.style.backgroundColor = '#059669';

            setTimeout(() => {
                this.innerHTML = originalHTML;
                this.style.backgroundColor = '';
            }, 1500);

            // Update cart count
            const cartCount = document.querySelector('.cart-count');
            if (cartCount) {
                const currentCount = parseInt(cartCount.textContent) || 0;
                cartCount.textContent = currentCount + 1;
            }

            console.log('Added product to cart:', productId);
        });
    });
});

// ================================
// NAVBAR SCROLL EFFECT
// ================================
document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
        }
    });
});

// ================================
// NEWSLETTER FORM (Placeholder)
// ================================
document.addEventListener('DOMContentLoaded', function() {
    const newsletterForm = document.querySelector('.newsletter-form');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;

            // Show success message
            const button = this.querySelector('button');
            const originalText = button.textContent;
            button.textContent = 'Subscribed!';
            button.disabled = true;

            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
                this.reset();
            }, 2000);

            console.log('Newsletter subscription:', email);
        });
    }
});

// ================================
// WISHLIST TOGGLE
// ================================
document.addEventListener('DOMContentLoaded', function() {
    const wishlistButtons = document.querySelectorAll('.product-wishlist');

    wishlistButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            this.classList.toggle('active');

            if (this.classList.contains('active')) {
                this.style.backgroundColor = '#ef4444';
                this.querySelector('svg').style.stroke = 'white';
                this.querySelector('svg').style.fill = 'white';
            } else {
                this.style.backgroundColor = 'white';
                this.querySelector('svg').style.stroke = 'currentColor';
                this.querySelector('svg').style.fill = 'none';
            }
        });
    });
});
