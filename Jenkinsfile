pipeline {
    agent {
        docker {
            image 'nikolaik/python-nodejs:latest' 
            args '-p 8000:8000' 
        }
    }
    stages {
        stage('Install pnpm') { 
            steps {
                sh 'sudo chown -R 114:121 \"/.npm\"'
                sh 'npm install -g pnpm'
            }
        }
        stage('Install') {
          steps {
            sh 'pnpm i'
          }
        }
        stage('Build') {
          steps {
            sh 'pnpm run build'
          }
        }
    }
}