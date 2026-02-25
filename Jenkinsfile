// POKE - Pokemon Tracking Service
// Deploys to: GCP web-server (34.53.125.33)

pipeline {
    agent any
    
    tools {
        nodejs 'nodejs'
    }
    
    environment {
        TARGET_SERVER = '34.53.125.33'
        TARGET_PATH = '/var/www/poke'
        SERVICE_NAME = 'poke'
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 20, unit: 'MINUTES')
        timestamps()
    }
    
    stages {
        stage('Checkout and Build') {
            steps {
                echo 'Checking out and building POKE...'
                checkout scm
                sh 'pnpm --version || npm install -g pnpm'
                sh 'pnpm install --frozen-lockfile --ignore-scripts'
                sh 'npx tsc --version'
                sh 'npx tsc --noEmit || true'
                sh 'pnpm run build'
            }
        }
        
        stage('Deploy to Production') {
            steps {
                echo 'Deploying POKE to production...'
                withCredentials([usernamePassword(credentialsId: 'github-rtxrs', passwordVariable: 'GITHUB_TOKEN', usernameVariable: 'GITHUB_USER')]) {
                    sshagent(['gcp-web-server']) {
                        sh """
                            # 1. Sync dist folder from Jenkins to server (fast!)
                            rsync -avz --delete -e ssh \\
                                --exclude='node_modules' \\
                                --exclude='.git' \\
                                ./dist/ \\
                                rafael@\${TARGET_SERVER}:\${TARGET_PATH}/dist/
                            
                            # 2. Sync package files for server reference
                            rsync -avz -e ssh \\
                                --exclude='node_modules' \\
                                --exclude='.git' \\
                                --include='package.json' \\
                                --include='pnpm-lock.yaml' \\
                                --include='ecosystem.config.cjs' \\
                                --include='tsconfig.json' \\
                                --include='vite.config.ts' \\
                                --include='server.ts' \\
                                --include='config.ts' \\
                                --include='routes/' \\
                                --include='services/' \\
                                --include='public/' \\
                                --include='data/' \\
                                --exclude='*' \\
                                ./ \\
                                rafael@\${TARGET_SERVER}:\${TARGET_PATH}/
                            
                            # 3. Restart PM2 on server
                            ssh -o StrictHostKeyChecking=no rafael@\${TARGET_SERVER} "
                                sudo pm2 restart ecosystem.config.cjs
                                sudo pm2 save
                            "
                        """
                    }
                }
            }
        }
        
    }
    
    post {
        success {
            echo 'POKE build and deployment completed!'
        }
        failure {
            echo 'POKE build failed!'
        }
    }
}
