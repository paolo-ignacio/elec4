// ================================
// PROFILE MODAL FUNCTIONALITY
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
