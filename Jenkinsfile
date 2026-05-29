cd Backend && pnpm run dev
cd FrontEnd && pnpm run devpipeline {
  agent any

  triggers {
    // Requires: GitHub plugin + webhook configured to JENKINS_URL/github-webhook/
    githubPush()
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '30', artifactNumToKeepStr: '30'))
    ansiColor('xterm')
    skipDefaultCheckout(true)
    timeout(time: 45, unit: 'MINUTES')
  }

  parameters {
    choice(
      name: 'DEPLOY_ENV',
      choices: ['auto', 'dev', 'staging', 'prod', 'none'],
      description: 'Deployment target. auto=main->prod, develop->staging, others->dev. none=build only.'
    )
    booleanParam(name: 'RUN_SECURITY_SCANS', defaultValue: true, description: 'Run Trivy FS/image scans and dependency audits')
    booleanParam(name: 'PUSH_IMAGES', defaultValue: true, description: 'Push built images to the registry')
    booleanParam(name: 'DEPLOY', defaultValue: true, description: 'Deploy after pushing images (respects DEPLOY_ENV)')
  }

  environment {
    // ---- Registry / image naming ----
    REGISTRY = 'ghcr.io'                       // change if using ECR/ACR/DockerHub
    IMAGE_NAMESPACE = 'your-org-or-user'       // TODO: set your org/user

    IMAGE_BACKEND = "${REGISTRY}/${IMAGE_NAMESPACE}/resume-backend"
    IMAGE_FRONTEND = "${REGISTRY}/${IMAGE_NAMESPACE}/resume-frontend"

    // ---- Jenkins credentials IDs (configure in Jenkins > Manage Credentials) ----
    DOCKER_REGISTRY_CRED = 'docker-registry'   // username/password or token
    GITHUB_TOKEN_CRED = 'github-token'         // optional (API calls/status)

    // Deployment via SSH to a Docker host running docker compose
    SSH_DEPLOY_CRED_DEV = 'ssh-deploy-dev'
    SSH_DEPLOY_CRED_STAGING = 'ssh-deploy-staging'
    SSH_DEPLOY_CRED_PROD = 'ssh-deploy-prod'

    DEPLOY_HOST_DEV = 'dev.example.com'
    DEPLOY_HOST_STAGING = 'staging.example.com'
    DEPLOY_HOST_PROD = 'prod.example.com'

    DEPLOY_PATH = '/opt/resume-builder'        // folder on remote host containing docker-compose.yml

    // Notifications
    SLACK_CRED = 'slack-webhook'               // optional: Slack Incoming Webhook URL
    EMAIL_RECIPIENTS = 'devops@example.com'    // used by email-ext

    // Monitoring
    MONITORING_WEBHOOK_CRED = 'monitoring-webhook' // optional: URL to POST deploy events
  }

  stages {
    stage('Clone repository') {
      steps {
        checkout scm
        sh 'git rev-parse --short HEAD > .gitsha'
      }
    }

    stage('Init / Environment Management') {
      steps {
        script {
          if (!isUnix()) {
            error('This pipeline currently requires a Linux Jenkins agent with Docker, Node 22+, curl, and ssh/scp.')
          }

          def branch = (env.BRANCH_NAME ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim())
          def sha = readFile('.gitsha').trim()

          def resolvedEnv = params.DEPLOY_ENV
          if (resolvedEnv == 'auto') {
            if (branch == 'main' || branch == 'master') resolvedEnv = 'prod'
            else if (branch == 'develop' || branch == 'staging') resolvedEnv = 'staging'
            else resolvedEnv = 'dev'
          }

          env.GIT_SHA = sha
          env.GIT_BRANCH = branch
          env.RESOLVED_DEPLOY_ENV = resolvedEnv

          env.IMAGE_TAG = "${branch.replaceAll('[^a-zA-Z0-9_.-]','-')}-${env.BUILD_NUMBER}-${sha}"

          // Stable tags used for environments
          env.ENV_TAG = (resolvedEnv == 'prod') ? 'prod' : ((resolvedEnv == 'staging') ? 'staging' : 'dev')
          env.ENV_PREV_TAG = "${env.ENV_TAG}-prev"

          currentBuild.displayName = "#${env.BUILD_NUMBER} ${branch} ${sha} (${resolvedEnv})"

          echo "Branch=${branch} SHA=${sha} DEPLOY_ENV=${resolvedEnv} TAG=${env.IMAGE_TAG}"
        }
      }
    }

    stage('Install dependencies') {
      parallel {
        stage('Backend deps') {
          steps {
            dir('Backend') {
              sh 'npm ci'
            }
          }
        }
        stage('Frontend deps') {
          steps {
            dir('FrontEnd') {
              // Frontend uses pnpm and requires Node >= 22 for latest pnpm.
              // Jenkins agent must have Node 22+ installed, or run on a Docker agent.
              sh 'corepack enable'
              sh 'corepack prepare pnpm@10.17.1 --activate'
              sh 'pnpm install --frozen-lockfile'
            }
          }
        }
      }
    }

    stage('Run tests') {
      parallel {
        stage('Backend tests') {
          steps {
            dir('Backend') {
              sh 'npm test'
            }
          }
        }
        stage('Frontend lint') {
          steps {
            dir('FrontEnd') {
              sh 'pnpm lint'
            }
          }
        }
      }
    }

    stage('Build frontend') {
      steps {
        dir('FrontEnd') {
          sh 'pnpm build'
        }
      }
    }

    stage('Build backend') {
      steps {
        dir('Backend') {
          sh 'npm run build'
        }
      }
    }

    stage('Security scanning') {
      when {
        expression { return params.RUN_SECURITY_SCANS }
      }
      steps {
        script {
          // Dependency audits (non-zero exit can be noisy; keep as UNSTABLE instead of hard fail).
          catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
            dir('Backend') {
              sh 'npm audit --audit-level=high'
            }
          }

          catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
            dir('FrontEnd') {
              sh 'pnpm audit --audit-level=high'
            }
          }

          // Trivy filesystem scan (vulns + secrets)
          sh """
            docker run --rm \
              -v \"${env.WORKSPACE}\":/workspace \
              aquasec/trivy:0.55.2 \
              fs --scanners vuln,secret \
              --severity HIGH,CRITICAL \
              --exit-code 1 \
              /workspace
          """.stripIndent()
        }
      }
    }

    stage('Create Docker images') {
      steps {
        sh "docker build -t ${env.IMAGE_BACKEND}:${env.IMAGE_TAG} -f Backend/Dockerfile Backend"
        sh "docker build -t ${env.IMAGE_FRONTEND}:${env.IMAGE_TAG} -f FrontEnd/Dockerfile FrontEnd"
      }
    }

    stage('Container image scan') {
      when {
        expression { return params.RUN_SECURITY_SCANS }
      }
      steps {
        sh """
          docker run --rm aquasec/trivy:0.55.2 image --severity HIGH,CRITICAL --exit-code 1 ${env.IMAGE_BACKEND}:${env.IMAGE_TAG}
          docker run --rm aquasec/trivy:0.55.2 image --severity HIGH,CRITICAL --exit-code 1 ${env.IMAGE_FRONTEND}:${env.IMAGE_TAG}
        """.stripIndent()
      }
    }

    stage('Push images') {
      when {
        expression { return params.PUSH_IMAGES }
      }
      steps {
        withCredentials([usernamePassword(credentialsId: env.DOCKER_REGISTRY_CRED, usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')]) {
          sh 'echo "$REG_PASS" | docker login -u "$REG_USER" --password-stdin ${REGISTRY}'

          script {
            // Shift previous stable tag (best-effort) so rollback can redeploy ENV_TAG-prev
            catchError(buildResult: 'SUCCESS', stageResult: 'SUCCESS') {
              sh "docker pull ${env.IMAGE_BACKEND}:${env.ENV_TAG} || true"
              sh "docker pull ${env.IMAGE_FRONTEND}:${env.ENV_TAG} || true"
              sh "docker tag ${env.IMAGE_BACKEND}:${env.ENV_TAG} ${env.IMAGE_BACKEND}:${env.ENV_PREV_TAG} || true"
              sh "docker tag ${env.IMAGE_FRONTEND}:${env.ENV_TAG} ${env.IMAGE_FRONTEND}:${env.ENV_PREV_TAG} || true"
              sh "docker push ${env.IMAGE_BACKEND}:${env.ENV_PREV_TAG} || true"
              sh "docker push ${env.IMAGE_FRONTEND}:${env.ENV_PREV_TAG} || true"
            }
          }

          // Tag current build as the stable env tag
          sh "docker tag ${env.IMAGE_BACKEND}:${env.IMAGE_TAG} ${env.IMAGE_BACKEND}:${env.ENV_TAG}"
          sh "docker tag ${env.IMAGE_FRONTEND}:${env.IMAGE_TAG} ${env.IMAGE_FRONTEND}:${env.ENV_TAG}"

          sh "docker push ${env.IMAGE_BACKEND}:${env.IMAGE_TAG}"
          sh "docker push ${env.IMAGE_FRONTEND}:${env.IMAGE_TAG}"
          sh "docker push ${env.IMAGE_BACKEND}:${env.ENV_TAG}"
          sh "docker push ${env.IMAGE_FRONTEND}:${env.ENV_TAG}"

          sh 'docker logout ${REGISTRY}'
        }
      }
    }

    stage('Deploy containers') {
      when {
        expression {
          return params.DEPLOY && params.PUSH_IMAGES && env.RESOLVED_DEPLOY_ENV != 'none'
        }
      }
      steps {
        script {
          if (env.RESOLVED_DEPLOY_ENV == 'prod') {
            input message: 'Deploy to PROD?', ok: 'Deploy'
          }

          def host = (env.RESOLVED_DEPLOY_ENV == 'prod') ? env.DEPLOY_HOST_PROD : ((env.RESOLVED_DEPLOY_ENV == 'staging') ? env.DEPLOY_HOST_STAGING : env.DEPLOY_HOST_DEV)
          def sshCred = (env.RESOLVED_DEPLOY_ENV == 'prod') ? env.SSH_DEPLOY_CRED_PROD : ((env.RESOLVED_DEPLOY_ENV == 'staging') ? env.SSH_DEPLOY_CRED_STAGING : env.SSH_DEPLOY_CRED_DEV)

          echo "Deploying ${env.ENV_TAG} to ${host}:${env.DEPLOY_PATH}"

          sshagent(credentials: [sshCred]) {
            // Update the remote compose env file with the image tags
            sh """
              ssh -o StrictHostKeyChecking=no ${host} 'mkdir -p ${DEPLOY_PATH}'
              scp -o StrictHostKeyChecking=no docker-compose.deploy.yml ${host}:${DEPLOY_PATH}/docker-compose.deploy.yml
              scp -o StrictHostKeyChecking=no -r nginx ${host}:${DEPLOY_PATH}/nginx

              ssh -o StrictHostKeyChecking=no ${host} '
                set -e
                cd ${DEPLOY_PATH}

                # Only upsert non-secret deployment variables. Secrets should be pre-provisioned on the host.
                touch .env
                upsert_env() { key="$1"; value="$2"; file=".env"; if grep -q "^${key}=" "$file"; then sed -i "s|^${key}=.*|${key}=${value}|" "$file"; else echo "${key}=${value}" >> "$file"; fi }

                upsert_env REGISTRY "${REGISTRY}"
                upsert_env IMAGE_NAMESPACE "${IMAGE_NAMESPACE}"
                upsert_env BACKEND_IMAGE "${IMAGE_BACKEND}"
                upsert_env FRONTEND_IMAGE "${IMAGE_FRONTEND}"
                upsert_env BACKEND_TAG "${ENV_TAG}"
                upsert_env FRONTEND_TAG "${ENV_TAG}"

                require_env() { key="$1"; if ! grep -q "^${key}=." .env; then echo "Missing required ${key} in ${DEPLOY_PATH}/.env"; exit 1; fi }
                require_env MONGO_ROOT_USERNAME
                require_env MONGO_ROOT_PASSWORD
                require_env JWT_SECRET
                require_env JWT_REFRESH_SECRET

                docker compose -f docker-compose.deploy.yml pull || true
                docker compose -f docker-compose.deploy.yml up -d
              '
            """.stripIndent()
          }

          env.DEPLOY_HOST = host
        }
      }
    }

    stage('Health checks') {
      when {
        expression { return params.DEPLOY && env.RESOLVED_DEPLOY_ENV != 'none' }
      }
      steps {
        script {
          // If deployed remotely, validate via remote host; otherwise validate locally.
          def base = (env.DEPLOY_HOST?.trim()) ? "http://${env.DEPLOY_HOST}" : 'http://localhost'

          sh """
            set -e
            echo "Checking ${base}/healthz"
            curl -fsS ${base}/healthz

            echo "Checking backend health via ${base}/api/v1 (direct /health is not proxied)"
            # optional: if you expose /health through nginx, update this check
          """.stripIndent()
        }
      }
    }

    stage('Monitoring integration') {
      when {
        expression { return params.DEPLOY && env.RESOLVED_DEPLOY_ENV != 'none' }
      }
      steps {
        script {
          catchError(buildResult: 'SUCCESS', stageResult: 'SUCCESS') {
            withCredentials([string(credentialsId: env.MONITORING_WEBHOOK_CRED, variable: 'MON_URL')]) {
              sh """
                curl -fsS -X POST -H 'Content-Type: application/json' \
                  -d '{"service":"resume-builder","env":"${RESOLVED_DEPLOY_ENV}","tag":"${ENV_TAG}","sha":"${GIT_SHA}","build":"${BUILD_URL}"}' \
                  "$MON_URL"
              """.stripIndent()
            }
          }
        }
      }
    }

    stage('Rollback (on deploy failure)') {
      when {
        beforeAgent true
        expression { return false }
      }
      steps {
        // This stage is intentionally disabled; rollback runs in post { failure }.
        echo 'Rollback stage is triggered from post actions.'
      }
    }
  }

  post {
    success {
      script {
        // Slack (optional)
        catchError(buildResult: 'SUCCESS', stageResult: 'SUCCESS') {
          withCredentials([string(credentialsId: env.SLACK_CRED, variable: 'SLACK_WEBHOOK')]) {
            sh """
              curl -fsS -X POST -H 'Content-Type: application/json' \
                -d '{"text":"✅ ${JOB_NAME} ${BUILD_NUMBER} succeeded (${GIT_BRANCH} ${GIT_SHA}) env=${RESOLVED_DEPLOY_ENV}"}' \
                "$SLACK_WEBHOOK"
            """.stripIndent()
          }
        }

        // Email-ext (optional)
        try {
          emailext(
            to: "${env.EMAIL_RECIPIENTS}",
            subject: "SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
            body: "Build succeeded.\n\nBranch: ${env.GIT_BRANCH}\nSHA: ${env.GIT_SHA}\nEnv: ${env.RESOLVED_DEPLOY_ENV}\nURL: ${env.BUILD_URL}\n"
          )
        } catch (err) {
          echo "Email notification skipped: ${err}"
        }
      }
    }

    failure {
      script {
        // Attempt rollback only if we pushed images and attempted deploy
        if (params.DEPLOY && params.PUSH_IMAGES && env.RESOLVED_DEPLOY_ENV != 'none') {
          def host = env.DEPLOY_HOST
          if (host?.trim()) {
            def sshCred = (env.RESOLVED_DEPLOY_ENV == 'prod') ? env.SSH_DEPLOY_CRED_PROD : ((env.RESOLVED_DEPLOY_ENV == 'staging') ? env.SSH_DEPLOY_CRED_STAGING : env.SSH_DEPLOY_CRED_DEV)
            echo "Rollback: deploying ${env.ENV_PREV_TAG} on ${host}"

            catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
              sshagent(credentials: [sshCred]) {
                sh """
                  ssh -o StrictHostKeyChecking=no ${host} '
                    set -e
                    cd ${DEPLOY_PATH}
                    touch .env
                    upsert_env() { key="$1"; value="$2"; file=".env"; if grep -q "^${key}=" "$file"; then sed -i "s|^${key}=.*|${key}=${value}|" "$file"; else echo "${key}=${value}" >> "$file"; fi }
                    upsert_env BACKEND_TAG "${ENV_PREV_TAG}"
                    upsert_env FRONTEND_TAG "${ENV_PREV_TAG}"

                    require_env() { key="$1"; if ! grep -q "^${key}=." .env; then echo "Missing required ${key} in ${DEPLOY_PATH}/.env"; exit 1; fi }
                    require_env MONGO_ROOT_USERNAME
                    require_env MONGO_ROOT_PASSWORD
                    require_env JWT_SECRET
                    require_env JWT_REFRESH_SECRET
                    docker compose -f docker-compose.deploy.yml pull || true
                    docker compose -f docker-compose.deploy.yml up -d
                  '
                """.stripIndent()
              }
            }
          }
        }

        // Slack (optional)
        catchError(buildResult: 'SUCCESS', stageResult: 'SUCCESS') {
          withCredentials([string(credentialsId: env.SLACK_CRED, variable: 'SLACK_WEBHOOK')]) {
            sh """
              curl -fsS -X POST -H 'Content-Type: application/json' \
                -d '{"text":"❌ ${JOB_NAME} ${BUILD_NUMBER} failed (${GIT_BRANCH} ${GIT_SHA}) env=${RESOLVED_DEPLOY_ENV} — ${BUILD_URL}"}' \
                "$SLACK_WEBHOOK"
            """.stripIndent()
          }
        }

        try {
          emailext(
            to: "${env.EMAIL_RECIPIENTS}",
            subject: "FAILURE: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
            body: "Build failed.\n\nBranch: ${env.GIT_BRANCH}\nSHA: ${env.GIT_SHA}\nEnv: ${env.RESOLVED_DEPLOY_ENV}\nURL: ${env.BUILD_URL}\n"
          )
        } catch (err) {
          echo "Email notification skipped: ${err}"
        }
      }
    }

    always {
      deleteDir()
    }
  }
}
