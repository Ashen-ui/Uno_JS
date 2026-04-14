// Authentication JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', handleLogin);
    }
});

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    // Clear previous errors
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }

    if (!username || !password) {
        showError('Veuillez remplir tous les champs.');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const result = await response.json();

        if (result.success) {
            // Save user info in sessionStorage (not localStorage - isolated per tab)
            sessionStorage.setItem('user_id', result.user.id);
            sessionStorage.setItem('username', result.user.username);
            sessionStorage.setItem('user_email', result.user.email);
            
            // Redirect to lobby
            window.location.href = '/lobby';
        } else {
            showError(result.message || 'Erreur lors de la connexion.');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Erreur réseau lors de la connexion.');
    }
}

function showError(message) {
    const errorDiv = document.getElementById('login-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    } else {
        alert(message);
    }
}
