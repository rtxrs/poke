const fs = require('fs/promises');
const { USERS_FILE } = require('../config');

const readUsers = async () => {
    try {
        await fs.access(USERS_FILE);
        const usersData = await fs.readFile(USERS_FILE, 'utf-8');
        return JSON.parse(usersData);
    } catch {
        return [];
    }
};

const writeUsers = async (users) => {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
};

const updateUserPreferences = async (playerId, newPreferences) => {
    const users = await readUsers();
    const userIndex = users.findIndex(u => u.playerId === playerId);
    if (userIndex === -1) return null;

    if (!users[userIndex].preferences) {
        users[userIndex].preferences = {};
    }

    users[userIndex].preferences = {
        ...users[userIndex].preferences,
        ...newPreferences
    };

    await writeUsers(users);
    return users[userIndex].preferences;
};

module.exports = { readUsers, writeUsers, updateUserPreferences };
