GitHub Actions: build & push Docker image

What it does
- When you push a semver tag (e.g. `v1.2.3`) this workflow builds the Docker image using the repository `Dockerfile` and pushes two tags to Docker Hub:
  - `DOCKERHUB_USERNAME/secretary-app:v1.2.3`
  - `DOCKERHUB_USERNAME/secretary-app:latest`

Required repository secrets
- `DOCKERHUB_USERNAME` - Docker Hub username
- `DOCKERHUB_TOKEN` - Docker Hub access token (or password)

How to trigger
- Create a git tag and push it, for example:

```powershell
# from repo root on Windows PowerShell
git tag v1.0.0
git push origin v1.0.0
```

Notes
- I recommend using a manual process for database initialization and seeding. See Portainer instructions in the project README for how to run `flask db init` / `flask seed` manually.
