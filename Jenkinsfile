pipeline {
    agent any

    environment {
        // REMPLACE par ton pseudo Docker Hub
        DOCKER_HUB_USER = 'ton-pseudo'
        APP_NAME        = 'phishing-detection'
        REGISTRY        = "${DOCKER_HUB_USER}/${APP_NAME}"
    }

    stages {
        stage('Nettoyage et Préparation') {
            steps {
                deleteDir() // Nettoie l'espace de travail précédent
                checkout scm // Récupère le code depuis GitHub
            }
        }

        stage('Build Image Docker') {
            steps {
                script {
                    sh "docker build -t ${REGISTRY}:${BUILD_NUMBER} ."
                    sh "docker tag ${REGISTRY}:${BUILD_NUMBER} ${REGISTRY}:latest"
                }
            }
        }

        stage('Push sur Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                    sh "echo \$PASS | docker login -u \$USER --password-stdin"
                    sh "docker push ${REGISTRY}:${BUILD_NUMBER}"
                    sh "docker push ${REGISTRY}:latest"
                }
            }
        }

        stage('Déploiement sur Kubernetes') {
            steps {
                script {
                    // Utilise le fichier de config K8s déjà présent sur ton Master-VM
                    sh "kubectl apply -f deployment.yaml"
                    
                    // Force la mise à jour des pods avec la nouvelle image
                    sh "kubectl rollout restart deployment/phishing-app-deployment"
                }
            }
        }
    }

    post {
        success {
            echo "Déploiement terminé avec succès ! Accède à l'app sur http://20.199.189.94:30001"
        }
        failure {
            echo "Le pipeline a échoué. Vérifie les logs de Jenkins."
        }
    }
}