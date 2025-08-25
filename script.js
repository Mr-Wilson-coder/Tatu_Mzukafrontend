// Mobile Menu Toggle
function toggleMobileMenu() {
  const mobileNav = document.getElementById('mobile-nav');
  const menuIcon = document.getElementById('menu-icon');
  const closeIcon = document.getElementById('close-icon');
  
  mobileNav.classList.toggle('hidden');
  menuIcon.classList.toggle('hidden');
  closeIcon.classList.toggle('hidden');
}

// Phone number formatting and validation
function formatPhoneNumber(input, countryCode) {
  let number = input.replace(/\D/g, '');
  
  switch(countryCode) {
    case '+1': // US/Canada
      if (number.length >= 6) {
        return number.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
      } else if (number.length >= 3) {
        return number.replace(/(\d{3})(\d{0,3})/, '$1-$2');
      }
      return number;
    
    case '+257': // Burundi
      if (number.length >= 8) {
        return number.replace(/(\d{2})(\d{3})(\d{3})/, '$1 $2 $3');
      } else if (number.length >= 5) {
        return number.replace(/(\d{2})(\d{0,3})/, '$1 $2');
      }
      return number;
    
    case '+44': // UK
      if (number.length >= 10) {
        return number.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
      } else if (number.length >= 7) {
        return number.replace(/(\d{4})(\d{0,3})/, '$1 $2');
      }
      return number;
    
    default:
      if (number.length >= 7) {
        return number.replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3');
      } else if (number.length >= 4) {
        return number.replace(/(\d{3})(\d+)/, '$1 $2');
      }
      return number;
  }
}

// Initialize phone input functionality
document.addEventListener('DOMContentLoaded', function() {
  const countrySelect = document.getElementById('countryCode');
  const phoneInput = document.getElementById('phone');
  const contactForm = document.getElementById('contactForm');
  
  function updatePhonePlaceholder() {
    const countryData = countrySelect.options[countrySelect.selectedIndex].dataset.country;
    const placeholders = {
      'US': '(555) 123-4567',
      'CA': '(555) 123-4567',
      'BI': '7XXXXXXXX',
      'GB': '20 7946 0958',
      'FR': '1 42 86 83 26',
      'DE': '30 12345678',
      'AU': '2 1234 5678'
    };
    phoneInput.placeholder = placeholders[countryData] || 'XXXXXXXXX';
  }
  
  phoneInput.addEventListener('input', function(e) {
    const formatted = formatPhoneNumber(e.target.value, countrySelect.value);
    if (formatted !== e.target.value) {
      const cursorPosition = e.target.selectionStart;
      e.target.value = formatted;
      e.target.setSelectionRange(cursorPosition, cursorPosition);
    }
  });
  
  countrySelect.addEventListener('change', function() {
    updatePhonePlaceholder();
    if (phoneInput.value) {
      phoneInput.value = formatPhoneNumber(phoneInput.value, countrySelect.value);
    }
  });
  
  updatePhonePlaceholder();

  // Form submission handler
  contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    
    clearFieldErrors();
    hideMessages();
    showLoading(submitBtn);

    try {
      const formData = new FormData(contactForm);
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        subject: formData.get('subject'),
        message: formData.get('message'),
        attachment: formData.get('attachment')
      };

      if (!validateForm(data)) {
        hideLoading(submitBtn);
        return;
      }

      const recaptchaResponse = grecaptcha.getResponse();
      if (!recaptchaResponse) {
        showFieldError('recaptchaError', 'Please complete the reCAPTCHA verification.');
        hideLoading(submitBtn);
        return;
      }

      const response = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
          phone: data.phone ? `${countrySelect.value} ${data.phone}` : null
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      console.log('Submission successful:', result);
      
      showSuccessMessage();
      contactForm.reset();
      grecaptcha.reset();
      updatePhonePlaceholder();
      hideLoading(submitBtn);

    } catch (error) {
      console.error('Submission failed:', error);
      showErrorMessage(error.message || 'Failed to send message. Please try again.');
      hideLoading(submitBtn);
    }
  });

  // Country search functionality
  const countryOptions = Array.from(countrySelect.options);
  countrySelect.addEventListener('keydown', function(e) {
    if (e.key.length === 1) {
      const searchTerm = e.key.toLowerCase();
      const matchingOption = countryOptions.find(option => 
        option.text.toLowerCase().includes(searchTerm)
      );
      if (matchingOption) {
        countrySelect.value = matchingOption.value;
        updatePhonePlaceholder();
      }
    }
  });
});

// Validation functions
function validateForm(data) {
  let isValid = true;
  if (!data.name?.trim() || data.name.trim().length < 2) {
    showFieldError('nameError', 'Please enter a valid name (minimum 2 characters).');
    isValid = false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    showFieldError('emailError', 'Please enter a valid email address.');
    isValid = false;
  }
  if (data.phone && data.phone.replace(/\D/g, '').length < 7) {
    showFieldError('phoneError', 'Please enter a valid phone number.');
    isValid = false;
  }
  if (!data.subject) {
    showFieldError('subjectError', 'Please select a subject.');
    isValid = false;
  }
  if (!data.message?.trim() || data.message.trim().length < 10) {
    showFieldError('messageError', 'Please enter a message (minimum 10 characters).');
    isValid = false;
  }
  return isValid;
}

// UI functions
function showFieldError(errorId, message) {
  const errorElement = document.getElementById(errorId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

function clearFieldErrors() {
  document.querySelectorAll('.field-error').forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
}

function showSuccessMessage() {
  const successMessage = document.getElementById('successMessage');
  successMessage.classList.remove('hidden');
  successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showErrorMessage(message) {
  const errorMessage = document.getElementById('errorMessage');
  document.getElementById('errorText').textContent = message;
  errorMessage.classList.remove('hidden');
  errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideMessages() {
  document.getElementById('successMessage').classList.add('hidden');
  document.getElementById('errorMessage').classList.add('hidden');
}

// Loading states
function showLoading(button) {
  button.innerHTML = '<i class="fas fa-spinner fa-spin submit-icon"></i>Sending...';
  button.disabled = true;
}

function hideLoading(button) {
  button.innerHTML = '<i class="fas fa-paper-plane submit-icon"></i>Send Message';
  button.disabled = false;
}

// File handling
document.addEventListener('DOMContentLoaded', function() {
  const fileInput = document.getElementById('attachment');
  if (!fileInput) return;

  const fileInputLabel = document.querySelector('.file-input-label');
  const fileInputText = document.querySelector('.file-input-text');
  
  fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    fileInputText.textContent = file ? file.name : 'Choose file or drag here';
    fileInputLabel.classList.toggle('has-file', !!file);
  });

  fileInputLabel.addEventListener('dragover', e => e.preventDefault());
  fileInputLabel.addEventListener('dragleave', e => e.preventDefault());
  fileInputLabel.addEventListener('drop', e => {
    e.preventDefault();
    fileInput.files = e.dataTransfer.files;
    fileInput.dispatchEvent(new Event('change'));
  });
});

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Input effects
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.form-input, .form-textarea, .country-select, .phone-input').forEach(input => {
    input.addEventListener('focus', () => input.style.transform = 'scale(1.02)');
    input.addEventListener('blur', () => input.style.transform = 'scale(1)');
  });
});



//SCRIPT FOT RESULTS TAB
// ===============================
// TATUMZUKA RESULTS - JAVASCRIPT
// ===============================

// Mobile menu toggle
function toggleMobileMenu() {
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileNav.style.display === 'none' || mobileNav.style.display === '') {
        mobileNav.style.display = 'block';
    } else {
        mobileNav.style.display = 'none';
    }
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const mobileNav = document.getElementById('mobile-nav');
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    
    if (!mobileNav.contains(event.target) && !mobileBtn.contains(event.target)) {
        mobileNav.style.display = 'none';
    }
});

// Next draw countdown timer
function updateNextDrawTime() {
    const nextDrawElement = document.getElementById('nextDraw');
    if (!nextDrawElement) return;
    
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    
    const timeDiff = nextHour - now;
    const minutes = Math.floor(timeDiff / (1000 * 60));
    
    if (minutes > 0) {
        nextDrawElement.textContent = `${nextHour.getHours()}:00`;
        const winnerCountElement = nextDrawElement.parentElement.querySelector('.winner-count');
        if (winnerCountElement) {
            winnerCountElement.textContent = `In ${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
    }
}

// Smooth scrolling for anchor links
function setupSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Add loading animation to buttons
function setupButtonAnimations() {
    const buttons = document.querySelectorAll('.btn-primary, .btn-play-now');
    
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
}

// Simulate live updates (for demo)
function simulateLiveUpdates() {
    setInterval(() => {
        // This would normally fetch real data from an API
        console.log('Checking for new results...');
    }, 30000); // Check every 30 seconds
}

// Initialize page functionality
function initializePage() {
    updateNextDrawTime();
    setupSmoothScrolling();
    setupButtonAnimations();
    simulateLiveUpdates();
    
    // Update countdown every minute
    setInterval(updateNextDrawTime, 60000);
    
    console.log('TatuMzuka Results page initialized successfully!');
}

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}

// Handle window resize for responsive adjustments
window.addEventListener('resize', function() {
    const mobileNav = document.getElementById('mobile-nav');
    if (window.innerWidth > 768) {
        mobileNav.style.display = 'none';
    }
});

// Add some visual feedback for interactive elements
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to interactive elements
    const interactiveElements = document.querySelectorAll('.history-item, .prize-card');
    
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});



//SCRIPT FOR WINNERS TAB

// Winners Page JavaScript

// Mobile menu toggle
function toggleMobileMenu() {
    const mobileNav = document.getElementById('mobile-nav');
    mobileNav.style.display = mobileNav.style.display === 'block' ? 'none' : 'block';
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const mobileNav = document.getElementById('mobile-nav');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    
    if (!mobileNav.contains(event.target) && !mobileMenuBtn.contains(event.target)) {
        mobileNav.style.display = 'none';
    }
});

// Smooth scrolling for internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add animation on scroll
function addScrollAnimation() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all cards and sections
    document.querySelectorAll('.stat-card, .winner-item, .story-card, .winners-card, .daily-winners-card, .cta-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Initialize animations when page loads
document.addEventListener('DOMContentLoaded', function() {
    addScrollAnimation();
    
    // Add stagger effect to winner items
    const winnerItems = document.querySelectorAll('.winner-item');
    winnerItems.forEach((item, index) => {
        setTimeout(() => {
            item.style.animationDelay = `${index * 0.1}s`;
        }, 100);
    });
});

// Add hover effects to interactive elements
document.addEventListener('DOMContentLoaded', function() {
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.btn-play-now');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});

// Update winner statistics in real-time (simulation)
function updateWinnerStats() {
    const totalWinners = document.querySelector('.stat-card h3');
    if (totalWinners && totalWinners.textContent.includes('2,847')) {
        let count = 2847;
        setInterval(() => {
            if (Math.random() > 0.7) { // 30% chance to increment
                count++;
                totalWinners.textContent = count.toLocaleString();
            }
        }, 30000); // Update every 30 seconds
    }
}



//SCRIPT FOR TERMS AND CONDITION
// TatuMzuka Terms & Conditions Interactive JavaScript

class TatuMzukaTerms {
    constructor() {
        this.init();
    }

    init() {
        this.setupMobileMenu();
        this.setupScrollAnimations();
        this.setupNavbarEffects();
        this.setupSectionAnimations();
        this.setupInteractiveElements();
        this.setupAccessibility();
    }

    // Mobile Menu Functionality
    setupMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const navLinks = document.getElementById('navLinks');

        if (mobileMenuBtn && navLinks) {
            mobileMenuBtn.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                
                // Animate hamburger menu
                const icon = mobileMenuBtn.querySelector('i');
                icon.style.transform = navLinks.classList.contains('active') 
                    ? 'rotate(90deg)' 
                    : 'rotate(0deg)';
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileMenuBtn.contains(e.target) && !navLinks.contains(e.target)) {
                    navLinks.classList.remove('active');
                    const icon = mobileMenuBtn.querySelector('i');
                    icon.style.transform = 'rotate(0deg)';
                }
            });
        }
    }

    // Navbar Scroll Effects
    setupNavbarEffects() {
        const navbar = document.getElementById('navbar');
        let lastScrollY = window.scrollY;

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }

            // Hide/show navbar based on scroll direction
            if (currentScrollY > lastScrollY && currentScrollY > 200) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }
            
            lastScrollY = currentScrollY;
        });
    }

    // Scroll-triggered animations
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // Add staggered animation for child elements
                    const children = entry.target.querySelectorAll('.eligibility-item, .game-rule-card, .quick-link-btn');
                    children.forEach((child, index) => {
                        setTimeout(() => {
                            child.style.opacity = '1';
                            child.style.transform = 'translateY(0)';
                        }, index * 100);
                    });
                }
            });
        }, observerOptions);

        // Observe all sections
        document.querySelectorAll('.animate-section').forEach(section => {
            observer.observe(section);
        });
    }

    // Section-specific animations
    setupSectionAnimations() {
        // Animate section numbers on scroll
        const sectionNumbers = document.querySelectorAll('.section-number');
        
        const numberObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateNumber(entry.target);
                }
            });
        }, { threshold: 0.5 });

        sectionNumbers.forEach(number => {
            numberObserver.observe(number);
        });
    }

    // Animate number counter
    animateNumber(element) {
        const finalNumber = parseInt(element.textContent);
        let currentNumber = 0;
        const increment = finalNumber / 20;
        
        const timer = setInterval(() => {
            currentNumber += increment;
            if (currentNumber >= finalNumber) {
                element.textContent = finalNumber;
                clearInterval(timer);
                // Add pulse effect
                element.style.animation = 'pulse 0.6s ease-in-out';
            } else {
                element.textContent = Math.floor(currentNumber);
            }
        }, 50);
    }

    // Interactive element enhancements
    setupInteractiveElements() {
        // Add hover effects to cards
        document.querySelectorAll('.section-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.01)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });

        // Enhanced eligibility items
        document.querySelectorAll('.eligibility-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                const icon = item.querySelector('i');
                if (icon) {
                    icon.style.transform = 'scale(1.2) rotate(360deg)';
                    icon.style.color = '#10b981';
                }
            });
            
            item.addEventListener('mouseleave', () => {
                const icon = item.querySelector('i');
                if (icon) {
                    icon.style.transform = 'scale(1) rotate(0deg)';
                }
            });
        });

        // Game rule cards animation
        document.querySelectorAll('.game-rule-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                const lists = card.querySelectorAll('.game-rule-list li');
                lists.forEach((li, index) => {
                    setTimeout(() => {
                        li.style.transform = 'translateX(8px)';
                        li.style.color = '#1a1a1a';
                    }, index * 50);
                });
            });
            
            card.addEventListener('mouseleave', () => {
                const lists = card.querySelectorAll('.game-rule-list li');
                lists.forEach(li => {
                    li.style.transform = 'translateX(0)';
                    li.style.color = '#4b5563';
                });
            });
        });

        // Quick links enhanced interaction
        document.querySelectorAll('.quick-link-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.background = this.getRandomGradient();
            });
            
            btn.addEventListener('mouseleave', () => {
                // Reset to original gradient based on class
                if (btn.classList.contains('gradient-mint-bg')) {
                    btn.style.background = 'linear-gradient(135deg, #E6FFFA, #C6F6D5)';
                } else if (btn.classList.contains('gradient-blue-bg')) {
                    btn.style.background = 'linear-gradient(135deg, #EBF8FF, #BEE3F8)';
                } else if (btn.classList.contains('gradient-rose-bg')) {
                    btn.style.background = 'linear-gradient(135deg, #FED7E2, #FECACA)';
                }
            });
        });
    }

    // Random gradient generator
    getRandomGradient() {
        const gradients = [
            'linear-gradient(135deg, #E6FFFA, #C6F6D5)',
            'linear-gradient(135deg, #EBF8FF, #BEE3F8)',
            'linear-gradient(135deg, #FED7E2, #FECACA)'
        ];
        return gradients[Math.floor(Math.random() * gradients.length)];
    }

    // Accessibility enhancements
    setupAccessibility() {
        // Keyboard navigation for mobile menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const navLinks = document.getElementById('navLinks');
                const mobileMenuBtn = document.getElementById('mobileMenuBtn');
                
                if (navLinks && navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    const icon = mobileMenuBtn.querySelector('i');
                    if (icon) icon.style.transform = 'rotate(0deg)';
                }
            }
        });

        // Focus management for interactive elements
        document.querySelectorAll('.nav-link, .quick-link-btn').forEach(element => {
            element.addEventListener('focus', () => {
                element.style.outline = '2px solid #dc2626';
                element.style.outlineOffset = '2px';
            });
            
            element.addEventListener('blur', () => {
                element.style.outline = 'none';
            });
        });

        // Reduce motion for users with motion sensitivity
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.querySelectorAll('*').forEach(element => {
                element.style.animationDuration = '0.01ms';
                element.style.transitionDuration = '0.01ms';
            });
        }
    }

    // Smooth scroll to section (bonus feature)
    scrollToSection(sectionId) {
        const section = document.querySelector(`[data-section="${sectionId}"]`);
        if (section) {
            section.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    // Add floating particles effect (subtle)
    addFloatingParticles() {
        const particleCount = 5;
        const body = document.body;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 4px;
                height: 4px;
                background: linear-gradient(45deg, #dc2626, #10b981);
                border-radius: 50%;
                pointer-events: none;
                z-index: -1;
                opacity: 0.6;
                animation: float ${3 + Math.random() * 2}s ease-in-out infinite;
                left: ${Math.random() * 100}vw;
                top: ${Math.random() * 100}vh;
                animation-delay: ${Math.random() * 2}s;
            `;
            body.appendChild(particle);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TatuMzukaTerms();
    
    // Console welcome message
    console.log('%c🎲 TatuMzuka Terms & Conditions', 
        'color: #dc2626; font-size: 16px; font-weight: bold;');
    console.log('%cBuilt with ❤️ for responsible gaming', 
        'color: #10b981; font-size: 12px;');
});

// Performance optimization: Debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Smooth page transitions
window.addEventListener('beforeunload', () => {
    document.body.style.opacity = '0';
    document.body.style.transform = 'translateY(-20px)';
});

// Easter egg: Konami code for special effect
let konamiCode = [];
const konamiSequence = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.code);
    
    if (konamiCode.length > konamiSequence.length) {
        konamiCode.shift();
    }
    
    if (JSON.stringify(konamiCode) === JSON.stringify(konamiSequence)) {
        // Add special rainbow effect
        document.body.style.background = 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)';
        document.body.style.backgroundSize = '400% 400%';
        document.body.style.animation = 'rainbow 2s ease infinite';
        
        setTimeout(() => {
            document.body.style.background = '#ffffff';
            document.body.style.animation = 'none';
        }, 5000);
        
        konamiCode = [];
    }
});

// Add rainbow animation for easter egg
const style = document.createElement('style');
style.textContent = `
    @keyframes rainbow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }
`;
document.head.appendChild(style);






//HOW TO PLAY SCRIPT 

// Updated Mobile Menu Toggle (CSS-driven)
function toggleMobileMenu() {
    const mobileNav = document.getElementById('mobile-nav');
    mobileNav.classList.toggle('active'); // Use class instead of inline display
}

// Optimized Intersection Observer
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        entry.target.style.opacity = entry.isIntersecting ? '1' : '0';
        entry.target.style.transform = entry.isIntersecting ? 'translateY(0)' : 'translateY(30px)';
        if(entry.isIntersecting) triggerSectionAnimation(entry.target.dataset.section);
    });
}, { 
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

// Fixed Phone Tilt Interaction
document.addEventListener('DOMContentLoaded', () => {
    const phones = document.querySelectorAll('.phone');
    phones.forEach(phone => {
        const baseTransform = 'rotateY(-15deg) rotateX(10deg)';
        
        phone.addEventListener('mousemove', (e) => {
            const rect = phone.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width/2;
            const y = e.clientY - rect.top - rect.height/2;
            
            phone.style.transform = `
                ${baseTransform}
                rotateX(${(y/rect.height)*5}deg) 
                rotateY(${-(x/rect.width)*5}deg)
            `;
        });
        
        phone.addEventListener('mouseleave', () => {
            phone.style.transform = baseTransform;
        });
    });
});

// Contained Confetti Effect
function createConfetti() {
    const phone = document.querySelector('#phone-step4 .phone-screen');
    if (!phone) return;

    for (let i = 0; i < 20; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-particle'; // Added class for CSS control
        confetti.style.cssText = `
            background: ${['#dc2626','#fbbf24','#10b981','#3b82f6'][Math.floor(Math.random()*4)]};
            left: ${Math.random()*100}%;
            animation-delay: ${Math.random()*500}ms;
            animation-duration: ${Math.random()*2+1}s;
        `;
        
        phone.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3000);
    }
}

// Stable Animation System
function triggerSectionAnimation(sectionNumber) {
    const animationMap = {
        '2': animatePhoneStep1,
        '3': animatePhoneStep2,
        '4': animatePhoneStep3,
        '5': animatePhoneStep4
    };
    if(animationMap[sectionNumber]) animationMap[sectionNumber]();
}

// Other functions remain similar but ensure:
// 1. Use classList instead of direct style manipulation where possible
// 2. Add CSS transitions through classes rather than inline styles
// 3. Contain animations within their parent containers
// TatuMzuka Lottery Game - JavaScript

