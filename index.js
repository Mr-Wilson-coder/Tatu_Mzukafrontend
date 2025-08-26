// ========================= GLOBAL VARIABLES =========================
let selectedNumbers = [];
let currentStake = 230;
let isLoggedIn = false;
let currentUser = null;
let registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];

// ========================= DOM ELEMENTS =========================
let numberSlots;
let stakeField;
let potentialWinEl;
let phoneNumberEl;
let loginBtn;
let signupBtn;
let profileBtn;
let mobileLoginBtn;
let mobileSignupBtn;
let mobileProfileBtn;
let mobileMenu;
let mobileMenuBtn;
let loginForm;
let signupForm;

// ========================= UTILITY FUNCTIONS =========================
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// ========================= INITIALIZATION =========================
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Lucide icons
    if (window.lucide && typeof lucide.createIcons === 'function') {
        lucide.createIcons();
    }
    
    // Get DOM elements
    numberSlots = $$('.number-slot');
    stakeField = $('#stakeAmount');
    potentialWinEl = $('#potentialWin');
    phoneNumberEl = $('#phoneNumber');
    loginBtn = $('#loginBtn');
    signupBtn = $('#signupBtn');
    profileBtn = $('#profileBtn');
    mobileLoginBtn = $('#mobileLoginBtn');
    mobileSignupBtn = $('#mobileSignupBtn');
    mobileProfileBtn = $('#mobileProfileBtn');
    mobileMenu = $('#mobileMenu');
    mobileMenuBtn = $('#mobileMenuBtn');
    loginForm = $('#loginForm');
    signupForm = $('#signupForm');
    
    // Check if user is logged in
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        currentUser = JSON.parse(loggedInUser);
        isLoggedIn = true;
        updateAuthUI();
    }
    
    // Event Listeners
    setupEventListeners();
    
    // Initial updates
    updateNumberSlots();
    updatePotentialWin();
});

// ========================= EVENT LISTENERS SETUP =========================
function setupEventListeners() {
    // Number buttons
    $$('.number-btn').forEach(btn => {
        btn.addEventListener('click', () => selectNumber(parseInt(btn.dataset.number)));
    });
    
    // Control buttons
    $('#randomBtn')?.addEventListener('click', selectRandomNumbers);
    $('#clearBtn')?.addEventListener('click', clearSelection);
    $('#playBtn')?.addEventListener('click', handlePlayNow);
    
    // Stake buttons
    $$('.stake-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const delta = parseInt(btn.dataset.delta);
            adjustStake(delta);
        });
    });
    
    // Auth buttons
    loginBtn?.addEventListener('click', () => showModal('loginModal'));
    signupBtn?.addEventListener('click', () => showModal('signupModal'));
    profileBtn?.addEventListener('click', showProfile);
    mobileLoginBtn?.addEventListener('click', () => showModal('loginModal'));
    mobileSignupBtn?.addEventListener('click', () => showModal('signupModal'));
    mobileProfileBtn?.addEventListener('click', showProfile);
    
    // Mobile menu
    mobileMenuBtn?.addEventListener('click', toggleMobileMenu);
    
    // Forms
    loginForm?.addEventListener('submit', handleLogin);
    signupForm?.addEventListener('submit', handleSignup);
    $('#confirmBetBtn')?.addEventListener('click', handleConfirmBet);
    
    // Modal close buttons
    $$('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = btn.dataset.modal;
            if (modal) {
                hideModal(modal);
            } else {
                // Find parent modal
                const modalElement = btn.closest('.modal');
                if (modalElement) {
                    hideModal(modalElement.id);
                }
            }
        });
    });
    
    // Modal switchers
    $('#switchToSignup')?.addEventListener('click', () => {
        hideModal('loginModal');
        showModal('signupModal');
    });
    
    $('#switchToLogin')?.addEventListener('click', () => {
        hideModal('signupModal');
        showModal('loginModal');
    });
    
    // Profile buttons
    $('#logoutBtn')?.addEventListener('click', logout);
    $('#backToGameBtn')?.addEventListener('click', hideProfile);
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            hideModal(e.target.id);
        }
    });
    
    // PIN toggle visibility
    $$('.toggle-pin').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                btn.querySelector('i').setAttribute('data-lucide', 'eye-off');
            } else {
                input.type = 'password';
                btn.querySelector('i').setAttribute('data-lucide', 'eye');
            }
            if (window.lucide) lucide.createIcons();
        });
    });
}

// ========================= GAME LOGIC =========================
function selectNumber(number) {
    if (selectedNumbers.includes(number)) {
        selectedNumbers = selectedNumbers.filter(n => n !== number);
        $(`[data-number="${number}"]`).classList.remove('selected');
    } else {
        if (selectedNumbers.length < 3) {
            selectedNumbers.push(number);
            $(`[data-number="${number}"]`).classList.add('selected');
        } else {
            showToast('Maximum Numbers', 'You can only select up to 3 numbers', 'error');
        }
    }
    updateNumberSlots();
    updatePotentialWin();
}

function selectRandomNumbers() {
    clearSelection();
    const randoms = new Set();
    while (randoms.size < 3) randoms.add(Math.floor(Math.random() * 10));
    selectedNumbers = Array.from(randoms);
    selectedNumbers.forEach((n) => $(`[data-number="${n}"]`)?.classList.add('selected'));
    updateNumberSlots();
    updatePotentialWin();
    showToast('Random numbers selected!', `Your lucky numbers: ${selectedNumbers.join(', ')}`, 'success');
}

function clearSelection() {
    selectedNumbers = [];
    $$('.number-btn').forEach((b) => b.classList.remove('selected'));
    updateNumberSlots();
    updatePotentialWin();
}

function updateNumberSlots() {
    numberSlots.forEach((slot, i) => {
        const val = selectedNumbers[i];
        if (val !== undefined) {
            slot.textContent = val;
            slot.classList.add('filled');
        } else {
            slot.textContent = '?';
            slot.classList.remove('filled');
        }
    });
}

function adjustStake(delta) {
    currentStake = Math.max(230, currentStake + delta);
    if (stakeField) stakeField.value = currentStake;
    updatePotentialWin();
}

function calculatePotentialWin() {
    if (selectedNumbers.length === 2) return currentStake * 10;
    if (selectedNumbers.length === 3) return currentStake * 300;
    return 0;
}

function updatePotentialWin() {
    const potentialWin = calculatePotentialWin();
    if (potentialWinEl) {
        potentialWinEl.textContent = `Potential Win: BIF ${potentialWin.toLocaleString()}`;
    }
}

function handlePlayNow() {
    if (!isLoggedIn) {
        showToast('Login Required', 'Please login to place a bet', 'error');
        showModal('loginModal');
        return;
    }
    if (selectedNumbers.length < 2) {
        showToast('Select numbers', 'Please select at least 2 numbers to play', 'error');
        return;
    }
    if (!phoneNumberEl?.value) {
        showToast('Enter phone number', 'Please enter your mobile number', 'error');
        return;
    }
    if (currentStake < 230) {
        showToast('Minimum stake', 'Minimum stake is 230 BIF', 'error');
        return;
    }

    const potentialWin = calculatePotentialWin();
    const confirmed = confirm(
        `Confirm your bet:\nNumbers: ${selectedNumbers.join(', ')}\nStake: ${currentStake} BIF\nPotential Win: ${potentialWin.toLocaleString()} BIF`
    );
    if (confirmed) showModal('pinModal');
}

function handleConfirmBet() {
    const pin = $('#confirmationPin')?.value;
    if (!pin || pin.length !== 4) {
        showToast('Invalid PIN', 'Please enter your 4-digit PIN', 'error');
        return;
    }
    
    if (pin !== currentUser?.pin) {
        showToast('Incorrect PIN', 'PIN is incorrect', 'error');
        return;
    }
    
    // Simulate bet placement
    hideModal('pinModal');
    showToast('Bet Placed!', 'Your bet has been placed successfully. Good luck!', 'success');
    
    // Clear form
    $('#confirmationPin').value = '';
    clearSelection();
}

// ========================= AUTHENTICATION =========================
function handleLogin(e) {
    e.preventDefault();
    const phone = $('#loginPhone')?.value?.trim();
    const pin = $('#loginPin')?.value?.trim();

    if (!phone || !pin) return showToast('Missing Information', 'Please enter both phone number and PIN', 'error');
    if (pin.length !== 4) return showToast('Invalid PIN', 'PIN must be 4 digits', 'error');

    const user = registeredUsers.find((u) => u.phone === phone && u.pin === pin);
    if (!user) return showToast('Invalid Credentials', 'Phone number or PIN is incorrect', 'error');

    currentUser = user;
    isLoggedIn = true;
    localStorage.setItem('loggedInUser', JSON.stringify(currentUser));
    showToast('Login Successful!', 'Welcome back to TatuMzuka', 'success');
    hideModal('loginModal');
    updateAuthUI();
    loginForm?.reset();
}

function handleSignup(e) {
    e.preventDefault();
    const phone = $('#signupPhone')?.value?.trim();
    const pin = $('#signupPin')?.value?.trim();
    const confirmPin = $('#confirmPin')?.value?.trim();

    if (!phone || !pin || !confirmPin) return showToast('Missing Information', 'Please fill in all fields', 'error');
    if (pin.length !== 4) return showToast('Invalid PIN', 'PIN must be 4 digits', 'error');
    if (pin !== confirmPin) return showToast('PIN Mismatch', 'PINs do not match', 'error');
    if (registeredUsers.some((u) => u.phone === phone)) return showToast('Phone Already Registered', 'This phone number is already registered', 'error');

    const newUser = {
        phone,
        pin,
        joinDate: new Date().toLocaleDateString(),
        balance: 0,
    };

    registeredUsers.push(newUser);
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

    currentUser = newUser;
    isLoggedIn = true;
    localStorage.setItem('loggedInUser', JSON.stringify(currentUser));

    showToast('Account Created Successfully!', 'Welcome to TatuMzuka! You can now start playing.', 'success');
    hideModal('signupModal');
    updateAuthUI();
    signupForm?.reset();
}

function updateAuthUI() {
    if (isLoggedIn) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
        if (profileBtn) profileBtn.style.display = 'inline-flex';
        if (mobileLoginBtn) mobileLoginBtn.style.display = 'none';
        if (mobileSignupBtn) mobileSignupBtn.style.display = 'none';
        if (mobileProfileBtn) mobileProfileBtn.style.display = 'inline-flex';
    } else {
        if (loginBtn) loginBtn.style.display = 'inline-flex';
        if (signupBtn) signupBtn.style.display = 'inline-flex';
        if (profileBtn) profileBtn.style.display = 'none';
        if (mobileLoginBtn) mobileLoginBtn.style.display = 'inline-flex';
        if (mobileSignupBtn) mobileSignupBtn.style.display = 'inline-flex';
        if (mobileProfileBtn) mobileProfileBtn.style.display = 'none';
    }
}

function logout() {
    isLoggedIn = false;
    currentUser = null;
    localStorage.removeItem('loggedInUser');
    updateAuthUI();
    hideProfile();
    showToast('Logged Out', 'You have been logged out successfully', 'success');
}

// ========================= PROFILE =========================
function showProfile() {
    $('#gameSection')?.style && ($('#gameSection').style.display = 'none');
    $('#tab-profile')?.style && ($('#tab-profile').style.display = 'block');

    if (currentUser) {
        const userInfo = $('.user-info h2');
        const accountDetails = $('.account-details');
        if (userInfo) userInfo.textContent = `User ${currentUser.phone.slice(-4)}`;
        if (accountDetails) {
            accountDetails.innerHTML = `
                <span>Phone: ${currentUser.phone}</span>
                <span>Joined: ${currentUser.joinDate}</span>
                <span class="verification-badge">
                    <i data-lucide="check-circle"></i> Verified
                </span>
            `;
            if (window.lucide && typeof lucide.createIcons === 'function') {
                lucide.createIcons();
            }
        }
    }
}

function hideProfile() {
    $('#gameSection')?.style && ($('#gameSection').style.display = 'block');
    $('#tab-profile')?.style && ($('#tab-profile').style.display = 'none');
}

// ========================= MODALS =========================
function showModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function hideModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

// ========================= MOBILE MENU =========================
function toggleMobileMenu() {
    const isOpen = mobileMenu?.classList.contains('show');
    if (!mobileMenu || !mobileMenuBtn) return;

    // Re-query icons each time (Lucide replaces nodes)
    const menuIconEl = mobileMenuBtn.querySelector('.menu-icon');
    const closeIconEl = mobileMenuBtn.querySelector('.close-icon');

    if (isOpen) {
        mobileMenu.classList.remove('show');
        if (menuIconEl) menuIconEl.style.display = 'block';
        if (closeIconEl) closeIconEl.style.display = 'none';
    } else {
        mobileMenu.classList.add('show');
        if (menuIconEl) menuIconEl.style.display = 'none';
        if (closeIconEl) closeIconEl.style.display = 'block';
    }
}

// ========================= TOAST NOTIFICATIONS =========================
function showToast(title, message, type = 'info') {
    const toastContainer = $('#toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        success: 'check-circle',
        error: 'x-circle',
        info: 'info'
    };
    
    toast.innerHTML = `
        <div class="toast-header">
            <i data-lucide="${iconMap[type] || 'info'}"></i>
            ${title}
        </div>
        <div class="toast-body">${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Recreate icons for the new toast
    if (window.lucide && typeof lucide.createIcons === 'function') {
        lucide.createIcons();
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
}

// ========================= COUNTDOWN TIMER =========================
function updateCountdown() {
    const countdownEl = $('#countdown');
    if (!countdownEl) return;
    
    // Simple countdown simulation - in real app, this would be calculated from actual draw time
    const now = new Date();
    const nextDraw = new Date();
    nextDraw.setHours(18, 0, 0, 0); // 6 PM today
    
    if (nextDraw <= now) {
        nextDraw.setDate(nextDraw.getDate() + 1); // Tomorrow if already passed
    }
    
    const diff = nextDraw - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    countdownEl.textContent = `Next Draw: ${hours}h ${minutes}m`;
}

// Update countdown every minute
setInterval(updateCountdown, 60000);
updateCountdown(); // Initial call



// ========================= DRAW COUNTDOWN =========================
function startDrawCountdown() {
    const countdownEl = document.getElementById('countdown');
    if (!countdownEl) return;

    function getNextDrawTime() {
        const now = new Date();
        const next = new Date(now);

        // Round to next 30-minute mark
        const minutes = now.getMinutes();
        if (minutes < 30) {
            next.setMinutes(30, 0, 0);
        } else {
            next.setHours(now.getHours() + 1, 0, 0, 0);
        }
        return next;
    }

    let nextDraw = getNextDrawTime();

    function updateCountdown() {
        const now = new Date();
        const diff = nextDraw - now;

        if (diff <= 0) {
            // Draw time reached → reset to next 30 mins
            nextDraw = getNextDrawTime();
        }

        const minutes = Math.floor(diff / 1000 / 60);
        const seconds = Math.floor((diff / 1000) % 60);

        countdownEl.textContent = `Next Draw: ${minutes}m ${seconds}s`;
    }

    // Run immediately and every second
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Call after DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    startDrawCountdown();
});
