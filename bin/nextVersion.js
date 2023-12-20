const { execSync } = require("child_process");
const semverInc = require("semver/functions/inc");
const ConventionalCommitsParser =
  "./node_modules/.bin/conventional-commits-parser";

const shell = (cmd) => execSync(cmd).toString().trim();
const TagRegex = /^v[0-9]\.[0-9]\.[0-9]*/;

async function determineNextVersion(releaseMode) {
  const debug = !releaseMode;
  if (!releaseMode) {
    releaseMode = "prerelease";
  }
  let headVersion;
  let highestBump = "patch"; // major, minor, patch
  for (const commit of shell("git rev-list HEAD").split("\n")) {
    const shortCommit = commit.slice(0, 7);

    const version = shell(`git tag --points-at ${commit}`)
      .split("\n")
      .filter((tag) => TagRegex.test(tag))[0];

    if (!headVersion) headVersion = version;

    const { type, header, footer } = JSON.parse(
      shell(`git log --format=%B -n 1 ${commit} | ${ConventionalCommitsParser}`)
    )[0];

    let bumpType = "patch";
    if (header.includes("!") && footer.includes("BREAKING CHANGE")) {
      bumpType = "major";
    } else if (type === "feat") {
      bumpType = "minor";
    }

    if (bumpType === "major") {
      highestBump = "major";
    } else if (bumpType === "minor" && highestBump !== "major") {
      highestBump = "minor";
    }

    if (debug) {
      console.log(`${shortCommit} | ${version} | ${bumpType}`);
    }

    if (version && !version.includes("-")) {
      break;
    }
  }

  const nextReleaseVersion = semverInc(headVersion, highestBump);
  const nextPrereleaseVersion = semverInc(
    nextReleaseVersion,
    "prerelease",
    "beta"
  );

  const nextVersion = `v${
    releaseMode === "release" ? nextReleaseVersion : nextPrereleaseVersion
  }`;

  if (debug) {
    console.log(`headVersion: ${headVersion}`);
    console.log(`highestBump: ${highestBump}`);
    console.log(`nextReleaseVersion: ${nextReleaseVersion}`);
    console.log(`nextPrereleaseVersion: ${nextPrereleaseVersion}`);
  }

  return nextVersion;
}

async function main() {
  const releaseMode = process.argv[2];
  const nextVersion = await determineNextVersion(releaseMode);
  if (releaseMode) {
    console.log(nextVersion);
  }
}
main();
