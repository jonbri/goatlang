const { execSync } = require("child_process");
const semverInc = require("semver/functions/inc");
// const { parseCommitsStream } = require("conventional-commits-parser");
const conventionalCommitsParser = require("conventional-commits-parser");

const releaseMode = process.argv[2] === "release" ? "release" : "prerelease";
const debug = process.argv[3] === "true";
const sortDesc = (a, b) => b - a;
const shell = (cmd) => execSync(cmd).toString().trim();

// async function determinePrereleaseVersion() {
//   const gotaggerResult = shell("./bin/gotagger");
//   if (debug) console.log(`gotaggerResult: ${gotaggerResult}`);
//
//   const matchingTags = shell(`git tag --list ${gotaggerResult}-*`);
//   if (debug) console.log(`matchingTags: ${matchingTags}`);
//
//   const latestPrerelease = matchingTags
//     .split("\n")
//     .map((tag) => parseInt(tag.split(".").reverse()[0]))
//     .sort(sortDesc)[0];
//   if (debug) console.log(`latestPrerelease: ${latestPrerelease}`);
//
//   const incremented = semverInc(
//     `${gotaggerResult}-beta.${latestPrerelease}`,
//     "prerelease",
//     "beta"
//   );
//   if (debug) console.log(`incremented: ${incremented}`);
//
//   const nextPrerelease = `v${incremented}`;
//   const newPrerelease = `${gotaggerResult}-beta.0`;
//   if (debug) console.log(`nextPrerelease: ${nextPrerelease}`);
//   if (debug) console.log(`newPrerelease: ${newPrerelease}`);
//
//   const versionExists = matchingTags.length > 0;
//   if (debug) console.log(`version exists: ${versionExists}`);
//
//   return versionExists ? nextPrerelease : newPrerelease;
// }

const ConventionalCommitsParser =
  "./node_modules/.bin/conventional-commits-parser";

async function determineNextVersion() {
  // loop through commits descending until a release tag is found
  // if a prerelease tag is found, increment it
  // if no prerelease tag is found, create one

  const commits = shell("git rev-list HEAD").split("\n");
  let releaseCommit;
  let releaseTag;
  let highestBump = "patch"; // major, minor, patch

  // let headVersion = "v0.9.0-beta.1"; // TODO:
  let headVersion;
  for (const commit of commits) {
    const shortCommit = commit.slice(0, 7);
    let releaseType;
    try {
      const version = shell(
        `git describe ${commit} --tags --exact-match --match "v[0-9]\.[0-9]\.[0-9]*" 2>/dev/null`
      );
      // console.log(`${commit}: ${version}`);

      // use conventional-commits-parser to determine the type of commit
      // major, minor, or patch

      if (version.includes("-")) {
        // const prerelease = semverInc(version, "prerelease", "beta");
        // console.log(`prerelease: ${prerelease}`);
        releaseType = "prerelease";
      } else {
        // console.log(`release: ${version}`);
        releaseType = "release";
        releaseTag = version;
      }

      const parsedString = shell(
        `git log --format=%B -n 1 ${commit} | ${ConventionalCommitsParser}`
      );
      const commitMetadata = JSON.parse(parsedString)[0];
      // console.log(commitMetadata);

      const commitType = commitMetadata.type;
      const header = commitMetadata.header;
      const footer = commitMetadata.footer;
      // console.log(`commitType: ${commitType}`);

      let bumpType = "patch";
      if (commitType === "feat") {
        bumpType = "minor";
      } else if (header.includes("!") && footer.includes("BREAKING CHANGE")) {
        // TODO: fix this logic
        bumpType = "major";
      }

      if (bumpType === "major") {
        highestBump = "major";
      } else if (bumpType === "minor" && highestBump !== "major") {
        highestBump = "minor";
      }

      if (debug)
        console.log(
          `${shortCommit} | ${version} | ${releaseType} | ${bumpType}`
        );

      if (!headVersion) headVersion = version;
    } catch (e) {
      // console.log(`${commit} has no tags`);
    } // end of try

    if (releaseType === "release") {
      releaseCommit = commit;
      break;
    }
  } // end of for loop

  const nextReleaseVersion = semverInc(headVersion, highestBump);
  const nextPrereleaseVersion = semverInc(headVersion, "prerelease", "beta");

  const finalAnswer =
    releaseMode === "release" ? nextReleaseVersion : nextPrereleaseVersion;
  if (debug) {
    console.log(`headVersion: ${headVersion}`);
    console.log(`highestBump: ${highestBump}`);
    console.log(`nextReleaseVersion: ${nextReleaseVersion}`);
    console.log(`nextPrereleaseVersion: ${nextPrereleaseVersion}`);
    console.log(`releaseCommit: ${releaseCommit}`);
    console.log(`releaseTag: ${releaseTag}`);
    console.log(
      `releaseMode: ${releaseMode}, so the next version is: ${finalAnswer}`
    );
  }

  return finalAnswer;
}

async function main() {
  const nextVersion = await determineNextVersion();
  console.log(nextVersion);
}
main();
