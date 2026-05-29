# GitHub Actions CI/CD for ResumeBuilderDevOps

This document outlines the CI/CD pipeline implemented using GitHub Actions.

## 1. Workflow Overview (`.github/workflows/ci-cd.yml`)

The pipeline is defined in a single workflow file and uses a multi-job strategy to build, test, scan, and deploy the application.

**Triggers:**
- **Push:** to `main`, `develop`, or any `feat/**` branch.
- **Pull Request:** against `main` or `develop`.

**Jobs:**
1.  **`setup`**:
    - Determines and exports key variables for other jobs:
        - `image_tag`: A unique tag for the commit (`<branch>-<sha>`).
        - `env_tag`: A stable tag for the environment (`dev`, `staging`, or `prod`).
        - `deploy_env`: The target environment name.
        - `run_deploy`: A boolean flag that is `true` only for direct pushes to `main` or `develop`.

2.  **`build-and-test-backend`**:
    - Runs on an Ubuntu agent.
    - Uses Node.js 20.
    - Caches `npm` dependencies based on `package-lock.json`.
    - Runs `npm ci`, `npm test`, and `npm audit`.
    - Builds the TypeScript source code.

3.  **`build-and-test-frontend`**:
    - Runs on an Ubuntu agent.
    - Uses Node.js 22 and `pnpm` version 10.
    - Caches the `pnpm` store based on `pnpm-lock.yaml`.
    - Runs `pnpm install`, `pnpm lint`, and `pnpm audit`.
    - Builds the Next.js application.

4.  **`build-and-push-docker`**:
    - Depends on the success of the build and test jobs.
    - Logs into Docker Hub using secrets.
    - Builds and pushes Docker images for both `backend` and `frontend`.
    - Tags images with both the unique `image_tag` and the stable `env_tag`.
    - Uses GitHub Actions cache (`type=gha`) for Docker layers to speed up subsequent builds.

5.  **`scan-images`**:
    - Depends on the Docker images being pushed.
    - Uses `aquasecurity/trivy-action` to scan both the backend and frontend images for high and critical severity vulnerabilities.
    - The build will fail if critical vulnerabilities are found.

6.  **`deploy`**:
    - This job only runs on direct pushes to `main` or `develop`.
    - It uses a GitHub Environment (`dev`, `staging`, or `prod`) which provides protection rules and environment-specific secrets.
    - Connects to the target server via SSH using `appleboy/ssh-action`.
    - Creates a `.env` file on the server with deployment variables and runtime secrets from GitHub Actions.
    - Copies the `docker-compose.deploy.yml` and `nginx/default.conf` files to the server.
    - Runs `docker compose pull` and `docker compose up -d` to deploy the new versions.

## 2. GitHub Secrets and Environments

To make this workflow operational, you need to configure secrets and environments in your GitHub repository settings.

### Secrets (`Settings > Secrets and variables > Actions`)

-   `DOCKERHUB_USERNAME`: Your Docker Hub username.
-   `DOCKERHUB_TOKEN`: A Docker Hub access token with read/write permissions.
-   `DEPLOY_HOST`: The IP address or domain of your deployment server.
-   `DEPLOY_USERNAME`: The username for SSH login.
-   `DEPLOY_SSH_KEY`: The private SSH key for the user.
-   `DEPLOY_HOST_URL`: The public URL of the deployed application (used for the environment link).
-   `OPENAI_API_KEY`: OpenAI API key used by the backend AI routes.
-   `URLBOX_API_KEY`: Optional Urlbox API key for cloud PDF rendering.

**Runtime Secrets:**
The deployment writes CI/CD secrets into `/opt/resume-builder/.env` on the VPS. You can also pre-provision them manually on the server if you deploy without GitHub Actions.
-   `MONGO_ROOT_USERNAME`
-   `MONGO_ROOT_PASSWORD`
-   `JWT_SECRET`
-   `JWT_REFRESH_SECRET`
-   `OPENAI_API_KEY`
-   `URLBOX_API_KEY` (optional)

### Environments (`Settings > Environments`)

Create three environments: `dev`, `staging`, and `prod`.
-   **Protection Rules:** For the `prod` environment, consider adding a protection rule for "Required reviewers" to enforce a manual approval step before deployment to production.
-   **Environment Secrets:** You can scope the `DEPLOY_*` secrets to specific environments if you have different servers for dev, staging, and production.

## 3. Branch Protection Strategy

To enforce a high standard of quality and security, configure branch protection rules for `main` and `develop`.

**Go to `Settings > Branches > Add branch protection rule`**

-   **Branch name pattern:** `main` (and create another for `develop`)
-   **Require a pull request before merging:** Enabled.
-   **Require approvals:** At least 1.
-   **Require status checks to pass before merging:** Enabled.
    -   Select the required jobs:
        -   `build-and-test-backend`
        -   `build-and-test-frontend`
        -   `scan-images`
-   **Require conversation resolution before merging:** Enabled.
-   **Require linear history:** Recommended.
-   **Enforce all of the above for administrators:** Recommended.

## 4. CI Optimization Techniques

-   **Dependency Caching:** The workflow caches `npm` and `pnpm` dependencies to speed up the `install` steps in subsequent runs.
-   **Docker Layer Caching:** The `build-and-push-docker` job uses the GitHub Actions cache (`type=gha`) to cache Docker image layers, which significantly reduces build times.
-   **Parallel Execution:** The `build-and-test-backend` and `build-and-test-frontend` jobs run in parallel to reduce the total workflow duration.
-   **Multi-Job Workflow:** Breaking the pipeline into multiple jobs allows for fine-grained control and clear separation of concerns. The `needs` keyword ensures that jobs run in the correct order.

## 5. Production-Grade Best Practices

-   **Immutable Infrastructure:** Docker images are treated as immutable artifacts. We never modify a running container.
-   **Secrets Management:** All secrets are stored in GitHub's encrypted secrets store. The deployment script is designed to never overwrite secrets on the server.
-   **Vulnerability Scanning:** Integrated container scanning with Trivy helps catch security issues before they reach production.
-   **Branching Strategy:** The workflow is designed around a GitFlow-like model where `develop` is for staging and `main` is for production.
-   **Environment Gates:** Using GitHub Environments with protection rules (like manual approval for production) provides a crucial safety net.
-   **Least Privilege:** The SSH key used for deployment should have limited permissions on the server.
-   **Health Checks:** The `docker-compose.yml` file includes health checks for all services, ensuring the application is running correctly after deployment.
