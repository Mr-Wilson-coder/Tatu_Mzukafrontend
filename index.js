// Game State
let selectedNumbers = [];
let currentStake = 246;
let isLoggedIn = false;
let currentUser = null;
let registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];

// DOM Elements
const numberBtns = document.querySelectorAll('.number-btn');
const numberSlots = document.querySelectorAll('.number-slot');
const stakeField = document.getElementById('stakeAmount');
const potentialWinEl = document.getElementById('potentialWin');
const phoneNumberEl = document.getElementById('phoneNumber');
const playBtn = document.getElementById('playBtn');
const randomBtn = document.getElementById('randomBtn');
const clearBtn = document.getElementById('clearBtn');
const increaseStakeBtn = document.getElementById('increaseStake');
const decreaseStakeBtn = document.getElementById('decreaseStake');

// Modal Elements
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const pinModal = document.getElementById('pinModal');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const profileBtn = document.getElementById('profileBtn');
const mobileLoginBtn = document.getElementById('mobileLoginBtn');
const mobileSignupBtn = document.getElementById('mobileSignupBtn');
const mobileProfileBtn = document.getElementById('mobileProfileBtn');

// Forms
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

// Mobile Menu
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const menuIcon = mobileMenuBtn.querySelector('.menu-icon');
const closeIcon = mobileMenuBtn.querySelector('.close-icon');

// Profile Navigation
const profileNavItems = document.querySelectorAll('.profile-nav-advanced .nav-item');
const contentSections = document.querySelectorAll('.content-section');

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
    setupEventListeners();
    updateCountdown();
    setInterval(updateCountdown, 1000);
    
    // Check if user is logged in
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        currentUser = JSON.parse(loggedInUser);
        isLoggedIn = true;
        updateAuthUI();
    }
});

// Game Functions
function initializeGame() {
    updatePotentialWin();
    updateNumberSlots();
}

function setupEventListeners() {
    // Number selection
    numberBtns.forEach(btn => {
        btn.addEventListener('click', () => selectNumber(parseInt(btn.dataset.number)));
    });

    // Stake controls
    increaseStakeBtn.addEventListener('click', () => adjustStake(100));
    decreaseStakeBtn.addEventListener('click', () => adjustStake(-100));
    stakeField.addEventListener('input', (e) => {
        currentStake = Math.max(230, parseInt(e.target.value) || 230);
        updatePotentialWin();
    });

    // Game controls
    randomBtn.addEventListener('click', selectRandomNumbers);
    clearBtn.addEventListener('click', clearSelection);
    playBtn.addEventListener('click', handlePlayNow);

    // Auth buttons
    loginBtn.addEventListener('click', () => showModal('loginModal'));
    signupBtn.addEventListener('click', () => showModal('signupModal'));
    profileBtn.addEventListener('click', showProfile);
    mobileLoginBtn.addEventListener('click', () => showModal('loginModal'));
    mobileSignupBtn.addEventListener('click', () => showModal('signupModal'));
    mobileProfileBtn.addEventListener('click', showProfile);

    // Forms
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);

    // Modal switching
    document.getElementById('switchToSignup').addEventListener('click', () => {
        hideModal('loginModal');
        showModal('signupModal');
    });
    document.getElementById('switchToLogin').addEventListener('click', () => {
        hideModal('signupModal');
        showModal('loginModal');
    });

    // Close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.target.closest('.close-btn').dataset.modal;
            hideModal(modalId);
        });
    });

    // Pin modal
    document.getElementById('cancelPin').addEventListener('click', () => hideModal('pinModal'));
    document.getElementById('confirmBet').addEventListener('click', confirmBet);

    // Mobile menu
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);

    // Profile navigation
    profileNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const section = e.target.closest('.nav-item').dataset.section;
            switchProfileSection(section);
        });
    });

    // PIN toggle buttons
    document.querySelectorAll('.toggle-pin').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const input = e.target.closest('.pin-input').querySelector('input');
            const icon = e.target.closest('.toggle-pin').querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.setAttribute('data-lucide', 'eye-off');
            } else {
                input.type = 'password';
                icon.setAttribute('data-lucide', 'eye');
            }
            lucide.createIcons();
        });
    });

    // Modal backdrop clicks
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal(modal.id);
            }
        });
    });
}

function selectNumber(num) {
    if (selectedNumbers.includes(num)) {
        selectedNumbers = selectedNumbers.filter(n => n !== num);
        document.querySelector(`[data-number="${num}"]`).classList.remove('selected');
    } else if (selectedNumbers.length < 3) {
        selectedNumbers.push(num);
        document.querySelector(`[data-number="${num}"]`).classList.add('selected');
    } else {
        showToast('Maximum 3 numbers', 'You can only select 3 numbers maximum', 'error');
    }
    
    updateNumberSlots();
    updatePotentialWin();
}

function selectRandomNumbers() {
    clearSelection();
    const randomNumbers = [];
    
    while (randomNumbers.length < 3) {
        const randomNum = Math.floor(Math.random() * 10);
        if (!randomNumbers.includes(randomNum)) {
            randomNumbers.push(randomNum);
        }
    }
    
    selectedNumbers = randomNumbers;
    selectedNumbers.forEach(num => {
        document.querySelector(`[data-number="${num}"]`).classList.add('selected');
    });
    
    updateNumberSlots();
    updatePotentialWin();
    showToast('Random numbers selected!', `Your lucky numbers: ${randomNumbers.join(', ')}`, 'success');
}

function clearSelection() {
    selectedNumbers = [];
    document.querySelectorAll('.number-btn').forEach(btn => btn.classList.remove('selected'));
    updateNumberSlots();
    updatePotentialWin();
}

function updateNumberSlots() {
    numberSlots.forEach((slot, index) => {
        if (selectedNumbers[index] !== undefined) {
            slot.textContent = selectedNumbers[index];
            slot.classList.add('filled');
        } else {
            slot.textContent = '?';
            slot.classList.remove('filled');
        }
    });
}

function adjustStake(amount) {
    currentStake = Math.max(230, currentStake + amount);
    stakeField.value = currentStake;
    updatePotentialWin();
}

function updatePotentialWin() {
    let multiplier = 0;
    if (selectedNumbers.length === 2) {
        multiplier = 10;
    } else if (selectedNumbers.length === 3) {
        multiplier = 300;
    }
    
    const potentialWin = currentStake * multiplier;
    potentialWinEl.textContent = `Potential Win: BIF ${potentialWin.toLocaleString()}`;
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
    
    if (!phoneNumberEl.value) {
        showToast('Enter phone number', 'Please enter your mobile number', 'error');
        return;
    }

    if (currentStake < 230) {
        showToast('Minimum stake', 'Minimum stake is 230 BIF', 'error');
        return;
    }

    // Show confirmation
    const potentialWin = calculatePotentialWin();
    const confirmed = confirm(
        `Confirm your bet:\nNumbers: ${selectedNumbers.join(', ')}\nStake: ${currentStake} BIF\nPotential Win: ${potentialWin.toLocaleString()} BIF`
    );
    
    if (confirmed) {
        showModal('pinModal');
    }
}

function calculatePotentialWin() {
    if (selectedNumbers.length === 2) {
        return currentStake * 10;
    } else if (selectedNumbers.length === 3) {
        return currentStake * 300;
    }
    return 0;
}

function confirmBet() {
    const pin = document.getElementById('confirmBetPin').value;
    
    if (pin.length !== 4) {
        showToast('Invalid PIN', 'Please enter your 4-digit PIN', 'error');
        return;
    }

    if (pin !== currentUser.pin) {
        showToast('Incorrect PIN', 'Please enter the correct PIN', 'error');
        return;
    }

    showToast('Bet Placed Successfully!', `Your numbers ${selectedNumbers.join(', ')} are in the next draw. Good luck!`, 'success');
    
    hideModal('pinModal');
    document.getElementById('confirmBetPin').value = '';
    clearSelection();
}

// Auth Functions
function handleLogin(e) {
    e.preventDefault();
    
    const phone = document.getElementById('loginPhone').value;
    const pin = document.getElementById('loginPin').value;
    
    if (!phone || !pin) {
        showToast('Missing Information', 'Please enter both phone number and PIN', 'error');
        return;
    }

    if (pin.length !== 4) {
        showToast('Invalid PIN', 'PIN must be 4 digits', 'error');
        return;
    }

    // Check if user exists
    const user = registeredUsers.find(u => u.phone === phone && u.pin === pin);
    
    if (!user) {
        showToast('Invalid Credentials', 'Phone number or PIN is incorrect', 'error');
        return;
    }

    // Login successful
    currentUser = user;
    isLoggedIn = true;
    localStorage.setItem('loggedInUser', JSON.stringify(currentUser));
    
    showToast('Login Successful!', 'Welcome back to TatuMzuka', 'success');
    hideModal('loginModal');
    updateAuthUI();
    
    // Clear form
    loginForm.reset();
}

function handleSignup(e) {
    e.preventDefault();
    
    const phone = document.getElementById('signupPhone').value;
    const pin = document.getElementById('signupPin').value;
    const confirmPin = document.getElementById('confirmPin').value;
    
    if (!phone || !pin || !confirmPin) {
        showToast('Missing Information', 'Please fill in all fields', 'error');
        return;
    }

    if (pin.length !== 4) {
        showToast('Invalid PIN', 'PIN must be 4 digits', 'error');
        return;
    }

    if (pin !== confirmPin) {
        showToast('PIN Mismatch', 'PINs do not match', 'error');
        return;
    }

    // Check if phone number already exists
    if (registeredUsers.some(u => u.phone === phone)) {
        showToast('Phone Already Registered', 'This phone number is already registered', 'error');
        return;
    }

    // Create new user
    const newUser = {
        phone: phone,
        pin: pin,
        joinDate: new Date().toLocaleDateString(),
        balance: 0
    };

    registeredUsers.push(newUser);
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
    
    // Auto login
    currentUser = newUser;
    isLoggedIn = true;
    localStorage.setItem('loggedInUser', JSON.stringify(currentUser));
    
    showToast('Account Created Successfully!', 'Welcome to TatuMzuka! You can now start playing.', 'success');
    hideModal('signupModal');
    updateAuthUI();
    
    // Clear form
    signupForm.reset();
}

function updateAuthUI() {
    if (isLoggedIn) {
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'none';
        profileBtn.style.display = 'inline-flex';
        mobileLoginBtn.style.display = 'none';
        mobileSignupBtn.style.display = 'none';
        mobileProfileBtn.style.display = 'inline-flex';
    } else {
        loginBtn.style.display = 'inline-flex';
        signupBtn.style.display = 'inline-flex';
        profileBtn.style.display = 'none';
        mobileLoginBtn.style.display = 'inline-flex';
        mobileSignupBtn.style.display = 'inline-flex';
        mobileProfileBtn.style.display = 'none';
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

// Profile Functions
function showProfile() {
    document.getElementById('gameSection').style.display = 'none';
    document.getElementById('tab-profile').style.display = 'block';
    
    // Update profile data
    if (currentUser) {
        const userInfo = document.querySelector('.user-info h2');
        const accountDetails = document.querySelector('.account-details');
        
        if (userInfo) {
            userInfo.textContent = `User ${currentUser.phone.slice(-4)}`;
        }
        
        if (accountDetails) {
            accountDetails.innerHTML = `
                <span>Phone: ${currentUser.phone}</span>
                <span>Joined: ${currentUser.joinDate}</span>
                <span class="verification-badge">
                    <i data-lucide="check-circle"></i> Verified
                </span>
            `;
        }
    }
    
    lucide.createIcons();
}

function hideProfile() {
    document.getElementById('gameSection').style.display = 'block';
    document.getElementById('tab-profile').style.display = 'none';
}

function switchProfileSection(sectionId) {
    // Update navigation
    profileNavItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === sectionId) {
            item.classList.add('active');
        }
    });
    
    // Update content sections
    contentSections.forEach(section => {
        section.classList.remove('active');
        if (section.id === sectionId) {
            section.classList.add('active');
        }
    });
}

// Modal Functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

// Mobile Menu Functions
function toggleMobileMenu() {
    const isOpen = mobileMenu.classList.contains('show');
    
    if (isOpen) {
        mobileMenu.classList.remove('show');
        menuIcon.style.display = 'block';
        closeIcon.style.display = 'none';
    } else {
        mobileMenu.classList.add('show');
        menuIcon.style.display = 'none';
        closeIcon.style.display = 'block';
    }
}

// Utility Functions
function updateCountdown() {
    const now = new Date();
    const minutes = 29 - now.getMinutes() % 30;
    const seconds = 59 - now.getSeconds();
    
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const countdownElements = document.querySelectorAll('#countdown, #nextDraw');
    countdownElements.forEach(el => {
        if (el) el.textContent = timeString;
    });
}

function showToast(title, message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">&times;</button>
    `;
    
    // Add toast styles
    const style = document.createElement('style');
    style.textContent = `
        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        }
        .toast-success { border-left: 4px solid #10b981; }
        .toast-error { border-left: 4px solid #ef4444; }
        .toast-info { border-left: 4px solid #3b82f6; }
        .toast-title { font-weight: 600; margin-bottom: 4px; }
        .toast-message { font-size: 14px; color: #666; }
        .toast-close { 
            position: absolute; 
            top: 8px; 
            right: 12px; 
            background: none; 
            border: none; 
            font-size: 18px; 
            cursor: pointer; 
            color: #999;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    
    if (!document.querySelector('#toast-styles')) {
        style.id = 'toast-styles';
        document.head.appendChild(style);
    }
    
    // Add to page
    document.body.appendChild(toast);
    
    // Close button functionality
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

// Add logout functionality to profile
document.addEventListener('click', (e) => {
    if (e.target.textContent === 'Logout' || e.target.closest('.logout-btn')) {
        logout();
    }
});

// Handle back to game from profile
document.addEventListener('click', (e) => {
    if (e.target.textContent === 'Back to Game' || e.target.closest('.back-to-game')) {
        hideProfile();
    }
});
