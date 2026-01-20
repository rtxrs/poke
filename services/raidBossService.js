const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const RAID_BOSS_URL = 'https://pokemon-go-api.github.io/pokemon-go-api/api/raidboss.json';
const RAID_BOSS_FILE = path.join(__dirname, '../data/public/raidboss.json');
const STATUS_FILE = path.join(__dirname, '../data/user/raidboss-update-status.json');

const raidBossService = {
    healthStatus: {
        raidboss: { remoteHash: null, localHash: null, lastChecked: null, file: 'raidboss.json' },
        cron: { lastRun: null, status: 'Not yet run' }
    },

    transformRaidBossData(data) {
        const transformedData = {
            currentList: {}
        };

        if (!data || !data.currentList) {
             console.error('Unexpected raid boss data format');
             return transformedData;
        }

        const sourceList = data.currentList;

        Object.keys(sourceList).forEach(level => {
             const bosses = sourceList[level];
             if (!transformedData.currentList[level]) {
                transformedData.currentList[level] = [];
            }
            
            bosses.forEach(boss => {
                 const englishName = boss.names.English;
                 const transformedBoss = {
                    id: englishName.toUpperCase().replace(/ /g, '_').replace(/[()]/g, ''),
                    names: {
                        English: englishName
                    },
                    level: level,
                    types: boss.types,
                    assets: {
                        image: boss.assets.image
                    }
                };
                transformedData.currentList[level].push(transformedBoss);
            });
        });

        return transformedData;
    },

    async updateRaidBosses() {
        console.log('🔄 Checking for raid boss updates...');
        this.healthStatus.cron.lastRun = new Date().toISOString();
        this.healthStatus.cron.status = 'Running';

        try {
            const response = await fetch(RAID_BOSS_URL);
            if (!response.ok) {
                throw new Error(`Failed to fetch raid boss data: ${response.statusText}`);
            }
            const newRaidBossData = await response.json();
            const transformedData = this.transformRaidBossData(newRaidBossData);
            const transformedContent = JSON.stringify(transformedData, null, 2);

            const newRaidBossHash = crypto.createHash('sha512').update(transformedContent).digest('hex');
            this.healthStatus.raidboss.remoteHash = newRaidBossHash;
            this.healthStatus.raidboss.lastChecked = new Date().toISOString();

            let localRaidBossHash = '';
            try {
                const localRaidBossContent = await fs.readFile(RAID_BOSS_FILE, 'utf-8');
                localRaidBossHash = crypto.createHash('sha512').update(localRaidBossContent).digest('hex');
                this.healthStatus.raidboss.localHash = localRaidBossHash;
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    throw error;
                }
                console.log('No local raidboss.json found. A new one will be downloaded.');
            }

            if (localRaidBossHash.toLowerCase() !== newRaidBossHash.toLowerCase()) {
                console.log('Raid boss update available. Downloading new version...');
                await fs.writeFile(RAID_BOSS_FILE, transformedContent);
                this.healthStatus.raidboss.localHash = newRaidBossHash;
                this.healthStatus.cron.status = 'Success (updated)';
                console.log('✅ New raid boss data downloaded successfully.');
            } else {
                this.healthStatus.cron.status = 'Success (no update)';
                console.log('👍 Raid boss data is already up to date.');
            }
        } catch (error) {
            this.healthStatus.cron.status = 'Failed';
            console.error(`❌ An error occurred during the raid boss update check: ${error.message}`);
        } finally {
            await fs.writeFile(STATUS_FILE, JSON.stringify(this.healthStatus, null, 4));
        }
    },

    async getHealthCheckData() {
        try {
            const statusContent = await fs.readFile(STATUS_FILE, 'utf-8');
            return JSON.parse(statusContent);
        } catch (error) {
            return this.healthStatus;
        }
    }
};

module.exports = raidBossService;