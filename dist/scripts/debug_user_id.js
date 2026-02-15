// @ts-nocheck
const playerDataService = require('../services/playerDataService');
const { readUsers } = require('../services/userService');
async function debug() {
    try {
        console.log("--- Debugging UserId Generation ---");
        // 1. Get known playerId from users.json
        const users = await readUsers();
        if (users.length === 0) {
            console.log("❌ No users found in users.json");
            return;
        }
        const testUser = users[0];
        console.log(`Testing with User: ${testUser.username}`);
        console.log(`PlayerId: ${testUser.playerId}`);
        // 2. Call service
        const privateData = await playerDataService.getPrivatePlayerData(testUser.playerId);
        // 3. Check result
        const account = privateData.playerData.account;
        console.log("Resulting Account Data:");
        console.log(`  Name: ${account.name}`);
        console.log(`  PublicId: ${account.publicId}`);
        console.log(`  UserId: ${account.userId}`);
        if (account.userId) {
            console.log("✅ UserId successfully generated.");
        }
        else {
            console.log("❌ UserId is null/missing.");
        }
        process.exit(0);
    }
    catch (e) {
        console.error("❌ Error during debug:", e);
        process.exit(1);
    }
}
debug();
export {};
