const { execSync } = require("child_process");
const semverInc = require("semver/functions/inc");

async function main() {
  const lastTag = execSync("git describe --tags --abbrev=0").toString().trim();

  const gotaggerResult = execSync("./bin/gotagger").toString().trim();

  const isPrerelease =
    execSync(`git tag --list ${lastTag}-*`).toString().trim().length > 0;

  let newVersion;
  if (isPrerelease) {
    newVersion = semverInc(gotaggerResult, "prerelease", "beta");
  } else {
    newVersion = gotaggerResult + "-beta.0";
  }

  console.log(newVersion);
}

main();
