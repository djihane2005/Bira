// --- CONFIGURATION API ---
// const PRODUCTION_API_BASE_URL = 'https://birabrickproject.onrender.com';
const PRODUCTION_API_BASE_URL = 'https://bira-v4mt.onrender.com';

const API_BASE_URL =
  ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://127.0.0.1:3000'
    : PRODUCTION_API_BASE_URL;

// After Render deploy, replace birabrickproject.onrender.com with the real Render service URL if different.

// Gestion du menu mobile
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
}

// Initialisation du CAPTCHA et CSRF
document.addEventListener('DOMContentLoaded', () => {
    generateCaptcha();
    fetchCsrfToken();
});

function generateCaptcha() {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    const qEl = document.getElementById('captcha-question');
    if (qEl) {
        qEl.textContent = `${n1} + ${n2} = ?`;
        document.getElementById('captcha-n1').value = n1;
        document.getElementById('captcha-n2').value = n2;
    }
}

async function fetchCsrfToken() {
    const submitBtn = document.getElementById('submit-btn');
    const csrfField = document.getElementById('csrf-token-field');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/csrf-token`, { 
            credentials: 'include' 
        });
        if (!response.ok) throw new Error('Failed to fetch CSRF token');
        
        const data = await response.json();
        if (csrfField) csrfField.value = data.csrfToken;
        if (submitBtn) submitBtn.disabled = false;
    } catch (err) {
        console.error("Erreur de récupération du token CSRF:", err);
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Backend unavailable";
            submitBtn.style.backgroundColor = "#666";
        }
        const errorEl = document.getElementById('captcha_ans-error');
        if (errorEl) {
            errorEl.textContent = "Backend unavailable. Please check the server URL.";
            errorEl.classList.remove('hidden');
        }
    }
}

// Envoi du formulaire
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('submit-btn');
        const spinner = document.getElementById('btn-spinner');
        const btnText = document.getElementById('btn-text');

        // Reset errors
        document.querySelectorAll('.field-error-msg').forEach(el => {
            el.classList.add('hidden');
            el.textContent = "";
        });

        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());

        // Validation Captcha côté client
        if (parseInt(data.captcha_ans) !== (parseInt(data.captcha_n1) + parseInt(data.captcha_n2))) {
            const captchaError = document.getElementById('captcha_ans-error');
            captchaError.textContent = "Calcul incorrect";
            captchaError.classList.remove('hidden');
            return;
        }

        // Timeout de 10 secondes
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            btn.disabled = true;
            spinner.classList.remove('hidden');
            btnText.textContent = "SENDING...";

            const response = await fetch(`${API_BASE_URL}/api/contact`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': data.csrfToken 
                },
                body: JSON.stringify(data),
                credentials: 'include',
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const result = await response.json();

            if (response.ok) {
                contactForm.classList.add('hidden');
                document.getElementById('success-view').classList.remove('hidden');
            } else if (response.status === 400 && result.errors) {
                result.errors.forEach(err => {
                    const fieldName = err.path || err.param;
                    const errorEl = document.getElementById(`${fieldName}-error`);
                    if (errorEl) {
                        errorEl.textContent = err.msg;
                        errorEl.classList.remove('hidden');
                    }
                });
            } else {
                const captchaError = document.getElementById('captcha_ans-error');
                captchaError.textContent = result.message || "Une erreur est survenue";
                captchaError.classList.remove('hidden');
            }
        } catch (error) {
            clearTimeout(timeoutId);
            console.error("Erreur:", error);
            const captchaError = document.getElementById('captcha_ans-error');
            captchaError.classList.remove('hidden');
            
            if (error.name === 'AbortError') {
                captchaError.textContent = "Request timed out. Please check if the backend is running.";
            } else {
                captchaError.textContent = "Backend unavailable. Please check the server URL.";
            }
        } finally {
            btn.disabled = false;
            spinner.classList.add('hidden');
            btnText.textContent = "SEND MESSAGE";
        }
    });
}

// FAQ Toggle
document.querySelectorAll('.faq-toggle').forEach(button => {
    button.addEventListener('click', () => {
        const content = button.nextElementSibling;
        const icon = button.querySelector('i');
        content.classList.toggle('hidden');
        icon.classList.toggle('rotate-45');
    });
});