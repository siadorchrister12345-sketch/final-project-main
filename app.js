/* CHANGELOG: Audited and optimized GearVault; existing data keys and object shapes preserved. */
// NOTE: Client-side passwords are demo-only, not production authentication.

// --- EVENT-DRIVEN PROGRAMMING PROJECT: GearVault ---
// Group 3 | 31-ITE-07

document.addEventListener('DOMContentLoaded', () => {
    // Current Logged-in User State
    const THEME_KEY = 'gearVault_settings';
    const MAX_ACTIVITIES = 30;

    function readStorage(key, fallback = null) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return value === null ? fallback : value;
        } catch (e) {
            return fallback;
        }
    }

    function loadUsers() {
        const users = readStorage('gearVault_users', []);
        return Array.isArray(users) ? users : [];
    }

    function persistUsers(users) {
        try {
            localStorage.setItem('gearVault_users', JSON.stringify(users));
            return true;
        } catch (e) {
            notify('Storage is full. Remove large uploaded images or export a backup, then try again.');
            return false;
        }
    }

    function persistSession() {
        try {
            localStorage.setItem('gearVault_currentUser', JSON.stringify(currentUser));
            return true;
        } catch (e) {
            notify('Storage is full. Remove large uploaded images or export a backup, then try again.');
            return false;
        }
    }

    let currentUser = readStorage('gearVault_currentUser');
    // Remember the email the session was loaded with so profile edits can update
    // the matching account record instead of creating a duplicate one.
    let currentUserKey = currentUser ? currentUser.email : null;

    // DOM Elements - Navigation & Views
    const sidebarNav = document.getElementById('sidebar-nav');
    const navLinks = document.querySelectorAll('.nav-link');
    const viewSections = document.querySelectorAll('.view-section');
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    function closeMobileMenu() {
        document.body.classList.remove('mobile-menu-open');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        mobileMenuToggle.setAttribute('aria-label', 'Open navigation');
    }
    mobileMenuToggle.addEventListener('click', () => {
        const open = document.body.classList.toggle('mobile-menu-open');
        mobileMenuToggle.setAttribute('aria-expanded', String(open));
        mobileMenuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    [document.getElementById('mobile-menu-backdrop')].forEach(button => {
        button.addEventListener('click', () => {
            closeMobileMenu();
            mobileMenuToggle.focus();
        });
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && document.body.classList.contains('mobile-menu-open')) {
            closeMobileMenu();
            mobileMenuToggle.focus();
        }
        if (event.key === 'Tab' && document.body.classList.contains('mobile-menu-open')) {
            const controls = [...sidebarNav.querySelectorAll('button, a[href]')];
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    });
    window.matchMedia('(max-width: 980px)').addEventListener('change', closeMobileMenu);

    // Auth DOM Elements
    const loginBox = document.getElementById('login-box');
    const signupBox = document.getElementById('signup-box');
    const authOverlay = document.getElementById('landing-auth');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const toSignupLink = document.getElementById('to-signup');
    const toLoginLink = document.getElementById('to-login');
    const logoutBtn = document.getElementById('logout-btn');

    // App DOM Elements
    const openModalBtn = document.getElementById('open-modal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');
    const gearModal = document.getElementById('gear-modal');
    const statusChoiceModal = document.getElementById('status-choice-modal');
    const gearForm = document.getElementById('gear-form');
    const gearPurchaseDateInput = document.getElementById('gear-purchase-date');
    const gearWarrantyMonthsInput = document.getElementById('gear-warranty-months');
    const inventoryTableBody = document.getElementById('inventory-table-body');
    const wishlistGrid = document.getElementById('wishlist-grid');
    const searchInput = document.getElementById('search-input') || document.getElementById('inventory-search-input');
    const categoryFilter = document.getElementById('category-filter') || document.getElementById('inventory-category-filter');
    const clearSearchBtn = document.getElementById('clear-search');
    const dashboardStatusChoice = document.getElementById('dashboard-status-choice');
    const dashboardAddBtn = document.getElementById('dashboard-add-btn');
    const inventorySearchInput = document.getElementById('inventory-search-input');
    const inventoryCategoryFilter = document.getElementById('inventory-category-filter');
    const clearInventorySearchBtn = document.getElementById('clear-inventory-search');
    const inventoryStatusChoice = document.getElementById('inventory-status-choice');
    const inventoryAddBtn = document.getElementById('inventory-add-btn');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const settingsClearBtn = document.getElementById('settings-clear-btn');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const notificationsToggle = document.getElementById('notifications-toggle');
    const exportBtn = document.getElementById('export-btn');
    const backupExportBtn = document.getElementById('backup-export-btn');
    const backupImportBtn = document.getElementById('backup-import-btn');
    const backupFileInput = document.getElementById('backup-file-input');
    const saveAccountBtn = document.getElementById('save-account-btn');
    const moveAllInventoryBtn = document.getElementById('move-all-inventory-btn');

    // Projects & Tasks DOM Elements
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskDueDateInput = document.getElementById('task-due-date');
    const taskRepeatInput = document.getElementById('task-repeat');
    const taskList = document.getElementById('task-list');
    const careRemindersList = document.getElementById('care-reminders-list');
    const projectForm = document.getElementById('project-form');
    const projectNameInput = document.getElementById('project-name-input');
    const projectTypeInput = document.getElementById('project-type-input');
    const projectDescriptionInput = document.getElementById('project-description-input');
    const projectBudgetInput = document.getElementById('project-budget-input');
    const projectTargetDateInput = document.getElementById('project-target-date-input');

    // Build & Audio Tools DOM Elements
    const psuCapacityInput = document.getElementById('psu-capacity-input');
    const savePsuBtn = document.getElementById('save-psu-btn');
    const enclosureForm = document.getElementById('enclosure-form');
    const enclosureResult = document.getElementById('enclosure-result');
    const portTuningForm = document.getElementById('port-tuning-form');
    const portTuningResult = document.getElementById('port-tuning-result');

    // Keep the activity log available even for accounts saved by older versions
    function logActivity(message) {
        if (!currentUser) return;
        if (!Array.isArray(currentUser.activities)) currentUser.activities = [];
        currentUser.activities = [message, ...currentUser.activities].slice(0, MAX_ACTIVITIES);
    }

    // Escape user-supplied text before it is written with innerHTML
    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[char]);
    }

    function parseDateOnly(value) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
        if (!match) return null;
        const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        return date.getFullYear() === Number(match[1])
            && date.getMonth() === Number(match[2]) - 1
            && date.getDate() === Number(match[3]) ? date : null;
    }

    function formatDateOnly(value) {
        const date = parseDateOnly(value);
        return date ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
    }

    function localDateString(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function dateDifferenceInDays(dateString, referenceDate = new Date()) {
        const date = parseDateOnly(dateString);
        if (!date) return null;
        const target = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
        const today = Date.UTC(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
        return Math.round((target - today) / 86400000);
    }

    function addMonthsToDate(dateString, months) {
        const date = parseDateOnly(dateString);
        if (!date || !Number.isInteger(months) || months < 1) return '';
        const monthIndex = date.getMonth() + months;
        const year = date.getFullYear() + Math.floor(monthIndex / 12);
        const month = monthIndex % 12;
        const day = Math.min(date.getDate(), new Date(year, month + 1, 0).getDate());
        return localDateString(new Date(year, month, day));
    }

    function getNextRepeatDate(dateString, repeat, occurrence = 1) {
        const date = parseDateOnly(dateString);
        if (!date || !Number.isInteger(occurrence) || occurrence < 1) return '';
        if (repeat === 'weekly') {
            date.setDate(date.getDate() + 7 * occurrence);
            return localDateString(date);
        }
        const monthsByRepeat = { monthly: 1, quarterly: 3, semiannual: 6, yearly: 12 };
        const months = monthsByRepeat[repeat];
        return Number.isInteger(months) ? addMonthsToDate(dateString, months * occurrence) : '';
    }

    function getRepeatLabel(repeat) {
        return ({
            weekly: 'Repeats weekly',
            monthly: 'Repeats monthly',
            quarterly: 'Repeats every 3 months',
            semiannual: 'Repeats every 6 months',
            yearly: 'Repeats yearly'
        })[repeat] || '';
    }

    function getWarrantyExpiry(item) {
        const months = Number(item.warrantyMonths);
        if (!parseDateOnly(item.purchaseDate) || !Number.isInteger(months) || months < 1 || months > 240) return '';
        return addMonthsToDate(item.purchaseDate, months);
    }

    function getDueDateLabel(dateString, kind) {
        const days = dateDifferenceInDays(dateString);
        if (days === null) return null;
        if (days < 0) {
            const count = Math.abs(days);
            return {
                days,
                text: kind === 'warranty'
                    ? `Expired ${count} day${count === 1 ? '' : 's'} ago`
                    : `Overdue by ${count} day${count === 1 ? '' : 's'}`,
                className: 'is-overdue'
            };
        }
        if (days === 0) {
            return {
                days,
                text: kind === 'warranty' ? 'Expires today' : 'Due today',
                className: 'is-due-soon'
            };
        }
        return {
            days,
            text: kind === 'warranty' ? `Expires in ${days} day${days === 1 ? '' : 's'}` : `Due in ${days} day${days === 1 ? '' : 's'}`,
            className: days <= 14 ? 'is-due-soon' : ''
        };
    }

    function loadSettings() {
        const settings = readStorage(THEME_KEY, {});
        return settings && typeof settings === 'object' && !Array.isArray(settings) ? settings : {};
    }

    function saveSettings(settings) {
        try {
            localStorage.setItem(THEME_KEY, JSON.stringify(settings));
        } catch (e) {
            // Preferences are optional; the app still works if storage is full.
        }
    }

    function notificationsEnabled() {
        return loadSettings().notifications !== false;
    }

    function notify(message) {
        if (!notificationsEnabled()) return;
        const stack = document.getElementById('toast-stack');
        if (!stack) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        stack.appendChild(toast);
        window.setTimeout(() => {
            toast.classList.add('is-leaving');
            window.setTimeout(() => toast.remove(), 250);
        }, 2600);
    }

    // Restore the saved theme and notification preferences on startup
    function applyTheme(isDark) {
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        document.body.classList.toggle('dark-mode', isDark);
    }

    function restoreTheme() {
        const settings = loadSettings();
        const isDark = settings.darkMode === true;
        applyTheme(isDark);
        darkModeToggle.checked = isDark;
        notificationsToggle.checked = settings.notifications !== false;
    }

    // Loads the application and initializes its features
    function init() {
        restoreTheme();
        checkAuthState();
    }

    // Initialize UI Based on Auth State
    function checkAuthState() {
        closeMobileMenu();
        document.body.classList.toggle('auth-page', !currentUser);
        if (currentUser) {
            if (!currentUser.psuCapacity) currentUser.psuCapacity = 650;
            currentUserKey = currentUser.email;
            sidebarNav.style.display = 'flex';
            loginView.classList.remove('active');
            dashboardView.classList.add('active');
            navLinks.forEach(link => link.classList.toggle('active', link.dataset.target === 'dashboard-view'));

            document.getElementById('settings-name').value = currentUser.name || '';
            document.getElementById('settings-email').value = currentUser.email || '';
            document.getElementById('user-display-name').textContent = currentUser.name || currentUser.email;
            document.getElementById('sidebar-user-name').textContent = currentUser.name || currentUser.email;
            document.getElementById('account-initial').textContent = (currentUser.name || currentUser.email || 'U').charAt(0).toUpperCase();
            psuCapacityInput.value = currentUser.psuCapacity;

            renderAll();
        } else {
            currentUserKey = null;
            sidebarNav.style.display = 'none';
            navLinks.forEach(link => link.classList.remove('active'));
            viewSections.forEach(sec => sec.classList.remove('active'));
            loginView.classList.add('active');
        }
    }

    // The auth form is displayed inline on the landing page.
    function showAuthMode(mode, focusField = false) {
        const isSignup = mode === 'signup';
        authOverlay.dataset.mode = mode;

        if (loginBox) {
            loginBox.hidden = isSignup;
            loginBox.classList.toggle('active', !isSignup);
        }
        if (signupBox) {
            signupBox.hidden = !isSignup;
            signupBox.classList.toggle('active', isSignup);
        }

        if (focusField) {
            const field = document.getElementById(isSignup ? 'signup-name' : 'login-email');
            if (field) window.requestAnimationFrame(() => field.focus({ preventScroll: true }));
        }
    }

    toSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthMode('signup', true);
    });

    toLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthMode('login', true);
    });

    // Signup Form Event
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-pass').value;

        let users = loadUsers();
        if (users.some(u => u.email === email)) {
            notify('An account with this email already exists.');
            return;
        }

        const newUser = {
            name,
            email,
            password,
            psuCapacity: 650,
            items: [],
            tasks: [],
            projects: [],
            activities: []
        };

        users.push(newUser);
        if (!persistUsers(users)) return;

        currentUser = newUser;
        persistSession();
        signupForm.reset();
        checkAuthState();
        notify(`Welcome to GearVault, ${name}!`);
    });

    // Login Form Event
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const identifier = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-pass').value;

        const users = loadUsers();
        const user = users.find(u => (u.email === identifier || u.name === identifier) && u.password === password);

        if (!user) {
            notify('Invalid email/username or password.');
            return;
        }

        currentUser = user;
        persistSession();
        loginForm.reset();
        checkAuthState();
        notify(`Welcome back, ${user.name || user.email}!`);
    });

    // Logout Event
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        currentUser = null;
        localStorage.removeItem('gearVault_currentUser');
        checkAuthState();
    });

    // Navigation Event Handling
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            closeMobileMenu();
            if (link.id === 'logout-btn') return;
            e.preventDefault();
            const targetId = link.getAttribute('data-target');

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            viewSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) {
                    section.classList.add('active');
                }
            });
            renderAll();
        });
    });

    // Modal Event Handling
    function openGearForm(status) {
        document.getElementById('modal-title').textContent = 'Add New Gear';
        gearForm.reset();
        gearPurchaseDateInput.max = localDateString();
        document.getElementById('gear-id').value = '';
        gearImageInput.value = '';
        updateGearImagePreview('');
        if (status) document.getElementById('gear-status').value = status;
        gearModal.classList.add('open');
        document.body.classList.add('gear-modal-open');
        requestAnimationFrame(() => document.getElementById('gear-name').focus());
    }

    function openStatusChoice() {
        if (!statusChoiceModal) return;
        statusChoiceModal.classList.add('open');
        statusChoiceModal.style.display = 'flex';
        document.body.classList.add('gear-modal-open');
    }

    function closeStatusChoice() {
        if (!statusChoiceModal) return;
        statusChoiceModal.classList.remove('open');
        statusChoiceModal.style.display = 'none';
        pendingFeaturedProduct = null;
        if (!gearModal.classList.contains('open')) document.body.classList.remove('gear-modal-open');
    }

    openModalBtn.addEventListener('click', () => openGearForm());

    if (dashboardAddBtn) {
        dashboardAddBtn.addEventListener('click', () => openGearForm());
    }

    document.querySelectorAll('[data-dashboard-action]').forEach(button => {
        button.addEventListener('click', () => {
            const action = button.dataset.dashboardAction;
            const target = {
                'create-project': 'projects-view',
                'open-tools': 'builder-tools-view',
                'view-analytics': 'analytics-view',
                'view-wishlist': 'wishlist-view'
            }[action];

            if (action === 'add-gear') openGearForm();
            if (action === 'marketplace') {
                document.querySelector('.inventory-preview-widget').scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            if (target) {
                document.querySelector(`.nav-link[data-target="${target}"]`).click();
                if (action === 'create-project') projectNameInput.focus();
            }
        });
    });

    function closeModal() {
        gearModal.classList.remove('open');
        document.body.classList.remove('gear-modal-open');
    }
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);

    // Contact modal handling
    const contactLink = document.getElementById('contact-link');
    const contactModal = document.getElementById('contact-modal');
    const closeContactBtn = document.getElementById('close-contact-btn');
    function openContactModal() {
        if (!contactModal) return;
        contactModal.classList.add('open');
        contactModal.style.display = 'flex';
        document.body.classList.add('gear-modal-open');
    }
    function closeContactModal() {
        if (!contactModal) return;
        contactModal.classList.remove('open');
        contactModal.style.display = 'none';
        document.body.classList.remove('gear-modal-open');
    }
    if (contactLink) {
        contactLink.addEventListener('click', (e) => {
            e.preventDefault();
            openContactModal();
        });
    }
    if (closeContactBtn) closeContactBtn.addEventListener('click', closeContactModal);
    if (contactModal) {
        contactModal.addEventListener('click', (event) => {
            if (event.target === contactModal) closeContactModal();
        });
    }

    const chooseInventoryBtn = document.getElementById('choose-inventory-btn');
    const chooseWishlistBtn = document.getElementById('choose-wishlist-btn');
    const closeStatusChoiceBtn = document.getElementById('close-status-choice-btn');
    if (chooseInventoryBtn) chooseInventoryBtn.addEventListener('click', () => {
        if (pendingFeaturedProduct) {
            addFeaturedProduct(pendingFeaturedProduct, 'Owned');
            pendingFeaturedProduct = null;
            closeStatusChoice();
        } else {
            closeStatusChoice();
            openGearForm('Owned');
        }
    });
    if (chooseWishlistBtn) chooseWishlistBtn.addEventListener('click', () => {
        if (pendingFeaturedProduct) {
            addFeaturedProduct(pendingFeaturedProduct, 'Wishlist');
            pendingFeaturedProduct = null;
            closeStatusChoice();
        } else {
            closeStatusChoice();
            openGearForm('Wishlist');
        }
    });
    if (closeStatusChoiceBtn) closeStatusChoiceBtn.addEventListener('click', closeStatusChoice);
    if (statusChoiceModal) {
        statusChoiceModal.addEventListener('click', (event) => {
            if (event.target === statusChoiceModal) closeStatusChoice();
        });
    }

    gearModal.addEventListener('click', (event) => {
        if (event.target === gearModal) closeModal();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (gearModal.classList.contains('open')) closeModal();
            if (statusChoiceModal && statusChoiceModal.classList.contains('open')) closeStatusChoice();
            if (contactModal && contactModal.classList.contains('open')) closeContactModal();
        }
    });

    // Form Submit / Validation Event
    gearForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('gear-id').value;
        const name = document.getElementById('gear-name').value.trim();
        const category = document.getElementById('gear-category').value;
        const price = parseFloat(document.getElementById('gear-price').value);
        const condition = document.getElementById('gear-condition').value;
        const wattage = parseFloat(document.getElementById('gear-wattage').value) || 0;
        const purchaseDate = gearPurchaseDateInput.value;
        const warrantyMonths = gearWarrantyMonthsInput.value ? Number(gearWarrantyMonthsInput.value) : '';
        const platform = document.getElementById('gear-platform').value;
        const description = document.getElementById('gear-desc').value.trim();
        const status = document.getElementById('gear-status').value;

        if (!name || !category || isNaN(price) || price < 0 || !condition || !status) {
            notify('Please fill out all required fields correctly.');
            return;
        }
        if (Boolean(purchaseDate) !== Boolean(warrantyMonths)) {
            notify('Enter both the purchase date and warranty length, or leave both empty.');
            return;
        }
        if (purchaseDate && (!parseDateOnly(purchaseDate) || purchaseDate > localDateString())) {
            notify('Purchase date must be a valid date that is not in the future.');
            return;
        }
        if (warrantyMonths && (!Number.isInteger(warrantyMonths) || warrantyMonths < 1 || warrantyMonths > 240)) {
            notify('Warranty length must be between 1 and 240 whole months.');
            return;
        }

        if (!currentUser.items) currentUser.items = [];
        if (!currentUser.activities) currentUser.activities = [];

        if (id) {
            currentUser.items = currentUser.items.map(item =>
                item.id == id ? { ...item, name, category, price, condition, wattage, purchaseDate, warrantyMonths, platform, description, status, image: pendingGearImage } : item
            );
            logActivity(`Updated gear item: ${name}`);
            notify(`Updated ${name}`);
        } else {
            const newItem = { id: Date.now(), name, category, price, condition, wattage, purchaseDate, warrantyMonths, platform, description, status, image: pendingGearImage };
            currentUser.items.push(newItem);
            logActivity(`Added ${name} to ${status}`);
            notify(`Added ${name} to ${status}`);
        }

        saveAndRefresh();
        closeModal();
    });

    // Image Upload Preview Logic
    let pendingGearImage = '';

    function updateGearImagePreview(imageSrc = '') {
        const preview = document.getElementById('gear-image-preview');
        pendingGearImage = imageSrc;
        if (!preview) return;
        preview.innerHTML = imageSrc
            ? `<img src="${imageSrc}" alt="Gear image preview">`
            : '';
    }

    const gearImageInput = document.getElementById('gear-image');
    const gearImagePreview = document.getElementById('gear-image-preview');

    function loadGearImageFile(file) {
        if (!file) {
            updateGearImagePreview('');
            return;
        }
        if (!file.type.startsWith('image/')) {
            notify('Please select a valid image file.');
            gearImageInput.value = '';
            return;
        }
        if (file.size > 3 * 1024 * 1024) {
            notify('Please choose an image smaller than 3 MB.');
            gearImageInput.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                // Downscale before saving: full-size photos quickly exhaust
                // the browser's localStorage quota when stored as data URLs.
                const maxSide = 900;
                const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(img.width * scale));
                canvas.height = Math.max(1, Math.round(img.height * scale));
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                updateGearImagePreview(canvas.toDataURL('image/jpeg', 0.82));
            };
            img.onerror = () => {
                notify('That image could not be read. Please try another file.');
                gearImageInput.value = '';
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    }

    gearImageInput.addEventListener('change', () => {
        loadGearImageFile(gearImageInput.files && gearImageInput.files[0]);
    });

    // Drag-and-drop support for the image preview area
    if (gearImagePreview) {
        ['dragenter', 'dragover'].forEach(eventName => {
            gearImagePreview.addEventListener(eventName, (event) => {
                event.preventDefault();
                event.stopPropagation();
                gearImagePreview.classList.add('drag-over');
            });
        });
        ['dragleave', 'dragend', 'drop'].forEach(eventName => {
            gearImagePreview.addEventListener(eventName, (event) => {
                event.preventDefault();
                event.stopPropagation();
                if (eventName !== 'drop') gearImagePreview.classList.remove('drag-over');
            });
        });
        gearImagePreview.addEventListener('drop', (event) => {
            gearImagePreview.classList.remove('drag-over');
            const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
            if (file) loadGearImageFile(file);
        });
        gearImagePreview.style.cursor = 'pointer';
        gearImagePreview.addEventListener('click', () => gearImageInput.click());
    }

    // Search and Filter Events
    if (searchInput) searchInput.addEventListener('input', renderAll);
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            syncMarketChips();
            renderAll();
        });
    }

    // Marketplace category chips drive the same documented category filter
    function syncMarketChips() {
        if (!categoryFilter) return;
        document.querySelectorAll('.market-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.category === categoryFilter.value);
        });
    }

    document.querySelectorAll('.market-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            categoryFilter.value = chip.dataset.category;
            syncMarketChips();
            renderAll();
        });
    });

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            categoryFilter.value = 'All';
            syncMarketChips();
            if (inventorySearchInput) inventorySearchInput.value = '';
            if (inventoryCategoryFilter) inventoryCategoryFilter.value = 'All';
            renderAll();
        });
    }

    // Inventory view search/filter sync with the shared dashboard controls
    if (inventorySearchInput) {
        inventorySearchInput.addEventListener('input', () => {
            searchInput.value = inventorySearchInput.value;
            renderAll();
        });
    }
    if (inventoryCategoryFilter) {
        inventoryCategoryFilter.addEventListener('change', () => {
            if (categoryFilter) categoryFilter.value = inventoryCategoryFilter.value;
            syncMarketChips();
            renderAll();
        });
    }
    if (clearInventorySearchBtn) {
        clearInventorySearchBtn.addEventListener('click', () => {
            if (inventorySearchInput) inventorySearchInput.value = '';
            if (inventoryCategoryFilter) inventoryCategoryFilter.value = 'All';
            searchInput.value = '';
            categoryFilter.value = 'All';
            syncMarketChips();
            renderAll();
        });
    }

    if (inventoryAddBtn) {
        inventoryAddBtn.addEventListener('click', () => {
            const status = inventoryStatusChoice ? inventoryStatusChoice.value : 'Owned';
            openGearForm(status);
        });
    }

    // Shared edit dialog for owned and wishlist gear
    function openEditGear(item) {
        if (!item) return;
        document.getElementById('modal-title').textContent = 'Edit Gear';
        document.getElementById('gear-id').value = item.id;
        document.getElementById('gear-name').value = item.name;
        document.getElementById('gear-category').value = item.category;
        document.getElementById('gear-price').value = item.price;
        document.getElementById('gear-condition').value = item.condition;
        document.getElementById('gear-wattage').value = item.wattage || '';
        gearPurchaseDateInput.max = localDateString();
        gearPurchaseDateInput.value = item.purchaseDate || '';
        gearWarrantyMonthsInput.value = item.warrantyMonths || '';
        document.getElementById('gear-platform').value = item.platform || '';
        document.getElementById('gear-desc').value = item.description || '';
        document.getElementById('gear-status').value = item.status;
        gearImageInput.value = '';
        updateGearImagePreview(item.image || '');
        gearModal.classList.add('open');
        document.body.classList.add('gear-modal-open');
        requestAnimationFrame(() => document.getElementById('gear-name').focus());
    }

    // Delete & Edit Events (Delegated)
    inventoryTableBody.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-id]');
        if (!button) return;
        const id = button.dataset.id;
        const item = currentUser.items.find(i => i.id == id);

        if (button.classList.contains('delete-btn')) {
            askConfirmation(`Delete ${item ? item.name : 'this gear item'}? This cannot be undone.`, () => {
                if (item) logActivity(`Deleted ${item.name}`);
                currentUser.items = currentUser.items.filter(i => i.id != id);
                saveAndRefresh();
                notify('Gear item deleted');
            });
        } else if (button.classList.contains('edit-btn')) {
            openEditGear(item);
        }
    });

    // Wishlist Edit / Delete / Move-to-Inventory Events (Delegated)
    wishlistGrid.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-id]');
        if (!button) return;
        const id = button.dataset.id;
        const item = currentUser.items.find(i => i.id == id);

        if (button.classList.contains('delete-wishlist-btn')) {
            askConfirmation(`Remove ${item ? item.name : 'this item'} from your wishlist?`, () => {
                if (item) logActivity(`Removed ${item.name} from wishlist`);
                currentUser.items = currentUser.items.filter(i => i.id != id);
                saveAndRefresh();
                notify('Removed from wishlist');
            });
        } else if (button.classList.contains('edit-wishlist-btn')) {
            openEditGear(item);
        } else if (button.classList.contains('move-btn')) {
            currentUser.items = currentUser.items.map(i => {
                if (i.id == id) {
                    logActivity(`Moved ${i.name} to Inventory`);
                    return { ...i, status: 'Owned' };
                }
                return i;
            });
            saveAndRefresh();
            notify('Moved to inventory');
        }
    });

    moveAllInventoryBtn.addEventListener('click', () => {
        const wishlistCount = currentUser.items.filter(i => i.status === 'Wishlist').length;
        if (wishlistCount === 0) {
            notify('Your wishlist is empty.');
            return;
        }
        askConfirmation(`Move all ${wishlistCount} wishlist item(s) to inventory?`, () => {
            let moved = 0;
            currentUser.items = currentUser.items.map(i => {
                if (i.status === 'Wishlist') {
                    moved++;
                    return { ...i, status: 'Owned' };
                }
                return i;
            });
            logActivity(`Moved ${moved} wishlist item(s) to inventory`);
            saveAndRefresh();
            notify(`Moved ${moved} item(s) to inventory`);
        });
    });

    // Task Queue Event Handlers
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = taskInput.value.trim();
        if (!text) return;
        if (!currentUser.tasks) currentUser.tasks = [];
        const dueDate = taskDueDateInput.value;
        const repeat = taskRepeatInput.value;
        if (dueDate && !parseDateOnly(dueDate)) {
            notify('Enter a valid task due date.');
            return;
        }
        if (repeat !== 'none' && !dueDate) {
            notify('Choose a due date for a repeating task.');
            return;
        }
        const taskId = Date.now();
        const newTask = { id: taskId, text, completed: false, dueDate, repeat };
        if (repeat !== 'none') {
            newTask.repeatAnchorDate = dueDate;
            newTask.repeatOccurrence = 0;
        }
        currentUser.tasks.push(newTask);
        logActivity(`Added task: ${text}`);
        taskInput.value = '';
        taskDueDateInput.value = '';
        taskRepeatInput.value = 'none';
        saveAndRefresh();
        notify('Task added');
    });

    // Task Checkbox | change | Task handler (documentation event map)
    taskList.addEventListener('change', (e) => {
        if (e.target.classList.contains('toggle-task')) {
            const id = e.target.getAttribute('data-id');
            const task = currentUser.tasks.find(t => t.id == id);
            currentUser.tasks = currentUser.tasks.map(t => t.id == id ? { ...t, completed: e.target.checked } : t);
            if (e.target.checked && task && task.repeat && task.repeat !== 'none' && parseDateOnly(task.dueDate)) {
                const repeatAnchorDate = task.repeatAnchorDate || task.dueDate;
                let repeatOccurrence = Number(task.repeatOccurrence || 0) + 1;
                let nextDueDate = getNextRepeatDate(repeatAnchorDate, task.repeat, repeatOccurrence);
                const today = localDateString();
                while (nextDueDate && nextDueDate <= today) {
                    repeatOccurrence++;
                    nextDueDate = getNextRepeatDate(repeatAnchorDate, task.repeat, repeatOccurrence);
                }
                if (!nextDueDate) {
                    notify('Task completed, but its next repeat date could not be calculated.');
                } else {
                    let nextId = Date.now();
                    while (currentUser.tasks.some(existing => String(existing.id) === String(nextId))) nextId++;
                    currentUser.tasks.push({
                        id: nextId,
                        text: task.text,
                        completed: false,
                        dueDate: nextDueDate,
                        repeat: task.repeat,
                        repeatAnchorDate,
                        repeatOccurrence
                    });
                    logActivity(`Scheduled ${task.text} again for ${formatDateOnly(nextDueDate)}`);
                    notify(`Next maintenance task scheduled for ${formatDateOnly(nextDueDate)}`);
                }
            }
            saveAndRefresh();
        }
        // delete handled by click below
    });

    taskList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-task')) {
            const id = e.target.getAttribute('data-id');
            currentUser.tasks = currentUser.tasks.filter(t => t.id != id);
            saveAndRefresh();
            notify('Task deleted');
        }
    });

    careRemindersList.addEventListener('click', event => {
        const reminder = event.target.closest('button[data-reminder-kind]');
        if (!reminder) return;
        if (reminder.dataset.reminderKind === 'task') {
            document.querySelector('.nav-link[data-target="projects-view"]').click();
            const taskCheckbox = [...taskList.querySelectorAll('.toggle-task')]
                .find(checkbox => checkbox.dataset.id === reminder.dataset.id);
            if (taskCheckbox) {
                taskCheckbox.focus();
                taskCheckbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else if (reminder.dataset.reminderKind === 'warranty') {
            const item = currentUser.items.find(gear => String(gear.id) === reminder.dataset.id);
            if (!item) return;
            document.querySelector('.nav-link[data-target="inventory-view"]').click();
            openEditGear(item);
        }
    });

    // Ongoing & Completed Projects Event Handlers
    projectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = projectNameInput.value.trim();
        if (!name) return;
        const projectType = projectTypeInput.value;
        const description = projectDescriptionInput.value.trim();
        const budget = projectBudgetInput.value === '' ? null : Number(projectBudgetInput.value);
        const targetDate = projectTargetDateInput.value;
        if (budget !== null && (!Number.isFinite(budget) || budget < 0)) {
            notify('Enter a valid project budget.');
            return;
        }
        if (targetDate && !parseDateOnly(targetDate)) {
            notify('Enter a valid project target date.');
            return;
        }
        if (!currentUser.projects) currentUser.projects = [];
        currentUser.projects.push({
            id: Date.now(),
            name,
            projectType,
            description,
            budget,
            targetDate,
            materials: [],
            status: 'Ongoing'
        });
        logActivity(`Started new project: ${name}`);
        projectForm.reset();
        saveAndRefresh();
        notify('Project created');
    });

    const projectsView = document.getElementById('projects-view');
    projectsView.addEventListener('change', event => {
        const sourceSelect = event.target.closest('.project-material-source');
        if (!sourceSelect) return;
        const form = sourceSelect.closest('.project-material-form');
        if (!form) return;
        const selectedSource = sourceSelect.value;
        const gearItem = selectedSource.startsWith('gear:')
            ? currentUser.items.find(item => String(item.id) === selectedSource.slice(5))
            : null;
        const nameInput = form.querySelector('[name="materialName"]');
        const costInput = form.querySelector('[name="unitCost"]');
        const ownedInput = form.querySelector('[name="ownedQuantity"]');
        if (gearItem) {
            nameInput.value = gearItem.name;
            costInput.value = Number(gearItem.price) || 0;
            ownedInput.value = gearItem.status === 'Owned' ? 1 : 0;
        } else if (selectedSource === 'custom') {
            nameInput.value = '';
            costInput.value = 0;
            ownedInput.value = 0;
            nameInput.focus();
        }
    });

    projectsView.addEventListener('submit', event => {
        const materialForm = event.target.closest('.project-material-form');
        if (materialForm) {
            event.preventDefault();
            const project = currentUser.projects.find(item => String(item.id) === materialForm.dataset.projectId);
            if (!project) return;
            const source = materialForm.querySelector('[name="materialSource"]').value;
            const gearItem = source.startsWith('gear:')
                ? currentUser.items.find(item => String(item.id) === source.slice(5))
                : null;
            const name = materialForm.querySelector('[name="materialName"]').value.trim() || (gearItem && gearItem.name);
            const neededQuantity = Number(materialForm.querySelector('[name="neededQuantity"]').value);
            const ownedQuantity = Number(materialForm.querySelector('[name="ownedQuantity"]').value);
            const unitCost = Number(materialForm.querySelector('[name="unitCost"]').value);
            if (!name || !Number.isInteger(neededQuantity) || neededQuantity < 1 || neededQuantity > 10000
                || !Number.isInteger(ownedQuantity) || ownedQuantity < 0 || ownedQuantity > 10000
                || !Number.isFinite(unitCost) || unitCost < 0) {
                notify('Enter a material name, whole-number quantities, and a valid unit cost.');
                return;
            }
            if (source.startsWith('gear:') && !gearItem) {
                notify('That inventory item is no longer available. Choose it again or add a custom material.');
                return;
            }
            if (!Array.isArray(project.materials)) project.materials = [];
            project.materials.push({
                id: Date.now(),
                name,
                neededQuantity,
                ownedQuantity,
                unitCost,
                sourceGearId: gearItem ? gearItem.id : ''
            });
            logActivity(`Added ${name} to project ${project.name}`);
            saveAndRefresh();
            notify('Project material added');
            return;
        }

        const quantityForm = event.target.closest('.project-material-quantity-form');
        if (quantityForm) {
            event.preventDefault();
            const project = currentUser.projects.find(item => String(item.id) === quantityForm.dataset.projectId);
            const material = project && (project.materials || []).find(item => String(item.id) === quantityForm.dataset.materialId);
            if (!material) return;
            const neededQuantity = Number(quantityForm.querySelector('[name="neededQuantity"]').value);
            const ownedQuantity = Number(quantityForm.querySelector('[name="ownedQuantity"]').value);
            if (!Number.isInteger(neededQuantity) || neededQuantity < 1 || neededQuantity > 10000
                || !Number.isInteger(ownedQuantity) || ownedQuantity < 0 || ownedQuantity > 10000) {
                notify('Quantities must be whole numbers. Need at least 1 and have 0 or more.');
                return;
            }
            Object.assign(material, { neededQuantity, ownedQuantity });
            logActivity(`Updated project material quantities: ${material.name}`);
            saveAndRefresh();
            notify('Material quantities updated');
            return;
        }

        const detailsForm = event.target.closest('.project-edit-form');
        if (!detailsForm) return;
        event.preventDefault();
        const project = currentUser.projects.find(item => String(item.id) === detailsForm.dataset.projectId);
        if (!project) return;
        const name = detailsForm.querySelector('[name="projectName"]').value.trim();
        const projectType = detailsForm.querySelector('[name="projectType"]').value;
        const description = detailsForm.querySelector('[name="projectDescription"]').value.trim();
        const budgetInput = detailsForm.querySelector('[name="projectBudget"]').value;
        const budget = budgetInput === '' ? null : Number(budgetInput);
        const targetDate = detailsForm.querySelector('[name="targetDate"]').value;
        if (!name || (budget !== null && (!Number.isFinite(budget) || budget < 0))
            || (targetDate && !parseDateOnly(targetDate))) {
            notify('Enter a project name, valid budget, and valid target date.');
            return;
        }
        Object.assign(project, { name, projectType, description, budget, targetDate });
        logActivity(`Updated project details: ${name}`);
        saveAndRefresh();
        notify('Project details updated');
    });

    projectsView.addEventListener('click', event => {
        const actionButton = event.target.closest('button[data-project-action]');
        if (actionButton) {
            const project = currentUser.projects.find(item => String(item.id) === actionButton.dataset.projectId);
            if (!project) return;
            const materialId = actionButton.dataset.materialId;
            if (actionButton.dataset.projectAction === 'mark-material-ready') {
                project.materials = (project.materials || []).map(material => String(material.id) === materialId
                    ? { ...material, ownedQuantity: material.neededQuantity }
                    : material);
                logActivity(`Marked project material ready: ${project.name}`);
                saveAndRefresh();
                notify('Material marked ready');
            } else if (actionButton.dataset.projectAction === 'delete-material') {
                askConfirmation('Remove this material from the project plan?', () => {
                    project.materials = (project.materials || []).filter(material => String(material.id) !== materialId);
                    saveAndRefresh();
                    notify('Project material removed');
                });
            }
            return;
        }

        const button = event.target.closest('button[data-id]');
        if (!button) return;
        const id = button.dataset.id;
        const project = currentUser.projects.find(item => item.id == id);

        if (button.classList.contains('complete-proj')) {
            currentUser.projects = currentUser.projects.map(item => item.id == id ? { ...item, status: 'Completed' } : item);
            logActivity(`Completed project build ID: ${id}`);
            saveAndRefresh();
            notify(`Completed: ${project ? project.name : 'project'}`);
        } else if (button.classList.contains('delete-proj')) {
            askConfirmation(`Delete project "${project ? project.name : 'project'}" and its materials? This cannot be undone.`, () => {
                currentUser.projects = currentUser.projects.filter(item => item.id != id);
                saveAndRefresh();
                notify('Project deleted');
            });
        }
    });

    // PSU Capacity Update Handler
    savePsuBtn.addEventListener('click', () => {
        const cap = parseFloat(psuCapacityInput.value);
        if (isNaN(cap) || cap <= 0) {
            notify('Please enter a valid PSU wattage.');
            return;
        }
        currentUser.psuCapacity = cap;
        logActivity(`Updated PSU rating to ${cap}W`);
        saveAndRefresh();
        // PSU Update Button | click | evaluateBuildTools() (documentation event map)
        evaluateBuildTools();
        notify(`PSU rating set to ${cap}W`);
    });

    // DIY Audio Enclosure Volume Estimator Handler
    enclosureForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const l = parseFloat(document.getElementById('enc-length').value);
        const w = parseFloat(document.getElementById('enc-width').value);
        const h = parseFloat(document.getElementById('enc-height').value);

        if (isNaN(l) || isNaN(w) || isNaN(h) || l <= 0 || w <= 0 || h <= 0) {
            notify('Enter valid positive numbers for dimensions.');
            return;
        }

        // Convert cm^3 to liters (1000 cm^3 = 1 L)
        const volumeLiters = (l * w * h) / 1000;
        enclosureResult.innerHTML = `
            <p><strong>Internal Volume:</strong> ${volumeLiters.toFixed(2)} L (${(l * w * h).toFixed(0)} cm³)</p>
            <p style="color:#7f8c8d; font-size:0.82rem;">Subtract driver displacement, bracing, and port volume for net tuning volume.</p>
        `;
        logActivity(`Calculated enclosure volume: ${volumeLiters.toFixed(2)} L`);
        saveAndRefresh();
        notify('Volume calculated');
    });

    const portModeInput = document.getElementById('port-calc-mode');
    const portShapeInput = document.getElementById('port-shape');
    const portTargetFrequencyInput = document.getElementById('port-target-frequency');
    const portLengthInput = document.getElementById('port-length');

    function syncPortCalculatorFields() {
        const isRound = portShapeInput.value === 'round';
        const findLength = portModeInput.value === 'length';
        const diameterGroup = document.getElementById('round-port-diameter-group');
        const slotWidthGroup = document.getElementById('slot-port-width-group');
        const slotHeightGroup = document.getElementById('slot-port-height-group');
        const targetFrequencyGroup = document.getElementById('port-target-frequency-group');
        const portLengthGroup = document.getElementById('port-length-group');
        const diameterInput = document.getElementById('port-diameter');
        const widthInput = document.getElementById('port-width');
        const heightInput = document.getElementById('port-height');
        diameterGroup.hidden = !isRound;
        slotWidthGroup.hidden = isRound;
        slotHeightGroup.hidden = isRound;
        targetFrequencyGroup.hidden = !findLength;
        portLengthGroup.hidden = findLength;
        diameterInput.disabled = !isRound;
        widthInput.disabled = isRound;
        heightInput.disabled = isRound;
        portTargetFrequencyInput.disabled = !findLength;
        portLengthInput.disabled = findLength;
        diameterInput.required = isRound;
        widthInput.required = !isRound;
        heightInput.required = !isRound;
        portTargetFrequencyInput.required = findLength;
        portLengthInput.required = !findLength;
    }

    portModeInput.addEventListener('change', syncPortCalculatorFields);
    portShapeInput.addEventListener('change', syncPortCalculatorFields);
    syncPortCalculatorFields();

    portTuningForm.addEventListener('submit', event => {
        event.preventDefault();
        const volumeLiters = Number(document.getElementById('port-box-volume').value);
        const portCount = Number(document.getElementById('port-count').value);
        const isRound = portShapeInput.value === 'round';
        const areaPerPort = isRound
            ? Math.PI * Math.pow(Number(document.getElementById('port-diameter').value), 2) / 4
            : Number(document.getElementById('port-width').value) * Number(document.getElementById('port-height').value);
        const equivalentDiameter = Math.sqrt((4 * areaPerPort) / Math.PI);
        if (!Number.isFinite(volumeLiters) || volumeLiters <= 0
            || !Number.isInteger(portCount) || portCount < 1 || portCount > 8
            || !Number.isFinite(areaPerPort) || areaPerPort <= 0
            || !Number.isFinite(equivalentDiameter)) {
            notify('Enter a positive net volume, valid port dimensions, and 1–8 identical ports.');
            return;
        }

        const totalArea = areaPerPort * portCount;
        const volumeCubicCm = volumeLiters * 1000;
        const endCorrection = 0.732 * equivalentDiameter;
        const speedOfSoundCmPerSecond = 34300;
        const areaSummary = `<p><strong>Area per port:</strong> ${areaPerPort.toFixed(2)} cm² · <strong>Total area:</strong> ${totalArea.toFixed(2)} cm² (${portCount} port${portCount === 1 ? '' : 's'})</p>`;

        if (portModeInput.value === 'length') {
            const targetFrequency = Number(portTargetFrequencyInput.value);
            if (!Number.isFinite(targetFrequency) || targetFrequency < 10 || targetFrequency > 200) {
                notify('Target tuning must be between 10 and 200 Hz.');
                return;
            }
            const effectiveLength = Math.pow(speedOfSoundCmPerSecond / (2 * Math.PI * targetFrequency), 2)
                * (totalArea / volumeCubicCm);
            const physicalLength = effectiveLength - endCorrection;
            if (!Number.isFinite(physicalLength) || physicalLength <= 0) {
                portTuningResult.innerHTML = '<p class="calculator-error">This combination produces a zero or negative port length. Try a larger box, a larger port area, or a lower target frequency.</p>';
                return;
            }
            portTuningResult.innerHTML = `${areaSummary}<p><strong>Physical length per port:</strong> ${physicalLength.toFixed(2)} cm</p><p><strong>Target tuning:</strong> ${targetFrequency.toFixed(1)} Hz</p>`;
        } else {
            const physicalLength = Number(portLengthInput.value);
            if (!Number.isFinite(physicalLength) || physicalLength <= 0) {
                notify('Enter a positive physical port length.');
                return;
            }
            const effectiveLength = physicalLength + endCorrection;
            const frequency = speedOfSoundCmPerSecond / (2 * Math.PI)
                * Math.sqrt(totalArea / (volumeCubicCm * effectiveLength));
            if (!Number.isFinite(frequency) || frequency <= 0) {
                notify('Could not calculate a valid tuning frequency from those dimensions.');
                return;
            }
            portTuningResult.innerHTML = `${areaSummary}<p><strong>Effective length:</strong> ${effectiveLength.toFixed(2)} cm per port</p><p><strong>Estimated tuning:</strong> ${frequency.toFixed(2)} Hz</p>`;
        }
    });

    // Clear All Events
    const clearAllData = () => {
        askConfirmation('Clear all saved gear records? This cannot be undone.', () => {
            currentUser.items = [];
            currentUser.tasks = [];
            currentUser.projects = [];
            logActivity('Cleared all inventory & project data');
            saveAndRefresh();
            notify('All gear, tasks, and projects cleared');
        });
    };
    clearAllBtn.addEventListener('click', clearAllData);
    settingsClearBtn.addEventListener('click', clearAllData);

    // Save Account Settings
    saveAccountBtn.addEventListener('click', () => {
        const newName = document.getElementById('settings-name').value.trim();
        const newEmail = document.getElementById('settings-email').value.trim();
        if (!newName || !newEmail) {
            notify('Fields cannot be empty.');
            return;
        }
        if (loadUsers().some(u => u.email === newEmail && u.email !== currentUserKey)) {
            notify('Another account already uses that email address.');
            return;
        }
        currentUser.name = newName;
        currentUser.email = newEmail;
        logActivity('Updated account profile');
        document.getElementById('user-display-name').textContent = newName;
        document.getElementById('sidebar-user-name').textContent = newName;
        document.getElementById('account-initial').textContent = newName.charAt(0).toUpperCase();
        saveAndRefresh();
        notify('Account settings updated');
    });

    // Export an Excel-compatible CSV using only browser APIs.
    exportBtn.addEventListener('click', () => {
        if (!currentUser.items || currentUser.items.length === 0) {
            notify('No inventory data to export.');
            return;
        }
        const rows = currentUser.items.map(item => ({
            'Item Name': String(item.name || ''),
            Category: String(item.category || ''),
            'Price (PHP)': Number(item.price) || 0,
            Condition: String(item.condition || ''),
            Status: String(item.status || ''),
            'Purchase Date': String(item.purchaseDate || ''),
            'Warranty (Months)': Number(item.warrantyMonths) || '',
            'Warranty Expires': getWarrantyExpiry(item),
            'Wattage (W)': Number(item.wattage) || 0,
            'Platform / Spec': String(item.platform || ''),
            Description: String(item.description || '')
        }));
        const csvCell = value => {
            // Prevent spreadsheet formulas in user-entered text.
            const text = typeof value === 'string' && /^[\s]*[=+\-@]/.test(value)
                ? `'${value}` : String(value);
            return `"${text.replace(/"/g, '""')}"`;
        };
        const csv = [Object.keys(rows[0]), ...rows.map(row => Object.values(row))]
            .map(row => row.map(csvCell).join(','))
            .join('\r\n');
        const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
        const downloadUrl = URL.createObjectURL(blob);
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', downloadUrl);
        downloadAnchor.setAttribute('download', `gearvault_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 10000);
        logActivity('Exported inventory');
        saveAndRefresh();
        notify('Inventory export download started');
    });

    function downloadJsonFile(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
        const downloadUrl = URL.createObjectURL(blob);
        const downloadAnchor = document.createElement('a');
        downloadAnchor.href = downloadUrl;
        downloadAnchor.download = filename;
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 10000);
    }

    backupExportBtn.addEventListener('click', () => {
        const backup = {
            format: 'gearvault-backup',
            version: 1,
            exportedAt: new Date().toISOString(),
            data: {
                items: currentUser.items || [],
                tasks: currentUser.tasks || [],
                projects: currentUser.projects || [],
                activities: currentUser.activities || [],
                psuCapacity: currentUser.psuCapacity || 650
            }
        };
        downloadJsonFile(backup, `gearvault_backup_${new Date().toISOString().slice(0, 10)}.json`);
        notify('Full backup download started');
    });

    backupImportBtn.addEventListener('click', () => backupFileInput.click());
    backupFileInput.addEventListener('change', () => {
        const file = backupFileInput.files && backupFileInput.files[0];
        if (!file) return;
        if (file.size > 15 * 1024 * 1024) {
            backupFileInput.value = '';
            notify('Backup file is too large. Choose a file under 15 MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            let backup;
            try {
                backup = JSON.parse(reader.result);
            } catch (error) {
                backupFileInput.value = '';
                notify('That file is not valid JSON.');
                return;
            }

            const data = backup && backup.data;
            const validId = value => typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
            const validOptionalDate = value => value === undefined || value === ''
                || (typeof value === 'string' && parseDateOnly(value) !== null);
            const validOptionalWarranty = value => value === undefined || value === ''
                || (Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 240);
            const validItem = item => item && validId(item.id)
                && typeof item.name === 'string' && typeof item.category === 'string'
                && typeof item.condition === 'string' && ['Owned', 'Wishlist'].includes(item.status)
                && Number.isFinite(Number(item.price)) && Number(item.price) >= 0
                && Number.isFinite(Number(item.wattage || 0))
                && typeof (item.platform || '') === 'string'
                && typeof (item.description || '') === 'string'
                && typeof (item.image || '') === 'string'
                && validOptionalDate(item.purchaseDate)
                && validOptionalWarranty(item.warrantyMonths)
                && ((!item.purchaseDate && !item.warrantyMonths)
                    || (Boolean(item.purchaseDate) && Boolean(item.warrantyMonths)));
            const validTask = task => task && validId(task.id)
                && typeof task.text === 'string' && typeof task.completed === 'boolean'
                && validOptionalDate(task.dueDate)
                && ['none', 'weekly', 'monthly', 'quarterly', 'semiannual', 'yearly'].includes(task.repeat || 'none')
                && (!(task.repeat && task.repeat !== 'none') || Boolean(task.dueDate))
                && ((task.repeatAnchorDate === undefined && task.repeatOccurrence === undefined)
                    || (typeof task.repeatAnchorDate === 'string' && parseDateOnly(task.repeatAnchorDate) !== null
                        && Number.isInteger(task.repeatOccurrence) && task.repeatOccurrence >= 0));
            const validProjectMaterial = material => material && validId(material.id)
                && typeof material.name === 'string'
                && Number.isInteger(material.neededQuantity) && material.neededQuantity >= 1 && material.neededQuantity <= 10000
                && Number.isInteger(material.ownedQuantity) && material.ownedQuantity >= 0 && material.ownedQuantity <= 10000
                && Number.isFinite(Number(material.unitCost)) && Number(material.unitCost) >= 0
                && (material.sourceGearId === undefined || material.sourceGearId === '' || validId(material.sourceGearId));
            const validProject = project => project && validId(project.id)
                && typeof project.name === 'string' && ['Ongoing', 'Completed'].includes(project.status)
                && (project.projectType === undefined || ['PC Build', 'PC Upgrade', 'Repair', 'Speaker / Audio Build', 'Other'].includes(project.projectType))
                && (project.description === undefined || typeof project.description === 'string')
                && (project.budget === undefined || project.budget === null
                    || (Number.isFinite(Number(project.budget)) && Number(project.budget) >= 0))
                && (project.targetDate === undefined || validOptionalDate(project.targetDate))
                && (project.materials === undefined
                    || (Array.isArray(project.materials) && project.materials.every(validProjectMaterial)));
            const validBackup = backup && backup.format === 'gearvault-backup' && backup.version === 1
                && data && Array.isArray(data.items) && data.items.every(validItem)
                && Array.isArray(data.tasks) && data.tasks.every(validTask)
                && Array.isArray(data.projects) && data.projects.every(validProject)
                && Array.isArray(data.activities) && data.activities.every(activity => typeof activity === 'string')
                && Number.isFinite(Number(data.psuCapacity)) && Number(data.psuCapacity) > 0;

            backupFileInput.value = '';
            if (!validBackup) {
                notify('Backup format is invalid or unsupported. Your data was not changed.');
                return;
            }

            askConfirmation('Restore this backup? It will replace your current gear, tasks, projects, activity history, and PSU rating.', () => {
                const previousData = {
                    items: currentUser.items,
                    tasks: currentUser.tasks,
                    projects: currentUser.projects,
                    activities: currentUser.activities,
                    psuCapacity: currentUser.psuCapacity
                };
                currentUser.items = data.items;
                currentUser.tasks = data.tasks;
                currentUser.projects = data.projects;
                currentUser.activities = data.activities;
                currentUser.psuCapacity = Number(data.psuCapacity);
                psuCapacityInput.value = currentUser.psuCapacity;
                if (saveAndRefresh()) {
                    notify('Backup restored');
                } else {
                    Object.assign(currentUser, previousData);
                    psuCapacityInput.value = currentUser.psuCapacity || 650;
                    renderAll();
                    notify('Backup could not be saved. Your previous data is still in place.');
                }
            });
        };
        reader.onerror = () => {
            backupFileInput.value = '';
            notify('Could not read that backup file.');
        };
        reader.readAsText(file);
    });

    // Preferences (both are saved and restored on startup)
    darkModeToggle.addEventListener('change', () => {
        const isDark = darkModeToggle.checked;
        applyTheme(isDark);
        const settings = loadSettings();
        settings.darkMode = isDark;
        saveSettings(settings);
    });

    notificationsToggle.addEventListener('change', () => {
        const settings = loadSettings();
        settings.notifications = notificationsToggle.checked;
        saveSettings(settings);
        if (notificationsToggle.checked) notify('Notifications enabled');
    });

    // FIX: Replace blocking browser dialogs with a keyboard-friendly confirmation UI.
    let confirmAction = null;
    let confirmReturnFocus = null;
    function askConfirmation(message, action) {
        const dialog = document.getElementById('confirm-dialog');
        if (!dialog) return;
        confirmAction = action;
        confirmReturnFocus = document.activeElement;
        document.getElementById('confirm-message').textContent = message;
        dialog.classList.add('open');
        dialog.setAttribute('aria-hidden', 'false');
        document.body.classList.add('confirm-open');
        document.getElementById('confirm-cancel').focus();
    }
    function closeConfirmation() {
        const dialog = document.getElementById('confirm-dialog');
        if (!dialog) return;
        dialog.classList.remove('open');
        dialog.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('confirm-open');
        confirmAction = null;
        if (confirmReturnFocus) confirmReturnFocus.focus();
        confirmReturnFocus = null;
    }
    document.getElementById('confirm-cancel').addEventListener('click', closeConfirmation);
    document.getElementById('confirm-accept').addEventListener('click', () => {
        const action = confirmAction;
        closeConfirmation();
        if (typeof action === 'function') action();
    });

    // Helper: Evaluate PSU Wattage & Compatibility Rules
    function evaluateBuildTools(gearItems = currentUser.items || []) {
        const psuCap = currentUser.psuCapacity || 650;
        const ownedItems = gearItems.filter(i => i.status === 'Owned');
        const powerCategories = ['CPU', 'GPU', 'Motherboard', 'RAM'];
        const poweredComponents = ownedItems.filter(item => powerCategories.includes(item.category));
        const wattageItems = poweredComponents.filter(item => Number(item.wattage) > 0);
        const totalDraw = wattageItems.reduce((sum, item) => sum + Number(item.wattage), 0);
        const headroom = psuCap - totalDraw;
        const ratio = psuCap > 0 ? (totalDraw / psuCap) * 100 : 0;
        const hasIncompletePowerData = wattageItems.length < poweredComponents.length;

        // Update PSU UI
        document.getElementById('psu-total-draw').textContent = `${totalDraw}W`;
        document.getElementById('psu-headroom').textContent = `${headroom}W`;
        document.getElementById('dash-psu-summary').textContent = `${totalDraw}W / ${psuCap}W`;

        const badge = document.getElementById('psu-status-badge');
        const fill = document.getElementById('psu-progress-fill');
        fill.style.width = `${Math.min(ratio, 100)}%`;

        if (totalDraw > psuCap) {
            badge.textContent = 'Overloaded';
            badge.className = 'status-pill danger';
            fill.style.background = 'var(--danger-color)';
        } else if (wattageItems.length === 0) {
            badge.textContent = 'Add wattage';
            badge.className = 'status-pill warn';
            fill.style.background = 'var(--warn-color)';
        } else if (hasIncompletePowerData) {
            badge.textContent = 'Partial estimate';
            badge.className = 'status-pill warn';
            fill.style.background = 'var(--warn-color)';
        } else if (ratio > 75) {
            badge.textContent = 'Tight Headroom';
            badge.className = 'status-pill warn';
            fill.style.background = 'var(--warn-color)';
        } else {
            badge.textContent = 'Safe';
            badge.className = 'status-pill safe';
            fill.style.background = 'var(--success-color)';
        }

        // Compatibility checks across logged items
        const compatList = document.getElementById('compat-results-list');
        const checks = [];

        const cpus = ownedItems.filter(i => i.category === 'CPU' && i.platform);
        const mobos = ownedItems.filter(i => i.category === 'Motherboard' && i.platform);
        const rams = ownedItems.filter(i => i.category === 'RAM' && i.platform);

        if (cpus.length === 0 && mobos.length === 0 && rams.length === 0) {
            checks.push('Add owned CPU, motherboard, or RAM items with platform tags to run compatibility checks.');
        } else {
            if (cpus.length > 0 && mobos.length > 0) {
                const cpuPlatforms = new Set(cpus.map(c => c.platform));
                const moboPlatforms = new Set(mobos.map(m => m.platform));
                const overlap = [...cpuPlatforms].some(p => moboPlatforms.has(p));
                if (overlap) {
                    checks.push('✅ CPU and Motherboard platform tags match.');
                } else {
                    checks.push('⚠️ Platform mismatch detected between logged CPU and Motherboard.');
                }
            } else if (cpus.length > 0 || mobos.length > 0) {
                checks.push('Add an owned CPU and motherboard with platform tags to check socket compatibility.');
            }

            if (rams.length > 0) {
                const ramTypes = new Set(rams.map(r => r.platform));
                if (ramTypes.size > 1) {
                    checks.push('⚠️ Mixed RAM generation tags detected (e.g., DDR4 and DDR5).');
                } else {
                    checks.push(`✅ RAM generation consistent (${[...ramTypes][0]}).`);
                }
            }

            if (poweredComponents.length === 0) {
                checks.push('Add owned CPU, GPU, motherboard, or RAM wattage to estimate PSU headroom.');
            } else if (wattageItems.length === 0) {
                checks.push('Enter estimated wattage for owned CPU, GPU, motherboard, and RAM items to check PSU headroom.');
            } else if (totalDraw > psuCap) {
                checks.push(`⚠️ Owned PC draw (${totalDraw}W) exceeds PSU capacity (${psuCap}W).`);
            } else if (hasIncompletePowerData) {
                checks.push('Power estimate is partial. Add wattage for every owned CPU, GPU, motherboard, and RAM item.');
            } else {
                checks.push(`✅ PSU capacity (${psuCap}W) covers entered component wattage (${totalDraw}W).`);
            }
        }

        compatList.innerHTML = checks.map(msg => `<li>${escapeHtml(msg)}</li>`).join('');
        const hasCpuMoboCheck = cpus.length > 0 && mobos.length > 0;
        const hasPowerEstimate = poweredComponents.length > 0 && wattageItems.length > 0 && !hasIncompletePowerData;
        document.getElementById('dash-compat-summary').textContent = checks.some(c => c.startsWith('⚠️'))
            ? 'Review build warnings'
            : !hasCpuMoboCheck
                ? 'Add CPU and motherboard platform tags to check compatibility'
                : !hasPowerEstimate ? 'Add wattage for a full power estimate' : 'No logged conflicts';
    }

    // Core Data & DOM Rendering Engine
    function saveAndRefresh() {
        const users = loadUsers();
        const index = users.findIndex(u => u.email === currentUserKey);
        if (index >= 0) users[index] = currentUser;
        else users.push(currentUser);
        const usersSaved = persistUsers(users);
        const sessionSaved = persistSession();
        currentUserKey = currentUser.email;
        renderAll();
        return usersSaved && sessionSaved;
    }

    let pendingFeaturedProduct = null;
    const featuredProducts = [
        { name: 'GeForce RTX 5070 12GB', category: 'GPU', price: 34999, image: 'images/gpu.jpg', platform: 'PCIe 5.0' },
        { name: 'AMD Ryzen 7 Processor', category: 'CPU', price: 26999, image: 'images/cpu.jpg', platform: 'AM5' },
        { name: 'AM5 Gaming Motherboard', category: 'Motherboard', price: 18999, image: 'images/motherboard.jpg', platform: 'AM5' },
        { name: '32GB DDR5 RGB Memory', category: 'RAM', price: 6499, image: 'images/ram.jpg', platform: 'DDR5' },
        { name: '850W Gold Power Supply', category: 'PSU', price: 7299, image: 'images/psu.jpg', platform: 'ATX 3.0' },
        { name: 'Studio Headphones', category: 'Audio', price: 3999, image: 'images/audio.jpg', platform: '3.5mm / USB' },
        { name: 'Wireless Gaming Mouse', category: 'Peripherals', price: 2499, image: 'images/peripherals.jpg', platform: 'Wireless' },
        { name: '27-inch QHD Monitor', category: 'Monitor', price: 14999, image: 'images/monitor.jpg', platform: '1440p' }
    ];

    function addFeaturedProduct(name, status) {
        const product = featuredProducts.find(item => item.name === name);
        if (!product || !currentUser) return;
        if (currentUser.items.some(item => item.name === product.name)) {
            notify(`${product.name} is already in your gear`);
            return;
        }
        currentUser.items.push({
            id: Date.now(),
            name: product.name,
            category: product.category,
            price: product.price,
            condition: 'Brand New',
            wattage: 0,
            platform: product.platform,
            description: 'Added from Featured Gear',
            status: status,
            image: product.image
        });
        logActivity(`Added ${product.name} to ${status === 'Owned' ? 'Inventory' : 'Wishlist'}`);
        saveAndRefresh();
    }

    const inventoryDisplayCard = document.getElementById('inventory-display-card');
    function renderInventoryDisplay() {
        if (!inventoryDisplayCard || !currentUser) return;
        const ownedItems = (currentUser.items || []).filter(i => i.status === 'Owned');
        if (ownedItems.length === 0) {
            inventoryDisplayCard.innerHTML = '<div class="featured-gear-placeholder">No gear yet</div>';
        } else {
            inventoryDisplayCard.innerHTML = ownedItems.map(item => `
                <article class="featured-product-card">
                    <div class="featured-product-image">${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy">` : '<span class="featured-gear-placeholder">No image</span>'}</div>
                    <div class="featured-product-info"><small>${escapeHtml(item.category)} <span>·</span> Your gear</small><h4>${escapeHtml(item.name)}</h4>
                        <div class="featured-product-footer"><strong>₱${Number(item.price || 0).toLocaleString()}</strong></div>
                    </div>
                </article>`).join('');
        }
    }

    const featuredCard = document.getElementById('featured-gear-card');
    if (featuredCard) {
        featuredCard.addEventListener('click', event => {
            const addButton = event.target.closest('.featured-add-btn');
            if (!addButton || !currentUser) return;

            const product = featuredProducts.find(item => item.name === addButton.dataset.featuredName);
            if (!product) return;

            pendingFeaturedProduct = product.name;
            openStatusChoice();
        });
    }

    function renderAll() {
        if (!currentUser) return;
        renderInventoryDisplay();
        const gearItems = currentUser.items || [];
        const activities = currentUser.activities || [];
        const tasks = currentUser.tasks || [];
        const projects = currentUser.projects || [];

        const query = searchInput ? searchInput.value.toLowerCase() : '';
        const selectedCat = categoryFilter ? categoryFilter.value : 'All';

        // Keep the inventory view search/filter in sync
        if (inventorySearchInput && inventorySearchInput.value !== searchInput.value) inventorySearchInput.value = searchInput.value;
        if (inventoryCategoryFilter && inventoryCategoryFilter.value !== categoryFilter.value) inventoryCategoryFilter.value = categoryFilter.value;

        // 1. Render Inventory Table (Strictly Owned items only)
        const ownedOnlyItems = gearItems.filter(i => i.status === 'Owned');
        const filteredOwned = ownedOnlyItems.filter(item => {
            const searchable = `${item.name} ${item.category} ${item.platform || ''} ${item.description || ''}`.toLowerCase();
            const matchesQuery = searchable.includes(query);
            const matchesCat = selectedCat === 'All' || item.category === selectedCat;
            return matchesQuery && matchesCat;
        });

        inventoryTableBody.innerHTML = '';
        if (filteredOwned.length === 0) {
            inventoryTableBody.innerHTML = `<tr><td colspan="10" style="text-align:center;">No owned gear found.</td></tr>`;
        } else {
            filteredOwned.forEach(item => {
                const specText = [item.platform, item.wattage ? `${item.wattage}W` : ''].filter(Boolean).join(' • ') || '-';
                const warrantyExpiry = getWarrantyExpiry(item);
                const warrantyState = warrantyExpiry ? getDueDateLabel(warrantyExpiry, 'warranty') : null;
                const warrantyText = warrantyExpiry
                    ? `<span class="status-pill ${warrantyState.days < 0 ? 'danger' : warrantyState.days <= 60 ? 'warn' : 'safe'}">${escapeHtml(warrantyState.days <= 60 ? warrantyState.text : 'Active')}</span><small class="warranty-expiry-date">Until ${escapeHtml(formatDateOnly(warrantyExpiry))}</small>`
                    : '<span class="warranty-untracked">Not recorded</span>';
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.image ? `<img class="table-gear-image" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">` : ''}<span>${escapeHtml(item.name)}</span></td>
                    <td>${escapeHtml(item.category)}</td>
                    <td>₱${Number(item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>${escapeHtml(item.condition)}</td>
                    <td>${escapeHtml(formatDateOnly(item.purchaseDate) || '—')}</td>
                    <td>${warrantyText}</td>
                    <td>${escapeHtml(specText)}</td>
                    <td>${item.description ? escapeHtml(item.description) : '<em>No description provided</em>'}</td>
                    <td><span class="badge owned">Owned</span></td>
                    <td>
                        <button class="edit-btn secondary-btn" data-id="${item.id}">Edit</button>
                        <button type="button" class="delete-btn danger-btn" data-id="${item.id}">Delete</button>
                    </td>
                `;
                inventoryTableBody.appendChild(tr);
            });
        }

        // 2. Render Wishlist Grid
        const wishlistItems = gearItems.filter(i => i.status === 'Wishlist');
        const totalItems = gearItems.length;
        const ownedItems = ownedOnlyItems.length;
        const wishlistCount = wishlistItems.length;
        const totalValue = gearItems.reduce((sum, i) => sum + (Number(i.price) || 0), 0);
        const ownedBudget = ownedOnlyItems.reduce((sum, i) => sum + (Number(i.price) || 0), 0);
        const wishlistTotal = wishlistItems.reduce((sum, i) => sum + (Number(i.price) || 0), 0);
        wishlistGrid.innerHTML = '';
        if (wishlistItems.length === 0) {
            wishlistGrid.innerHTML = `<p>No items in wishlist.</p>`;
        } else {
            wishlistItems.forEach(item => {
                const specText = [item.platform, item.wattage ? `${item.wattage}W` : ''].filter(Boolean).join(' • ');
                const card = document.createElement('div');
                card.className = 'stat-card';
                card.innerHTML = `

                    ${item.image ? `<img class="wishlist-gear-image" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">` : ''}

                    <h4>${escapeHtml(item.name)}</h4>
                    <p class="wishlist-card-meta">${escapeHtml(item.category)}</p>
                    <p>₱${Number(item.price || 0).toLocaleString()}</p>
                    ${specText ? `<p class="wishlist-card-spec">${escapeHtml(specText)}</p>` : ''}

                    <p class="wishlist-card-reason">"${escapeHtml(item.description || 'No reason specified')}"</p>
                    <div class="wishlist-card-actions">
                        <button type="button" class="primary-btn move-btn" data-id="${item.id}">Move to Inventory</button>
                    </div>
                    <div class="wishlist-card-actions">
                        <button type="button" class="secondary-btn edit-wishlist-btn" data-id="${item.id}">Edit</button>
                        <button type="button" class="danger-btn delete-wishlist-btn" data-id="${item.id}">Delete</button>
                    </div>
                `;
                wishlistGrid.appendChild(card);
            });
        }
        document.getElementById('wishlist-count').textContent = wishlistItems.length;

        // 3. Render Tasks for Today
        taskList.innerHTML = '';
        if (tasks.length === 0) {
            taskList.innerHTML = `<li>No tasks for today.</li>`;
        } else {
            const orderedTasks = [...tasks].sort((a, b) => Number(a.completed) - Number(b.completed)
                || (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31'));
            orderedTasks.forEach(t => {
                const li = document.createElement('li');
                const dueDate = parseDateOnly(t.dueDate) ? getDueDateLabel(t.dueDate, 'task') : null;
                const repeatLabel = getRepeatLabel(t.repeat);
                li.innerHTML = `
                    <span class="task-copy ${t.completed ? 'is-completed' : ''}">
                        <input type="checkbox" class="toggle-task" data-id="${t.id}" ${t.completed ? 'checked' : ''} ${t.completed && repeatLabel ? 'disabled title="The next repeat is already scheduled"' : ''} style="margin-right:8px;">
                        ${escapeHtml(t.text)}
                        ${dueDate ? `<small class="task-due-label ${dueDate.className}">${escapeHtml(dueDate.text)} · ${escapeHtml(formatDateOnly(t.dueDate))}</small>` : ''}
                        ${repeatLabel ? `<small class="task-repeat-label">${escapeHtml(repeatLabel)}</small>` : ''}
                    </span>
                    <button type="button" class="delete-task" data-id="${t.id}" aria-label="Delete task" title="Delete task">&times;</button>
                `;
                taskList.appendChild(li);
            });
        }

        const reminders = [];
        tasks.forEach(task => {
            if (task.completed || !parseDateOnly(task.dueDate)) return;
            const due = getDueDateLabel(task.dueDate, 'task');
            if (due && due.days <= 14) reminders.push({
                id: task.id,
                kind: 'task',
                days: due.days,
                title: task.text,
                detail: `${due.text} · ${formatDateOnly(task.dueDate)}${getRepeatLabel(task.repeat) ? ` · ${getRepeatLabel(task.repeat)}` : ''}`
            });
        });
        ownedOnlyItems.forEach(item => {
            const expiry = getWarrantyExpiry(item);
            if (!expiry) return;
            const due = getDueDateLabel(expiry, 'warranty');
            if (due && due.days <= 60) reminders.push({
                id: item.id,
                kind: 'warranty',
                days: due.days,
                title: item.name,
                detail: `${due.text} · ${formatDateOnly(expiry)}`
            });
        });
        reminders.sort((a, b) => (a.days < 0 ? 0 : 1) - (b.days < 0 ? 0 : 1)
            || (a.days < 0 ? b.days - a.days : a.days - b.days));
        careRemindersList.innerHTML = reminders.length
            ? reminders.slice(0, 6).map(reminder => `
                <button type="button" class="care-reminder ${reminder.days < 0 ? 'is-overdue' : ''}" data-reminder-kind="${reminder.kind}" data-id="${escapeHtml(reminder.id)}">
                    <span class="care-reminder-copy"><strong>${escapeHtml(reminder.title)}</strong><small>${escapeHtml(reminder.detail)}</small></span>
                    <span aria-hidden="true">→</span>
                </button>`).join('')
            : '<p class="empty-dashboard-message">Nothing due soon. Add dates to maintenance tasks or record warranties on owned gear.</p>';

        // 4. Render Ongoing and Completed Projects
        const ongoingDiv = document.getElementById('ongoing-projects-list');
        const completedDiv = document.getElementById('completed-projects-list');

        const ongoingProj = projects.filter(p => p.status === 'Ongoing');
        const completedProj = projects.filter(p => p.status === 'Completed');

        const projectTypes = ['PC Build', 'PC Upgrade', 'Repair', 'Speaker / Audio Build', 'Other'];
        const projectTypeOptions = (selectedType = 'PC Build') => projectTypes.map(type =>
            `<option value="${escapeHtml(type)}" ${type === selectedType ? 'selected' : ''}>${escapeHtml(type)}</option>`
        ).join('');
        const projectGearOptions = (currentUser.items || []).map(item =>
            `<option value="gear:${escapeHtml(item.id)}">${escapeHtml(item.name)} · ${escapeHtml(item.category)} · ${item.status === 'Owned' ? 'Have' : 'Wishlist'}</option>`
        ).join('');
        const formatMoney = amount => `₱${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        function renderProjectCard(project, isCompleted) {
            const materials = Array.isArray(project.materials) ? project.materials : [];
            const neededUnits = materials.reduce((sum, material) => sum + (Number(material.neededQuantity) || 0), 0);
            const ownedUnits = materials.reduce((sum, material) => sum
                + Math.min(Number(material.ownedQuantity) || 0, Number(material.neededQuantity) || 0), 0);
            const toBuyCost = materials.reduce((sum, material) => sum
                + Math.max((Number(material.neededQuantity) || 0) - (Number(material.ownedQuantity) || 0), 0)
                    * (Number(material.unitCost) || 0), 0);
            const totalMaterialCost = materials.reduce((sum, material) => sum
                + (Number(material.neededQuantity) || 0) * (Number(material.unitCost) || 0), 0);
            const materialProgress = neededUnits ? Math.round((ownedUnits / neededUnits) * 100) : 0;
            const budget = project.budget === null || project.budget === undefined ? null : Number(project.budget);
            const overBudget = budget !== null && toBuyCost > budget;
            const targetDays = project.targetDate ? dateDifferenceInDays(project.targetDate) : null;
            const targetStatus = targetDays === null ? 'No target date'
                : targetDays < 0 ? `Overdue by ${Math.abs(targetDays)} day${Math.abs(targetDays) === 1 ? '' : 's'}`
                    : targetDays === 0 ? 'Due today' : `Due ${formatDateOnly(project.targetDate)}`;
            const projectId = escapeHtml(project.id);
            const materialRows = materials.length ? materials.map(material => {
                const materialId = escapeHtml(material.id);
                const needed = Number(material.neededQuantity) || 0;
                const owned = Number(material.ownedQuantity) || 0;
                const remaining = Math.max(needed - owned, 0);
                const remainingCost = remaining * (Number(material.unitCost) || 0);
                const materialCost = needed * (Number(material.unitCost) || 0);
                return `
                    <article class="project-material-row">
                        <div class="project-material-info">
                            <strong>${escapeHtml(material.name)}</strong>
                            <small>${remaining ? `Buy ${remaining} · ${formatMoney(remainingCost)}` : `Have enough · ${owned} of ${needed} ready`}</small>
                        </div>
                        ${isCompleted ? `
                            <span class="project-material-archive">Need ${needed} · Had ${owned} · ${formatMoney(materialCost)}</span>
                        ` : `
                            <form class="project-material-quantity-form" data-project-id="${projectId}" data-material-id="${materialId}">
                                <label>Need <input type="number" name="neededQuantity" min="1" max="10000" step="1" value="${needed}" required></label>
                                <label>Have <input type="number" name="ownedQuantity" min="0" max="10000" step="1" value="${owned}" required></label>
                                <button type="submit" class="secondary-btn">Save</button>
                                <button type="button" class="secondary-btn" data-project-action="mark-material-ready" data-project-id="${projectId}" data-material-id="${materialId}" ${remaining === 0 ? 'disabled' : ''}>Mark all ready</button>
                                <button type="button" class="danger-btn" data-project-action="delete-material" data-project-id="${projectId}" data-material-id="${materialId}" aria-label="Remove ${escapeHtml(material.name)}">Remove</button>
                            </form>
                        `}
                    </article>`;
            }).join('') : '<p class="project-empty-materials">No materials planned yet. Add parts and supplies to see what you still need to buy.</p>';

            const editDetails = isCompleted ? '' : `
                <details class="project-edit-details">
                    <summary>Edit project brief</summary>
                    <form class="project-edit-form" data-project-id="${projectId}">
                        <label class="form-group">Project name
                            <input type="text" name="projectName" value="${escapeHtml(project.name)}" required>
                        </label>
                        <label class="form-group">Project type
                            <select name="projectType">${projectTypeOptions(project.projectType || 'PC Build')}</select>
                        </label>
                        <label class="form-group project-description-field">Goal and notes
                            <textarea name="projectDescription" rows="2">${escapeHtml(project.description || '')}</textarea>
                        </label>
                        <label class="form-group">Budget (₱)
                            <input type="number" name="projectBudget" min="0" step="0.01" value="${budget === null ? '' : budget}">
                        </label>
                        <label class="form-group">Target date
                            <input type="date" name="targetDate" value="${escapeHtml(project.targetDate || '')}">
                        </label>
                        <button type="submit" class="secondary-btn">Save project brief</button>
                    </form>
                </details>`;

            const materialForm = isCompleted ? '' : `
                <p class="project-material-help">Select gear from your inventory or wishlist to prefill it, or add a custom material. Project counts do not change inventory.</p>
                <form class="project-material-form" data-project-id="${projectId}">
                    <select class="project-material-source" name="materialSource" aria-label="Choose from inventory or add a custom material">
                        <option value="custom" selected>Custom material</option>
                        ${projectGearOptions}
                    </select>
                    <input type="text" name="materialName" required placeholder="Material or part name">
                    <label>Need <input type="number" name="neededQuantity" min="1" max="10000" step="1" value="1" required></label>
                    <label>Have <input type="number" name="ownedQuantity" min="0" max="10000" step="1" value="0" required></label>
                    <label>Unit cost ₱ <input type="number" name="unitCost" min="0" step="0.01" value="0" required></label>
                    <button type="submit" class="primary-btn">Add material</button>
                </form>`;

            return `
                <article class="project-card ${isCompleted ? 'is-completed' : ''}">
                    <header class="project-card-header">
                        <div>
                            <span class="project-type-pill">${escapeHtml(project.projectType || 'PC Build')}</span>
                            <h4>${escapeHtml(project.name)}</h4>
                            <p>${escapeHtml(project.description || 'Add a goal and notes to define this project.')}</p>
                        </div>
                        <div class="project-card-actions">
                            ${isCompleted ? '<span class="badge owned">Completed</span>' : `<button type="button" class="primary-btn complete-proj" data-id="${projectId}">Mark Done</button>`}
                            <button type="button" class="danger-btn delete-proj" data-id="${projectId}">Delete</button>
                        </div>
                    </header>
                    <div class="project-summary">
                        <span>Target <strong>${escapeHtml(targetStatus)}</strong></span>
                        <span>Budget <strong>${budget === null ? 'Not set' : formatMoney(budget)}</strong></span>
                        <span>Materials covered <strong>${ownedUnits} / ${neededUnits}</strong></span>
                        <span class="${overBudget ? 'is-over-budget' : ''}">To buy <strong>${formatMoney(toBuyCost)}</strong></span>
                    </div>
                    ${neededUnits ? `<div class="project-material-progress" role="meter" aria-label="Materials ready" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${materialProgress}"><span style="width:${materialProgress}%"></span></div>` : ''}
                    ${overBudget ? '<p class="project-budget-warning">Estimated purchases exceed this project budget.</p>' : ''}
                    ${editDetails}
                    <section class="project-materials">
                        <div class="project-materials-heading">
                            <h5>Materials &amp; parts</h5>
                            <span>${materials.length} line${materials.length === 1 ? '' : 's'} · ${formatMoney(totalMaterialCost)} total estimate</span>
                        </div>
                        ${materialForm}
                        <div class="project-material-list">${materialRows}</div>
                    </section>
                </article>`;
        }

        ongoingDiv.innerHTML = ongoingProj.length
            ? ongoingProj.map(project => renderProjectCard(project, false)).join('')
            : '<p>No ongoing projects. Create one above to start a build plan.</p>';
        completedDiv.innerHTML = completedProj.length
            ? completedProj.map(project => renderProjectCard(project, true)).join('')
            : '<p>No completed projects yet.</p>';

        // 5. Dashboard featured catalog, recent gear, and wishlist progress
        if (featuredCard) {
            featuredCard.classList.toggle('is-filtered', categoryFilter.value !== 'All');
            const visibleProducts = categoryFilter.value === 'All'
                ? featuredProducts.slice(0, 3)
                : featuredProducts.filter(product => product.category === categoryFilter.value);
            featuredCard.innerHTML = visibleProducts.map(product => {
                const added = currentUser.items.find(item => item.name === product.name);
                const image = added && added.image ? added.image : product.image;
                const action = added
                    ? `<span class="badge owned">Added</span>`
                    : `<button type="button" class="featured-add-btn" data-featured-name="${product.name}" aria-label="Add ${product.name}" title="Add">+</button>`;
                return `
                <article class="featured-product-card">
                    <div class="featured-product-image"><img src="${image}" alt="${product.name}" loading="lazy"></div>
                    <div class="featured-product-info"><small>${product.category} <span>·</span> Sample gear</small><h4>${product.name}</h4>
                        <div class="featured-product-footer"><strong>₱${product.price.toLocaleString()}</strong>${action}</div>
                    </div>
                </article>`;
            }).join('');
        }

        const recentGearList = document.getElementById('recent-gear-list');
        const recentWishlist = [...wishlistItems].slice(-3).reverse();
        recentGearList.innerHTML = recentWishlist.length ? recentWishlist.map(item => `
            <div class="recent-gear-item">
                <div class="recent-gear-thumb">${item.image ? `<img src="${escapeHtml(item.image)}" alt="" loading="lazy">` : '<span aria-hidden="true">♥</span>'}</div>
                <div class="recent-gear-copy"><strong>${escapeHtml(item.name)}</strong><small>Added to Wishlist</small></div>
                <span class="recent-status is-wishlist">Wishlist</span>
            </div>`).join('') : '<p class="empty-dashboard-message">Your newest wishlist items will appear here.</p>';

        const taskItems = currentUser.tasks || [];
        const completedTasks = taskItems.filter(t => t.completed).length;
        const taskProgress = taskItems.length ? Math.round((completedTasks / taskItems.length) * 100) : 0;
        document.getElementById('wishlist-progress-value').textContent = `${taskProgress}%`;
        document.getElementById('wishlist-progress-ring').style.setProperty('--progress', `${taskProgress}%`);
        document.getElementById('wishlist-progress-ring').style.background =
            `conic-gradient(var(--accent) 0 ${taskProgress}%, var(--border) ${taskProgress}% 100%)`;
        document.getElementById('wishlist-progress-amount').innerHTML = `${completedTasks} <span>/ ${taskItems.length} tasks</span>`;
        // Recommended PC Upgrades widget removed; keep this guard in case it is re-added.
        const recommendedNameEl = document.getElementById('recommended-upgrade-name');
        const recommendedCopyEl = document.getElementById('recommended-upgrade-copy');
        if (recommendedNameEl && recommendedCopyEl) {
            const recommendedItem = wishlistItems[0];
            recommendedNameEl.textContent = recommendedItem ? recommendedItem.name : 'Plan your next build';
            recommendedCopyEl.textContent = recommendedItem
                ? `${recommendedItem.category} upgrade saved to your wishlist.`
                : 'Add parts to your wishlist and keep your next upgrade in view.';
        }

        // 6. Render Gear by Category Widget
        const categoryBreakdownList = document.getElementById('category-breakdown-list');
        const analyticsCategoryList = document.getElementById('analytics-category-list');

        const categories = ['CPU', 'GPU', 'Motherboard', 'RAM', 'PSU', 'Audio', 'Peripherals', 'Monitor'];
        let catHtml = '';
        let hasCategories = false;

        categories.forEach(cat => {
            const catItems = gearItems.filter(i => i.category === cat);
            const count = catItems.length;
            if (count > 0) {
                hasCategories = true;
                const value = catItems.reduce((sum, i) => sum + (Number(i.price) || 0), 0);
                const share = totalItems ? Math.round(count / totalItems * 100) : 0;
                catHtml += `<div class="analytics-category-row"><div><strong>${cat}</strong><span>${count} item(s) · ${share}%</span></div><div class="analytics-bar" role="meter" aria-label="${cat} share" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${share}"><span style="width:${share}%"></span></div><small>₱${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</small></div>`;
            }
        });

        analyticsCategoryList.innerHTML = hasCategories ? catHtml : '<p class="analytics-empty">Add your first gear item to see category insights.</p>';

        const chartTotal = totalItems + projects.length;
        const ownedShare = chartTotal ? (ownedOnlyItems.length / chartTotal) * 100 : 0;
        const wishlistShare = chartTotal ? (wishlistItems.length / chartTotal) * 100 : 0;
        const categoryChart = document.getElementById('category-chart');
        categoryChart.style.background = chartTotal
            ? `conic-gradient(#8e1ea2 0 ${ownedShare}%, #c653c3 ${ownedShare}% ${ownedShare + wishlistShare}%, #e695d7 ${ownedShare + wishlistShare}% 100%)`
            : 'conic-gradient(#4a2d54 0 100%)';
        document.getElementById('overview-total').textContent = chartTotal;
        categoryBreakdownList.innerHTML = `
            <p><span class="legend-dot owned-dot"></span>Owned <strong>${ownedItems}</strong></p>
            <p><span class="legend-dot wishlist-dot"></span>Wishlist <strong>${wishlistCount}</strong></p>
            <p><span class="legend-dot projects-dot"></span>Projects <strong>${projects.length}</strong></p>`;

        // 7. Render Recent Activity Widget (if present)
        const recentActivityList = document.getElementById('recent-activity-list');
        if (recentActivityList) {
            recentActivityList.innerHTML = '';
            if (activities.length === 0) {
                recentActivityList.innerHTML = `<li>No recent activity.</li>`;
            } else {
                activities.slice(0, 5).forEach(act => {
                    const li = document.createElement('li');
                    li.textContent = act;
                    recentActivityList.appendChild(li);
                });
            }
        }

        // 8. Evaluate Build & Audio Tools
        evaluateBuildTools(gearItems);

        // 9. Update Statistics & Analytics Numbers
        document.getElementById('stat-total').textContent = totalItems;
        document.getElementById('stat-owned').textContent = ownedItems;
        document.getElementById('stat-wishlist').textContent = wishlistCount;
        document.getElementById('stat-value').textContent = `₱${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

        document.getElementById('summary-owned-budget').textContent = `₱${ownedBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        document.getElementById('summary-wishlist-total').textContent = `₱${wishlistTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

        const avgPrice = totalItems ? totalValue / totalItems : 0;
        const maxItem = gearItems.reduce((max, item) => (!max || item.price > max.price) ? item : max, null);

        document.getElementById('analytics-total').textContent = totalItems;
        document.getElementById('analytics-owned').textContent = ownedItems;
        document.getElementById('analytics-wishlist').textContent = wishlistCount;
        document.getElementById('analytics-avg-price').textContent = `₱${avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        document.getElementById('analytics-owned-budget').textContent = `₱${ownedBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        document.getElementById('analytics-wishlist-total').textContent = `₱${wishlistTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        document.getElementById('analytics-total-value').textContent = `₱${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        document.getElementById('analytics-avg-per-item').textContent = `₱${avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        document.getElementById('analytics-max-item').textContent = maxItem ? `${maxItem.name} (₱${Number(maxItem.price).toLocaleString()})` : '—';

        // Ownership breakdown
        const ownershipList = document.getElementById('analytics-ownership-list');
        if (ownershipList) {
            const ownedPct = totalItems ? Math.round((ownedItems / totalItems) * 100) : 0;
            const wishPct = totalItems ? Math.round((wishlistCount / totalItems) * 100) : 0;
            ownershipList.innerHTML = totalItems
                ? `<p>Owned: <strong>${ownedItems}</strong> (${ownedPct}%)</p>
                   <div class="analytics-bar ownership-bar" role="meter" aria-label="Owned share" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${ownedPct}"><span style="width:${ownedPct}%"></span></div>
                   <p>Wishlist: <strong>${wishlistCount}</strong> (${wishPct}%)</p>
                   <p>Projects: <strong>${projects.length}</strong></p>
                   <p>Tasks completed: <strong>${completedTasks} / ${taskItems.length}</strong></p>`
                : '<p class="analytics-empty">No gear yet. Add owned items or wishlist upgrades to get started.</p>';
        }
    }

    // Run Initial Auth Check on Load
    init();

    document.querySelectorAll('.view-all-btn').forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.target === targetId));
            viewSections.forEach(section => section.classList.toggle('active', section.id === targetId));
            renderAll();
        });
    });
});
