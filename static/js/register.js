// Registration JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', handleRegister);
    }
});

async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    const errorDiv = document.getElementById('registration-error');
    const successDiv = document.getElementById('registration-success');

    // Clear previous messages
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }
    if (successDiv) {
        successDiv.style.display = 'none';
        successDiv.textContent = '';
    }

    // Validation
    if (!username || !email || !password || !passwordConfirm) {
        showError('Veuillez remplir tous les champs.', errorDiv);
        return;
    }

    if (password !== passwordConfirm) {
        showError('Les mots de passe ne correspondent pas.', errorDiv);
        return;
    }

    if (password.length < 6) {
        showError('Le mot de passe doit contenir au moins 6 caractères.', errorDiv);
        return;
    }

    if (!isValidEmail(email)) {
        showError('Veuillez entrer une adresse email valide.', errorDiv);
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password,
                passwordConfirm: passwordConfirm
            })
        });

        const result = await response.json();

        if (result.success) {
            showSuccess('Compte créé avec succès ! Redirection vers la connexion...', successDiv);
            // Clear form
            document.querySelector('form').reset();
            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = '/connexion';
            }, 2000);
        } else {
            showError(result.message || 'Erreur lors de l\'inscription.', errorDiv);
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Erreur réseau lors de l\'inscription.', errorDiv);
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showError(message, errorDiv) {
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    } else {
        alert(message);
    }
}

function showSuccess(message, successDiv) {
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
    }
}
