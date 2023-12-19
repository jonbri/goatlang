const { execSync } = require("child_process");
const semverInc = require("semver/functions/inc");

const debug = false;

//
async function determineNextPrereleaseVersion() {
  const gotaggerResult = execSync("./bin/gotagger").toString().trim();
  if (debug) console.log(`gotaggerResult: ${gotaggerResult}`);

  const tagList = execSync(`git tag --list ${gotaggerResult}-*`)
    .toString()
    .trim();
  if (debug) console.log(`tagList: ${tagList}`);

  const versionExists = tagList.length > 0;
  if (debug) console.log(`version exists: ${versionExists}`);

  const latestPrerelease = tagList
    .split("\n")
    .map((tag) => tag.split(".").reverse()[0])
    .map((tag) => parseInt(tag))
    .sort((a, b) => b - a)[0];
  if (debug) console.log(`latestPrerelease: ${latestPrerelease}`);

  const nextVersion = versionExists
    ? "v" +
      semverInc(
        `${gotaggerResult}-beta.${latestPrerelease}`,
        "prerelease",
        "beta"
      )
    : `${gotaggerResult}-beta.0`;
  return `${nextVersion}`;
}

async function main() {
  console.log(await determineNextPrereleaseVersion());
}

main();
