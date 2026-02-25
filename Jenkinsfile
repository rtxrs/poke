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
                sh 'npm install -g pnpm && pnpm install --frozen-lockfile --ignore-scripts'
                sh 'npx tsc --version'
                sh 'npx tsc --noEmit --non-interactive || true'
                sh 'pnpm run build'
            }
        }
        
        stage('Deploy to Production') {
            steps {
                echo 'Deploying POKE to production...'
                withCredentials([usernamePassword(credentialsId: 'github-rtxrs', passwordVariable: 'GITHUB_TOKEN', usernameVariable: 'GITHUB_USER')]) {
                    sshagent(['gcp-web-server']) {
                        sh """
                            ssh -o StrictHostKeyChecking=no rafael@\${TARGET_SERVER} "
                                sudo bash <<'EOF'
                                    # 1. Setup the environment (Literal values)
                                    export NODE_BIN_DIR='/root/.nvm/versions/node/v24.4.0/bin'
                                    export PNPM_BIN_DIR='/root/.nvm/versions/node/v24.4.0/bin'
                                    
                                    # 2. Update PATH (Use \\\\\\\$ to escape for Groovy AND Shell)
                                    export PATH=\\\$NODE_BIN_DIR:\\\$PNPM_BIN_DIR:\\\$PATH
                                    
                                    # Verify binaries
                                    echo 'Node version:'
                                    node --version
                                    echo 'PNPM version:'
                                    pnpm --version
                                    echo 'TypeScript version:'
                                    pnpm exec tsc --version
                                    
                                    # 3. Navigate and pull
                                    cd /var/www/poke
                                    git config --global --add safe.directory /var/www/poke
                                    git pull https://\${GITHUB_USER}:\${GITHUB_TOKEN}@github.com/rtxrs/poke.git main
                                    
                                    # 4. Execute commands
                                    pnpm install --ignore-scripts
                                    pnpm exec tsc --version
                                    
                                    # Run vite build directly (skip tsc as it was already run in Jenkins)
                                    pnpm exec vite build
                                    
                                    # 5. Restart or Start Services
                                    pm2 restart ecosystem.config.cjs
                                    pm2 save
EOF
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
