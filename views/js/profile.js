document.addEventListener('DOMContentLoaded', () => {
    const usernameDisplay = document.getElementById('username-display');
    const logoutButton = document.getElementById('logout-button');

    // Retrieve username from localStorage
    const username = localStorage.getItem('username');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (isLoggedIn && username) {
        usernameDisplay.textContent = `Hello, ${username}!`;
    } else {
        // If not logged in, redirect to login page
        window.location.href = 'login.html';
    }

    // Logout functionality
    logoutButton.addEventListener('click', () => {
        // Clear login state
        localStorage.clear();

        // Redirect to login page
        window.location.href = 'login.html';
    });
});

document.addEventListener('DOMContentLoaded', () => {
    requireLogin(); // Redirects if not logged in
    const username = getUsername();
    if (username) {
        document.getElementById('welcome-message').textContent = `Welcome, ${username}!`;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    requireLogin(); // Redirects to login.html if the user is not logged in

    const usernameDisplay = document.getElementById('username-display');
    const username = getUsername(); // Retrieve username
    if (username) {
        usernameDisplay.textContent = username;
    }
});
