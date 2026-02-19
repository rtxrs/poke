import { execSync } from 'child_process';
import 'dotenv/config';
import fs from 'fs';

const { GITHUB_USERNAME, GITHUB_TOKEN } = process.env;

if (!GITHUB_USERNAME || !GITHUB_TOKEN) {
    console.error('❌ Error: GITHUB_USERNAME and GITHUB_TOKEN must be set in .env');
    process.exit(1);
}

try {
    console.log('📦 Staging changes...');
    execSync('git add .');

    console.log('📝 Creating commit...');
    // Check if there are changes to commit to avoid error
    const status = execSync('git status --porcelain').toString();
    if (status) {
        execSync('git commit -m "Deploy build: ' + new Date().toLocaleString() + '"');
    } else {
        console.log('ℹ️ No changes to commit.');
    }

    console.log('🚀 Pushing to GitHub...');
    
    // Get the remote URL
    let remoteUrl = execSync('git remote get-url origin').toString().trim();
    
    // If it's an HTTP URL, inject credentials. If it's SSH, we leave it as is 
    // but the user specifically asked for username/password usage.
    if (remoteUrl.startsWith('https://')) {
        const urlObj = new URL(remoteUrl);
        urlObj.username = GITHUB_USERNAME;
        urlObj.password = GITHUB_TOKEN;
        remoteUrl = urlObj.toString();
    }

    // Push using the authenticated URL (this doesn't change the saved origin)
    execSync(`git push "${remoteUrl}"`, { stdio: 'inherit' });
    
    console.log('✅ Deployment push successful!');
} catch (error) {
    console.error('❌ Deployment push failed:', error.message);
    process.exit(1);
}
