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
        // SERVER_SSH_USER = 'rafael' // Assuming 'rafael' is the user for SSH
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 25, unit: 'MINUTES') // Increased timeout for potentially longer builds/deploys
        timestamps()
    }
    
    stages {
        stage('Clean Workspace') {
            steps {
                echo 'Cleaning Jenkins workspace...'
                cleanWs() // Cleans the Jenkins workspace
            }
        }
        
        stage('Checkout') {
            steps {
                echo 'Checking out source code from SCM...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing project dependencies for build and test...'
                sh 'pnpm --version || npm install -g pnpm' // Ensure pnpm is available
                sh 'pnpm install --frozen-lockfile' // Install all dependencies
            }
        }
        
        stage('Lint and Test') {
            steps {
                echo 'Running TypeScript checks and unit/integration tests...'
                sh 'pnpm tsc --noEmit' // Fail on type errors
                sh 'pnpm test' // Run unit/integration tests
                // Uncomment if Playwright E2E tests are configured for CI
                // sh 'npx playwright test'
            }
        }
        
        stage('Build') {
            steps {
                echo 'Building application for production...'
                sh 'pnpm run build' // This command runs 'tsc && vite build'
                archiveArtifacts artifacts: 'dist/**/*', fingerprint: true // Archive built output
            }
        }
        
        stage('Deploy to Production') {
            steps {
                echo 'Initiating deployment to production server...'
                withCredentials([usernamePassword(credentialsId: 'github-rtxrs', passwordVariable: 'GITHUB_TOKEN', usernameVariable: 'GITHUB_USER')]) {
                    sshagent(['gcp-web-server']) { // Using the existing SSH agent for GCP server access
                        sh """
                            # Create a temporary directory on the target server for staging the deployment
                            DEPLOY_TMP_DIR="/tmp/jenkins_deploy_\$(date +%Y%m%d%H%M%S)"
                            ssh -o StrictHostKeyChecking=no rafael@\${TARGET_SERVER} "mkdir -p \${DEPLOY_TMP_DIR}"

                            # Create a temporary directory outside the workspace for the tarball
                            JENKINS_TAR_TMP_DIR="/tmp/jenkins_tar_tmp_\$(date +%Y%m%d%H%M%S)"
                            mkdir -p \${JENKINS_TAR_TMP_DIR}
                            TARBALL_PATH="\${JENKINS_TAR_TMP_DIR}/deployment.tar.gz"

                            # 1. Create a combined tarball of all necessary files (source code and built 'dist')
                            # The tar command will operate on the current directory (${WORKSPACE}),
                            # but create the tarball in the /tmp location.
                            tar -czf "\${TARBALL_PATH}" \\
                                --exclude='node_modules' \\
                                --exclude='.git' \\
                                --exclude='*.log' \\
                                --exclude='.env*' \\
                                --exclude='data' \\
                                . # Archive contents of current directory

                            # 2. Copy the combined archive to the server's temporary staging directory
                            scp -o StrictHostKeyChecking=no "\${TARBALL_PATH}" rafael@\${TARGET_SERVER}:\${DEPLOY_TMP_DIR}/

                            # Clean up the temporary directory on the Jenkins agent
                            rm -rf \${JENKINS_TAR_TMP_DIR}

                            # 3. Execute server-side deployment operations
                            ssh -o StrictHostKeyChecking=no rafael@\${TARGET_SERVER} "
                                # Ensure the target application directory exists and has correct permissions
                                sudo mkdir -p \${TARGET_PATH}
                                sudo chown rafael:rafael \${TARGET_PATH}

                                # Extract the new deployment archive into the target application directory
                                # Using -C \${TARGET_PATH} ensures extraction directly into the app directory
                                cd \${DEPLOY_TMP_DIR}
                                tar -xzf deployment.tar.gz -C \${TARGET_PATH}

                                # Clean up the temporary deployment archive and directory on the server
                                rm deployment.tar.gz
                                cd /tmp
                                rm -rf \${DEPLOY_TMP_DIR}

                                # Navigate to the application's root directory on the server
                                cd \${TARGET_PATH}

                                # Source NVM to ensure 'pnpm' is in the PATH for the 'rafael' user
                                # This assumes NVM is installed and configured for the user on the target server.
                                export NVM_DIR=\\"/root/.nvm\\" # Adjust this path if NVM is installed elsewhere
                                [ -s \\"\\\$NVM_DIR/nvm.sh\\" ] && \\. \\"\\\$NVM_DIR/nvm.sh\\"  # Loads nvm
                                [ -s \\"\\\$NVM_DIR/bash_completion\\" ] && \\. \\"\\\$NVM_DIR/bash_completion\\"  # Loads nvm bash_completion

                                # Install production-only dependencies
                                # '--frozen-lockfile' ensures reproducible builds
                                pnpm install --prod --frozen-lockfile

                                # Restart the application using PM2
                                # 'sudo pm2 restart \${SERVICE_NAME}' attempts to restart an existing process
                                # '|| sudo pm2 start ecosystem.config.cjs --name \${SERVICE_NAME}' starts it if not found
                                sudo pm2 restart \${SERVICE_NAME} || sudo pm2 start ecosystem.config.cjs --name \${SERVICE_NAME}
                                sudo pm2 save # Save PM2 process list to retain after reboot
                            "
                        """
                    }
                }
            }
        }
    }
    
    post {
        always {
            // Jenkins agent workspace cleanup is handled by deployment steps,
            // as the tarball is created in and cleaned up from a temporary directory.
            echo 'Jenkins agent workspace cleanup handled by deployment steps.'
        }
        success {
            echo 'POKE build and deployment completed successfully!'
        }
        failure {
            echo 'POKE build and deployment failed! Check logs for details.'
            // Optionally, add notifications here (e.g., email, Slack)
        }
    }
}
