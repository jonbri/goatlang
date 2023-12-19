const { execSync } = require("child_process");
const semverInc = require("semver/functions/inc");

const debug = false;
const sortDesc = (a, b) => b - a;
const shell = (cmd) => execSync(cmd).toString().trim();

async function determinePrereleaseVersion() {
  const gotaggerResult = shell("./bin/gotagger");
  if (debug) console.log(`gotaggerResult: ${gotaggerResult}`);

  const tagList = shell(`git tag --list ${gotaggerResult}-*`);
  if (debug) console.log(`tagList: ${tagList}`);

  const versionExists = tagList.length > 0;
  if (debug) console.log(`version exists: ${versionExists}`);

  const latestPrerelease = tagList
    .split("\n")
    .map((tag) => parseInt(tag.split(".").reverse()[0]))
    .sort(sortDesc)[0];
  if (debug) console.log(`latestPrerelease: ${latestPrerelease}`);

  const incremented = semverInc(
    `${gotaggerResult}-beta.${latestPrerelease}`,
    "prerelease",
    "beta"
  );
  if (debug) console.log(`incremented: ${incremented}`);

  const nextVersion = versionExists
    ? `v${incremented}`
    : `${gotaggerResult}-beta.0`;
  return nextVersion;
}

async function main() {
  const version = await determinePrereleaseVersion();
  console.log(version);
}
main();
