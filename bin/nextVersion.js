const { execSync } = require("child_process");
const semverInc = require("semver/functions/inc");
const ConventionalCommitsParser =
  "./node_modules/.bin/conventional-commits-parser";

const shell = (cmd) => execSync(cmd).toString().trim();
const TagRegex = /^v[0-9]+\.[0-9]+\.[0-9]+.*/;

async function determineNextVersion(releaseMode) {
  const debug = !releaseMode;
  if (!releaseMode) releaseMode = "prerelease";

  let baseVersion;
  let highestBump = "patch"; // values: major, minor, patch
  for (const commit of shell("git rev-list HEAD").split("\n")) {
    const shortCommit = commit.slice(0, 7);

    const version = shell(`git tag --points-at ${commit}`)
      .split("\n")
      .filter((tag) => TagRegex.test(tag))[0];

    const { type, header, footer } = JSON.parse(
      shell(`git log --format=%B -n 1 ${commit} | ${ConventionalCommitsParser}`)
    )[0];

    let bumpType = "patch";
    if (
      header.includes("!") ||
      (footer && footer.includes("BREAKING CHANGE:"))
    ) {
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

  const nextVersion =
    releaseMode === "release" ? nextReleaseVersion : nextPrereleaseVersion;

  if (debug) {
    console.log();
    console.log(`baseVersion: ${baseVersion}`);
    console.log(`basePrereleaseVersion: ${basePrereleaseVersion}`);
    console.log(`highestBump: ${highestBump}`);
    console.log();
    console.log(`nextReleaseVersion: ${nextReleaseVersion}`);
    console.log(`nextPrereleaseVersion: ${nextPrereleaseVersion}`);
  }

  return nextVersion;
}

async function main() {
  const releaseMode = process.argv[2];
  if (releaseMode === "maintenance") {
    // maintenance TODO
    console.log("v0.0.42");
    process.exit(0);
  }
  const nextVersion = await determineNextVersion(releaseMode);
  if (releaseMode) console.log(nextVersion);
}
main();
