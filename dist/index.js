/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 317:
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ 896:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
const fs = __nccwpck_require__(896);
const { execSync } = __nccwpck_require__(317);

// Helper to get an input (GitHub Actions passes inputs as environment variables)
// e.g. input "github_token" becomes process.env.INPUT_GITHUB_TOKEN
function getInput(name, options = {}) {
  const value = process.env[`INPUT_${name.toUpperCase()}`];
  if (options.required && !value) {
    throw new Error(`Input required and not supplied: ${name}`);
  }
  return value;
}

// Helper to set an output. If GITHUB_OUTPUT is defined, append the output there.
function setOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  } else {
    // Fallback: just log the output if GITHUB_OUTPUT isn't available.
    console.log(`${name}=${value}`);
  }
}

try {
  // Get the GitHub token input (required)
  const token = getInput("github_token", { required: true });

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
    const major = parseInt(majorStr, 10);
    const minor = parseInt(minorStr, 10);
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

  console.log(`Tagging new version: ${newTag}`);
  execSync(`git tag ${newTag}`);
  execSync(`git push origin ${newTag}`);

  setOutput("new_tag", newTag);
  setOutput("new_tag_major", newMajor.toString());
  setOutput("new_tag_minor", newMinor.toString());
  setOutput("is_major_bump", isMajorBump.toString());
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

module.exports = __webpack_exports__;
/******/ })()
;