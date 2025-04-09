// Check if the user is logged in
function isLoggedIn() {
    return !!localStorage.getItem('token');
}

// Get the username of the logged-in user
function getUsername() {
    return localStorage.getItem('username');
}

// Protect pages that require authentication
function requireLogin() {
    if (!isLoggedIn()) {
        alert('You must be logged in to access this page.');
        window.location.href = 'login.html';
    }
}

// Logout the user
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userId');
    window.location.href = 'index.html'; // Redirect to home page instead of login
}

function checkAuthStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const navigation = document.querySelector('.navigation');

    if (isLoggedIn) {
        // Update navigation for logged-in users
        navigation.innerHTML = `
            <a href="index.html">Home</a>
            <a href="allrecipes.html">All Recipes</a>
            <a href="AddRecipe.html">Add Recipes</a>
            <a href="profile.html" class="profile-button">
            <img src="../images/profile.png" alt="Profile Icon" class="profile-icon"> 
            </a>  
            <a href="#" onclick="logout()"  class="logout-button">Logout</a>
            
        `;
    } else {
        // Update navigation for non-logged-in users
        navigation.innerHTML = `
            <a href="index.html">Home</a>
            <a href="allrecipes.html">All Recipes</a>
            <a href="login.html" id="auth-button" class="login-button">Login</a>
        `;
    }
}




// Call checkAuthStatus when the DOM is loaded
document.addEventListener('DOMContentLoaded', checkAuthStatus);
