pipeline {
    agent any

    environment {
        REPO_URL             = 'https://github.com/thisissvhari-1810/Firstproject.git'
        GIT_CREDENTIALS      = 'git-hub-token'
        BRANCH               = 'main'

        // Public address users browse to. Change if your VM IP changes.
        VM_HOST              = '140.245.254.149'
        CLIENT_PORT          = '3000'
        SERVER_PORT          = '4000'

        // Force a stable compose project name so containers/volumes stay
        // consistent regardless of the Jenkins workspace folder name.
        COMPOSE_PROJECT_NAME = 'quickpics'

        // -------------------------------------------------------------------
        // App secrets. Move back into Jenkins Credentials for real production.
        // -------------------------------------------------------------------
        COOKIE_SECRET     = '34859e946e38f4936d07b6432dce6feeae2dabee8563de8c8310ae7c5c463b86'
        POSTGRES_USER     = 'postgres'
        POSTGRES_PASSWORD = 'Qp_5tR8nG_p@ssw0rd_change_me'
        POSTGRES_DB       = 'quickpics'
        SERVER_NODE_ENV   = 'development'
    }

    stages {

        stage('Clean Workspace') {
            steps { cleanWs() }
        }

        stage('Checkout Source') {
            steps {
                git branch: "${BRANCH}",
                    credentialsId: "${GIT_CREDENTIALS}",
                    url: "${REPO_URL}"
            }
        }

        stage('Verify Docker') {
            steps {
                sh '''
                set -e
                docker --version

                # Self-heal: install docker compose plugin if missing.
                if ! docker compose version >/dev/null 2>&1; then
                    echo "docker compose plugin missing - installing into $HOME/.docker/cli-plugins"
                    ARCH=$(uname -m)
                    mkdir -p "$HOME/.docker/cli-plugins"
                    curl -fsSL "https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-${ARCH}" \
                        -o "$HOME/.docker/cli-plugins/docker-compose"
                    chmod +x "$HOME/.docker/cli-plugins/docker-compose"
                fi

                docker compose version
                '''
            }
        }

        stage('Prepare .env') {
            steps {
                sh '''
                cat > .env <<EOF
CORS_ORIGIN=http://${VM_HOST}:${CLIENT_PORT}
API_URL=http://${VM_HOST}:${SERVER_PORT}/graphql
COOKIE_SECRET=${COOKIE_SECRET}
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=${POSTGRES_DB}
SERVER_NODE_ENV=${SERVER_NODE_ENV}
EOF
                echo "Wrote .env (values redacted):"
                sed 's/=.*/=***/' .env
                '''
            }
        }

        stage('Build & Deploy') {
            steps {
                sh '''
                set -e
                docker compose down --remove-orphans || true
                docker compose build --no-cache
                docker compose up -d
                docker image prune -f
                '''
            }
        }

        stage('Wait for Health') {
            steps {
                sh '''
                echo "Waiting for server to become ready..."
                for i in $(seq 1 60); do
                    if docker compose logs server 2>&1 | grep -q "Server running on port"; then
                        echo "Server is up."
                        exit 0
                    fi
                    STATE=$(docker inspect -f '{{.State.Status}}' quickpics-server 2>/dev/null || echo "missing")
                    if [ "$STATE" = "exited" ]; then
                        echo "quickpics-server has exited. Logs:"
                        docker compose logs --tail=200 server
                        exit 1
                    fi
                    sleep 2
                done
                echo "Server did not become ready in time. Logs:"
                docker compose logs --tail=200
                exit 1
                '''
            }
        }

        stage('Seed DB (first run only)') {
            steps {
                sh '''
                EXISTING=$(docker compose exec -T -e PGPASSWORD="${POSTGRES_PASSWORD}" postgres \
                    psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -tAc 'SELECT COUNT(*) FROM "User";' 2>/dev/null \
                    | tr -d '[:space:]' || echo 0)

                if [ -z "$EXISTING" ] || [ "$EXISTING" = "0" ]; then
                    echo "User table empty - seeding demo users..."
                    docker compose run --rm server yarn prisma db seed
                else
                    echo "Users already exist ($EXISTING). Skipping seed."
                fi
                '''
            }
        }

        stage('Verify Running Containers') {
            steps { sh 'docker compose ps' }
        }
    }

    post {
        success {
            echo "Application deployed successfully!"
            echo "Frontend: http://${VM_HOST}:${CLIENT_PORT}"
            echo "GraphQL:  http://${VM_HOST}:${SERVER_PORT}/graphql"
        }
        failure {
            echo "Deployment failed!"
            sh '''
            if docker compose version >/dev/null 2>&1 && [ -f docker-compose.yml ]; then
                echo "=== last 200 lines of compose logs ==="
                docker compose logs --tail=200 || true
                echo "=== container status ==="
                docker compose ps -a || true
            else
                echo "(compose unavailable or no compose file in workspace - skipping logs)"
            fi
            '''
        }
        always {
            sh 'docker ps -a'
        }
    }
}
