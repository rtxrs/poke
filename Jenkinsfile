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
                            # 1. Create dist.tar.gz from built files
                            tar -czf dist.tar.gz dist/
                            
                            # 2. Copy to server temp location
                            scp -o StrictHostKeyChecking=no dist.tar.gz rafael@\${TARGET_SERVER}:/tmp/
                            
                            # 3. Extract and move on server with sudo
                            ssh -o StrictHostKeyChecking=no rafael@\${TARGET_SERVER} "
                                cd /tmp
                                sudo rm -rf \${TARGET_PATH}/dist
                                sudo tar -xzf dist.tar.gz -C \${TARGET_PATH}
                                rm dist.tar.gz
                            "
                            
                            # 4. Restart PM2
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
