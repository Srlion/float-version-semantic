const core = require("@actions/core");
const { execSync } = require("child_process");

try {
  // Get inputs (GitHub token for pushing)
  const token = core.getInput("github_token", { required: true });

  execSync("git fetch --tags --force");

  const tagListOutput = execSync("git tag").toString().trim();
  const tags = tagListOutput ? tagListOutput.split("\n") : [];

  // Find the latest version tag (format X.Y) from tags
  let latestMajor = 0;
  let latestMinor = 0;
  let foundTag = false;
  for (const tag of tags) {
    const match = tag.match(/^(\d+)\.(\d+)$/); // match tags like "X.Y"
    if (!match) continue; // skip non-version tags
    foundTag = true;
    const [, majorStr, minorStr] = match;
    const major = parseInt(majorStr);
    const minor = parseInt(minorStr);
    // Update latest version if this tag is higher
    if (major > latestMajor || (major === latestMajor && minor > latestMinor)) {
      latestMajor = major;
      latestMinor = minor;
    }
  }

  // Determine if this push includes a major bump
  let isMajorBump = false;
  if (!foundTag) {
    // No existing tags: check only the latest commit message
    const headMessage = execSync("git log -1 --pretty=%B").toString().trim();
    if (headMessage.includes("#major")) {
      isMajorBump = true;
    }
  } else {
    // Existing tags: check commit messages since the latest tag
    const range = `${latestMajor}.${latestMinor}..HEAD`;
    const commitMessages = execSync(`git log ${range} --pretty=%B`).toString();
    if (commitMessages.includes("#major")) {
      isMajorBump = true;
    }
  }

  // Compute the new version number
  let newMajor, newMinor;
  if (!foundTag) {
    // Starting fresh (no prior version tag)
    newMajor = isMajorBump ? 1 : 0;
    newMinor = isMajorBump ? 0 : 1;
  } else {
    if (isMajorBump) {
      newMajor = latestMajor + 1;
      newMinor = 0;
    } else {
      newMajor = latestMajor;
      newMinor = latestMinor + 1;
    }
  }
  const newTag = `${newMajor}.${newMinor}`;

  // Configure git with GitHub token (for authentication to push)
  const repo = process.env.GITHUB_REPOSITORY; // e.g. "owner/repo"
  execSync(`git config user.name "github-actions[bot]"`);
  execSync(
    `git config user.email "github-actions[bot]@users.noreply.github.com"`
  );
  execSync(
    `git remote set-url origin https://x-access-token:${token}@github.com/${repo}.git`
  );

  core.info(`Tagging new version: ${newTag}`);
  execSync(`git tag ${newTag}`);
  execSync(`git push origin ${newTag}`);

  core.setOutput("new_tag", newTag);
  core.setOutput("new_tag_major", newMajor);
  core.setOutput("new_tag_minor", newMinor);
  core.setOutput("is_major_bump", isMajorBump);
} catch (error) {
  core.setFailed(error.message);
}
