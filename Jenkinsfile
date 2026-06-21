pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        IMAGE_NAME = 'release-orbit'
        CONTAINER_NAME = 'release-orbit-app'
        HOST_PORT = '9698'
    }

    options {
        disableConcurrentBuilds()
    }

    stages {

        stage('clean workspace') {
            steps {
                cleanWs()
            }
        }


        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    env.SHORT_COMMIT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    env.BUILD_DATE = sh(script: 'date -u +%Y-%m-%dT%H:%M:%SZ', returnStdout: true).trim()
                }
                sh '''
                    docker build \
                      --build-arg BUILD_ID="${BUILD_NUMBER}" \
                      --build-arg APP_VERSION="build-${BUILD_NUMBER}" \
                      --build-arg COMMIT_SHA="${SHORT_COMMIT}" \
                      --build-arg BUILD_DATE="${BUILD_DATE}" \
                      -t "${IMAGE_NAME}:${BUILD_NUMBER}" .
                '''
            }
        }

        stage('Deploy Container') {
            steps {
                sh '''
                    docker rm -f "${CONTAINER_NAME}" 2>/dev/null || true
                    docker run -d \
                      --name "${CONTAINER_NAME}" \
                      --restart unless-stopped \
                      -p "${HOST_PORT}:80" \
                      "${IMAGE_NAME}:${BUILD_NUMBER}"
                '''
            }
        }

        stage('Verify') {
            steps {
                sh '''
                    for attempt in 1 2 3 4 5; do
                      if curl --fail --silent "http://127.0.0.1:${HOST_PORT}/health"; then
                        exit 0
                      fi
                      sleep 2
                    done
                    docker logs "${CONTAINER_NAME}"
                    exit 1
                '''
            }
        }
    }

    post {
        success {
            echo "Release Orbit build ${BUILD_NUMBER} is live on port ${HOST_PORT}."
        }
        cleanup {
            sh 'docker image prune -f'
        }
    }
}
