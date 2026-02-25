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
                            # 1. Create tar of source files (excluding node_modules, .git, dist)
                            tar -czf source.tar.gz \\
                                --exclude='node_modules' \\
                                --exclude='.git' \\
                                --exclude='dist' \\
                                --exclude='*.log' \\
                                --exclude='.env*' \\
                                ecosystem.config.cjs \\
                                package.json \\
                                pnpm-lock.yaml \\
                                tsconfig.json \\
                                vite.config.ts \\
                                routes/ \\
                                services/ \\
                                data/ \\
                                public/ \\
                                config.ts \\
                                server.ts
                            
                            # 2. Create dist.tar.gz from built files
                            tar -czf dist.tar.gz dist/
                            
                            # 3. Copy both to server temp location
                            scp -o StrictHostKeyChecking=no source.tar.gz dist.tar.gz rafael@\${TARGET_SERVER}:/tmp/
                            
                            # 4. Extract on server (preserve existing node_modules)
                            ssh -o StrictHostKeyChecking=no rafael@\${TARGET_SERVER} "
                                cd /tmp
                                # Remove old files but preserve node_modules
                                sudo rm -rf \${TARGET_PATH}/dist
                                sudo rm -f \${TARGET_PATH}/ecosystem.config.cjs
                                sudo rm -f \${TARGET_PATH}/package.json
                                sudo rm -f \${TARGET_PATH}/pnpm-lock.yaml
                                sudo rm -f \${TARGET_PATH}/tsconfig.json
                                sudo rm -f \${TARGET_PATH}/vite.config.ts
                                sudo rm -rf \${TARGET_PATH}/routes
                                sudo rm -rf \${TARGET_PATH}/services
                                sudo rm -rf \${TARGET_PATH}/data
                                sudo rm -rf \${TARGET_PATH}/public
                                sudo rm -f \${TARGET_PATH}/config.ts
                                sudo rm -f \${TARGET_PATH}/server.ts
                                
                                # Extract new files
                                sudo tar -xzf source.tar.gz -C \${TARGET_PATH}
                                sudo tar -xzf dist.tar.gz -C \${TARGET_PATH}
                                rm source.tar.gz dist.tar.gz
                            "
                            
                            # 5. Install dependencies using server's pnpm
                            ssh -o StrictHostKeyChecking=no rafael@\${TARGET_SERVER} "
                                cd \${TARGET_PATH}
                                export NODE_BIN_DIR='/root/.nvm/versions/node/v24.4.0/bin'
                                export PNPM_BIN_DIR='/root/.nvm/versions/node/v24.4.0/bin'
                                export PATH=\\\$NODE_BIN_DIR:\\\$PNPM_BIN_DIR:\\\$PATH
                                sudo \\\$PNPM_BIN_DIR/pnpm install --prod --frozen-lockfile
                            "
                            
                            # 6. Restart PM2
                            ssh -o StrictHostKeyChecking=no rafael@\${TARGET_SERVER} "
                                cd \${TARGET_PATH}
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
