const wrapper = document.querySelector('.wrapper');
const loginLink = document.querySelector('.login-link');
const registerLink = document.querySelector('.register-link');
const btnPopup = document.querySelector('.btnLogin-popup');
const iconClose = document.querySelector('.icon-close');

// Global variables for form state
let isSubmitting = false;

// Utility function to show messages
const showMessage = (message, isError = false) => {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.padding = '10px';
    messageDiv.style.marginBottom = '10px';
    messageDiv.style.borderRadius = '4px';
    messageDiv.style.backgroundColor = isError ? '#ffebee' : '#e8f5e9';
    messageDiv.style.color = isError ? '#c62828' : '#2e7d32';

    // Remove any existing message
    const existingMessage = document.querySelector('.message-div');
    if (existingMessage) {
        existingMessage.remove();
    }

    messageDiv.classList.add('message-div');
    const form = document.querySelector('.form-box:not(.active)');
    form.insertBefore(messageDiv, form.firstChild);

    // Auto remove after 5 seconds
    setTimeout(() => messageDiv.remove(), 5000);
};

// Handle Register Form Submission
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    isSubmitting = true;

    const password = e.target.password.value;
    const retypePassword = e.target.retypePassword.value;

    // Password validation
    if (password !== retypePassword) {
        showMessage('Passwords do not match', true);
        isSubmitting = false;
        return;
    }

    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long', true);
        isSubmitting = false;
        return;
    }

    const formData = new FormData(e.target);
    const data = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password')
    };

    try {
        const response = await fetch('http://127.0.0.1:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            showMessage(result.message);
            // Switch to login form after successful registration
            setTimeout(() => {
                wrapper.classList.remove('active');
                e.target.reset();
            }, 2000);
        } else {
            showMessage(result.message, true);
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Network error. Please try again later.', true);
    } finally {
        isSubmitting = false;
    }
});

// Handle Login Form Submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    isSubmitting = true;

    const formData = new FormData(e.target);
    const data = {
        identifier: formData.get('identifier'),
        password: formData.get('password')
    };

    try {
        const response = await fetch('http://127.0.0.1:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            showMessage(`Welcome back, ${result.username}!`);

            // Save auth data
            localStorage.setItem('token', result.token);
            localStorage.setItem('username', result.username);
            localStorage.setItem('isLoggedIn', 'true');

            // Redirect after showing welcome message
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 2000);
        } else {
            showMessage(result.message, true);
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Network error. Please try again later.', true);
    } finally {
        isSubmitting = false;
    }
});

// Form switch animations
registerLink.addEventListener('click', (e) => {
    e.preventDefault();
    wrapper.classList.add('active');
    document.querySelector('.message-div')?.remove();
});

loginLink.addEventListener('click', (e) => {
    e.preventDefault();
    wrapper.classList.remove('active');
    document.querySelector('.message-div')?.remove();
});

// Search functionality
        document.getElementById('searchButton').addEventListener('click', () => {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const recipes = document.querySelectorAll('.recipe');

            recipes.forEach(recipe => {
                const text = recipe.textContent.toLowerCase();
                recipe.style.display = text.includes(searchTerm) ? 'block' : 'none';
            });
        });







