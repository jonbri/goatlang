const { execSync } = require("child_process");
const semverCompare = require("semver/functions/compare");
const semverCompareLoose = require("semver/functions/compare-loose");

async function main() {
  // console.log(semverCompareLoose('1.0.0', '1.0.0-beta.1'));
  // process.exit(0);

  const previousVersion = execSync("git describe --tags --abbrev=0")
    .toString()
    .trim();

  const gotaggerResult = execSync("./bin/gotagger").toString().trim();

  // console.log("previousVersion", previousVersion);
  // console.log("gotaggerResult", gotaggerResult);

  // if there exists a prerelease tag on previousVersion
  const isPrerelease =
    execSync(`git tag --list ${previousVersion}-*`).toString().trim().length >
    0;

  let newVersion;
  // TODO: could use semver api to do this
  if (isPrerelease) {
    newVersion = execSync(
      `./node_modules/.bin/semver ${GOTAGGER_RESULT} --increment prerelease --preid beta`
    )
      .toString()
      .trim();
  } else {
    newVersion = gotaggerResult + "-beta.0";
  }

  console.log("newVersion", newVersion);

  /*

  const headCommitInfo = execSync(
    "git show -s --format=%B | head -n 1 | ./node_modules/.bin/conventional-commits-parser"
  ).toString();
  const versionJSON = JSON.parse(headCommitInfo);
  const object = versionJSON[0];

  console.log("type", object.type);
  console.log("scope", object.scope);
  // console.log("subject", object.subject);
  // console.log("merge", object.merge);
  // console.log("header", object.header);
  // console.log("body", object.body);
  // console.log("footer", object.footer);
  // console.log("notes", object.notes);
  // console.log("references", object.references);
  // console.log("mentions", object.mentions);
  // console.log("revert", object.revert);
  */
}

main();
