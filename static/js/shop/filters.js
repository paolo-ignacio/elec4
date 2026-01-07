// ================================
// FILTERS & SEARCH FUNCTIONALITY
// ================================

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
