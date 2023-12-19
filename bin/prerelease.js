const { execSync } = require("child_process");
const semverInc = require("semver/functions/inc");

const debug = process.argv[2] === "debug";
const sortDesc = (a, b) => b - a;
const shell = (cmd) => execSync(cmd).toString().trim();

//
async function determinePrereleaseVersion() {
  const gotaggerResult = shell("./bin/gotagger");
  if (debug) console.log(`gotaggerResult: ${gotaggerResult}`);

  const matchingTags = shell(`git tag --list ${gotaggerResult}-*`);
  if (debug) console.log(`matchingTags: ${matchingTags}`);

  const latestPrerelease = matchingTags
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

  const nextPrerelease = `v${incremented}`;
  if (debug) console.log(`nextPrerelease: ${nextPrerelease}`);
  const newPrerelease = `${gotaggerResult}-beta.0`;
  if (debug) console.log(`newPrerelease: ${newPrerelease}`);

  const versionExists = matchingTags.length > 0;
  if (debug) console.log(`version exists: ${versionExists}`);

  return versionExists ? nextPrerelease : newPrerelease;
}

async function main() {
  const version = await determinePrereleaseVersion();
  console.log(version);
}
main();
