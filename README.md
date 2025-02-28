# Version Bump Action

This action automatically bumps your project version based on commit messages.

## How It Works

- **Fetch Tags:** Retrieves all git tags.
- **Determine Version:** Finds the latest version in `X.Y` format.
- **Check Commits:** Looks for `#major` in commit messages to decide on a major or minor bump.
- **Tag & Push:** Creates and pushes a new tag.

## Usage

Include this step in your GitHub Actions workflow:

```yaml
- uses: actions/checkout@v3
- name: Bump Version
  uses: ./path-to-your-action
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

_Replace `./path-to-your-action` with your action's path or repository._
