# Release Orbit: Deployment Evolution Demo

An Angular application designed to demonstrate the progression from manual deployment to a manually triggered Jenkins pipeline and finally webhook-driven continuous deployment.

## What the audience sees

- An animated deployment orbit and release counter
- Three selectable deployment stages
- The actual Jenkins build number, Git commit, and build time
- A `/health` endpoint served by Nginx

## Prerequisites

The deployment server needs Git and Docker. Jenkins must run on that server or use an agent that can run Docker commands. Allow inbound TCP `8080` for the application and expose Jenkins over HTTPS for GitHub webhook delivery.

## Stage 1: Manual deployment

SSH into the deployment server and run:

```bash
git clone https://github.com/YOUR_USERNAME/deployment-evolution-demo.git
cd deployment-evolution-demo

docker build \
  --build-arg APP_VERSION="manual-v1" \
  --build-arg COMMIT_SHA="$(git rev-parse --short HEAD)" \
  --build-arg BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -t release-orbit:manual .

docker run -d \
  --name release-orbit-app \
  --restart unless-stopped \
  -p 8080:80 \
  release-orbit:manual
```

Open `http://SERVER_IP:8080`. For a second manual release:

```bash
git pull
docker build -t release-orbit:manual .
docker rm -f release-orbit-app
docker run -d --name release-orbit-app --restart unless-stopped -p 8080:80 release-orbit:manual
```

This deliberately exposes the repetitive steps and opportunity for human error.

## Stage 2: Manually triggered Jenkins pipeline

### Required Jenkins plugins

- Pipeline
- Git
- GitHub

Ensure the Jenkins user can access Docker. On Ubuntu this commonly means adding it to the Docker group, then restarting Jenkins:

```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

Create the Jenkins job:

1. Select **New Item**, enter `release-orbit`, choose **Pipeline**, and select **OK**.
2. Under **Pipeline**, select **Pipeline script from SCM**.
3. Choose **Git**, enter your repository URL, and add credentials if the repository is private.
4. Set the branch to `*/main` and the script path to `Jenkinsfile`.
5. Save the job and select **Build Now**.

Jenkins checks out the commit, builds a uniquely tagged Docker image, replaces the old container, and verifies `/health`. Refresh the application to see `build-N` and the deployed commit.

## Stage 3: GitHub webhook deployment

The `githubPush()` trigger is already in the Jenkinsfile. Configure GitHub:

1. Open the repository, then **Settings > Webhooks > Add webhook**.
2. Set **Payload URL** to `https://YOUR_JENKINS_URL/github-webhook/` (the trailing slash matters).
3. Set **Content type** to `application/json`.
4. Add a webhook secret if your Jenkins GitHub configuration uses one.
5. Select **Just the push event**, activate the webhook, and save it.
6. In the Jenkins job, enable **GitHub hook trigger for GITScm polling** if your Jenkins/plugin version exposes that checkbox.

Now edit the page headline or change a stage description, commit, and push:

```bash
git add .
git commit -m "Update release demo"
git push origin main
```

GitHub sends the event, Jenkins runs the same pipeline automatically, and the page displays the new build number and commit.

## Useful checks

```bash
curl http://SERVER_IP:8080/health
curl http://SERVER_IP:8080/deployment.json
docker ps --filter name=release-orbit-app
docker logs release-orbit-app
```

## Local development

```bash
npm install
npm start
```

Then open `http://localhost:4200`.

## Demo narrative

| Stage | Trigger | Repeatability | Main lesson |
|---|---|---:|---|
| Manual | Engineer over SSH | Low | Every release depends on remembered commands |
| Pipeline | Jenkins **Build Now** | High | Deployment logic becomes version-controlled code |
| Webhook | Git push | High | A source change automatically starts delivery |

For a clean demonstration, keep the same server, repository, Dockerfile, and application throughout. Change only how the deployment starts.

commiting to see the changes
