const { execSync } = require("child_process");
const semverInc = require("semver/functions/inc");

async function determineNextPrereleaseVersion() {
  const gotaggerResult = execSync("./bin/gotagger").toString().trim();
  const tagList = execSync(`git tag --list ${gotaggerResult}-*`)
    .toString()
    .trim()
    .split("\n");
  const versionExists = tagList.length > 0;

  const latestPrerelease = tagList
    .map((tag) => tag.split(".").reverse()[0])
    .map((tag) => parseInt(tag))
    .sort((a, b) => b - a)[0];

  return versionExists
    ? semverInc(
        `${gotaggerResult}-beta.${latestPrerelease}`,
        "prerelease",
        "beta"
      )
    : `${gotaggerResult}-beta.0`;
}

async function main() {
  console.log(await determineNextPrereleaseVersion());
}

main();
