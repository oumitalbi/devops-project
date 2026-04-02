pipeline {
    agent any

    environment {
        DOCKER_HUB_USER = '1oumaima2'
        IMAGE_NAME = 'gestion-produits'
        IMAGE_TAG = '1'
        KUBECONFIG_PATH = '/var/lib/jenkins/config'
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }
        stage('Unit Tests') {
            steps {
                script {
                    echo "--- Phase de Test : Vérification de la logique métier ---"
                    // On installe les dépendances nécessaires à l'exécution des tests
                    sh "pip install -r requirements.txt"
                    // On lance les tests unitaires avec pytest
                    sh "python3 -m pytest tests/"
                }
            }
        }
        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${DOCKER_HUB_USER}/${IMAGE_NAME}:${IMAGE_TAG} ."
            }
        }

        stage('Push to Docker Hub') {
            steps {
                // MISE À JOUR : J'ai mis 'docker-hub-creds' comme sur ta photo
                withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                    sh "echo \$DOCKER_PASSWORD | docker login -u \$DOCKER_USERNAME --password-stdin"
                    sh "docker push ${DOCKER_HUB_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    sh "KUBECONFIG=${KUBECONFIG_PATH} kubectl apply -f deployment.yaml"
                    // Force le redémarrage pour être sûr que Kubernetes prend la nouvelle image
                    sh "KUBECONFIG=${KUBECONFIG_PATH} kubectl rollout restart deployment/product-app-deployment"
                }
            }
        }
    }
}