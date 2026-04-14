const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_FILE = path.join(__dirname, 'users.json');

function ensureUsersFile() {
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
    }
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function loadUsers() {
    ensureUsersFile();
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data || '[]');
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function registerUser(username, email, password) {
    const users = loadUsers();
    
    // Validation
    if (!username || !email || !password) {
        return { success: false, message: 'Tous les champs sont requis.' };
    }

    // Vérifier si l'utilisateur existe
    if (users.find(u => u.username === username)) {
        return { success: false, message: 'Ce nom d\'utilisateur existe déjà.' };
    }

    if (users.find(u => u.email === email)) {
        return { success: false, message: 'Cet email est déjà utilisé.' };
    }

    // Créer le nouvel utilisateur
    const newUser = {
        id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password_hash: hashPassword(password),
        created_at: new Date().toISOString(),
        games_played: 0,
        games_won: 0,
        level: 1
    };

    users.push(newUser);
    saveUsers(users);

    return { success: true, user: { id: newUser.id, username: newUser.username, email: newUser.email } };
}

function loginUser(username, password) {
    const users = loadUsers();
    const user = users.find(u => u.username === username);

    if (!user) {
        return { success: false, message: 'Nom d\'utilisateur ou mot de passe incorrect.' };
    }

    const passwordHash = hashPassword(password);
    if (user.password_hash !== passwordHash) {
        return { success: false, message: 'Nom d\'utilisateur ou mot de passe incorrect.' };
    }

    // Retourner l'utilisateur sans le mot de passe
    const { password_hash, ...userPublic } = user;
    return { success: true, user: userPublic };
}

function getUserById(userId) {
    const users = loadUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    
    const { password_hash, ...userPublic } = user;
    return userPublic;
}

module.exports = {
    registerUser,
    loginUser,
    getUserById,
    loadUsers
};
