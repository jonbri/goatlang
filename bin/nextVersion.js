const { execSync } = require("child_process");
const semverInc = require("semver/functions/inc");
const ConventionalCommitsParser =
  "./node_modules/.bin/conventional-commits-parser";

const shell = (cmd) => execSync(cmd).toString().trim();
const tagRegex = /^v[0-9]+\.[0-9]+\.[0-9]+.*/;

async function determineNextVersion(releaseMode) {
  const debugMode = !releaseMode;
  if (!releaseMode) releaseMode = "prerelease";

  let baseVersion;
  let highestBump = "null"; // values: major, minor, patch, null
  for (const commit of shell("git rev-list HEAD").split("\n")) {
    const shortCommit = commit.slice(0, 7);

    const version = shell(`git tag --points-at ${commit}`)
      .split("\n")
      .filter((tag) => tagRegex.test(tag))[0];

    const { type, header, footer } = JSON.parse(
      shell(`git log --format=%B -n 1 ${commit} | ${ConventionalCommitsParser}`)
    )[0];

    let bumpType = "null";
    if (
      header.includes("!") ||
      (footer && footer.includes("BREAKING CHANGE:"))
    ) {
      bumpType = "major";
    } else if (type === "feat") {
      bumpType = "minor";
    } else if (type === "fix") {
      bumpType = "patch";
    }

    if (bumpType === "major") {
      highestBump = "major";
    } else if (bumpType === "minor" && highestBump !== "major") {
      highestBump = "minor";
    } else if (
      bumpType === "patch" &&
      highestBump !== "major" &&
      highestBump !== "minor"
    ) {
      highestBump = "patch";
    }

    if (debugMode) console.log(`${shortCommit} | ${version} | ${bumpType}`);

    if (version && !version.includes("-")) {
      baseVersion = version;
      break;
    }
  }

  const nextReleaseVersion = `v${semverInc(baseVersion, highestBump)}`;

  const basePrereleaseVersion = `${nextReleaseVersion}-beta.0`;
  let nextPrereleaseVersion = basePrereleaseVersion;
  while (shell(`git tag -l ${nextPrereleaseVersion}`) !== "") {
    nextPrereleaseVersion = `v${semverInc(
      nextPrereleaseVersion,
      "prerelease",
      "beta"
    )}`;
  }

  let baseMaintenanceVersion;
  let nextMaintenanceVersion;
  const branchName = shell("git rev-parse --abbrev-ref HEAD");
  if (/^[0-9]+\.[0-9]+\.[0-9]+$/.test(branchName)) {
    baseMaintenanceVersion = `v${branchName}-maintenance.0`;
    nextMaintenanceVersion = baseMaintenanceVersion;
    while (shell(`git tag -l ${nextMaintenanceVersion}`) !== "") {
      nextMaintenanceVersion = `v${semverInc(
        nextMaintenanceVersion,
        "prerelease",
        "maintenance"
      )}`;
    }
  } else {
    baseMaintenanceVersion = "null";
    nextMaintenanceVersion = "null";
  }

  let nextVersion = nextPrereleaseVersion;
  if (highestBump === "null") {
    if (debugMode) console.log("new version: null");
    return "null";
  } else if (releaseMode === "release") {
    nextVersion = nextReleaseVersion;
  } else if (releaseMode === "maintenance") {
    nextVersion = nextMaintenanceVersion;
  }

  if (debugMode) {
    console.log("--");
    console.log(`highest bump: ${highestBump}`);
    console.log();
    console.log("(release, prerelease, maintenance)");
    console.log(
      `Base: ${baseVersion}, ${basePrereleaseVersion}, ${baseMaintenanceVersion}`
    );
    console.log(
      `Next: ${nextReleaseVersion}, ${nextPrereleaseVersion}, ${nextMaintenanceVersion}`
    );
  }

  return nextVersion;
}

async function main() {
  const releaseMode = process.argv[2];
  if (
    releaseMode &&
    !["release", "prerelease", "maintenance"].includes(releaseMode)
  ) {
    console.error("Invalid release mode");
    process.exit(1);
  }
  const nextVersion = await determineNextVersion(releaseMode);
  if (releaseMode) console.log(nextVersion);
}
main();
