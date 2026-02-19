import fs from 'fs/promises';
import { USERS_FILE } from '../config.js';

export interface UserPreferences {
    [key: string]: any;
}

export interface User {
    username: string;
    playerId: string;
    password?: string;
    web_username?: string;
    preferences?: UserPreferences;
}

export const readUsers = async (): Promise<User[]> => {
    try {
        await fs.access(USERS_FILE);
        const usersData = await fs.readFile(USERS_FILE, 'utf-8');
        return JSON.parse(usersData);
    } catch {
        return [];
    }
};

export const writeUsers = async (users: User[]): Promise<void> => {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
};

export const updateUserPreferences = async (playerId: string, newPreferences: UserPreferences): Promise<UserPreferences | null> => {
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
    return users[userIndex].preferences!;
};

export default { readUsers, writeUsers, updateUserPreferences };
