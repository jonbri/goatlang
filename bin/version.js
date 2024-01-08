const { execSync } = require("child_process");
const { program } = require("commander");
const semverInc = require("semver/functions/inc");
const commitParser = require("conventional-commits-parser");

const options = program
  .option("-t, --test <object>")
  .option("-v, --value <value>")
  .option("-g, --git-dir <path>")
  .option("-b, --branch <branch>")
  .option("-p, --pretty")
  .parse()
  .opts();

const shell = (cmd) => execSync(cmd).toString().trim();
const gitDir = options.gitDir ? options.gitDir : ".";
const git = (cmd) => shell(`git -C ${gitDir} ${cmd}`);
const gits = (cmd) => git(cmd).split("\n");

const shaToTag = (sha) =>
  gits(`tag --points-at ${sha}`).filter((tag) =>
    /^v[0-9]+\.[0-9]+\.[0-9]+.*/.test(tag)
  )[0];

const parseCommits = () => {
  const data = [];
  for (const commit of gits("rev-list HEAD")) {
    const message = git(`log --format=%B -n 1 ${commit}`);

    data.push({
      sha: commit.slice(0, 7),
      tag: shaToTag(commit),
      message,
    });

    // stop when the first release commit is encountered
    const { type } = commitParser.sync(message);
    if (type === "release") break;
  }
  return data;
};

async function doesTagExist(tag) {
  const tags = options.test
    ? JSON.parse(options.test).map(({ tag }) => tag)
    : gits("tag");
  return tags.includes(tag);
}

async function nextTag(start, increment) {
  let tag = start;
  while (await doesTagExist(tag)) {
    tag = increment(tag);
  }
  return tag;
}

const largestBump = (commits) => {
  let bump = null;
  const bumpTypes = commits.map(({ bumpType }) => bumpType);
  if (bumpTypes.includes("major")) bump = "major";
  else if (bumpTypes.includes("minor")) bump = "minor";
  else if (bumpTypes.includes("patch")) bump = "patch";
  return bump;
};

async function main() {
  const rawCommits = options.test ? JSON.parse(options.test) : parseCommits();
  const commits = rawCommits.map((commit) => {
    const { type, header, footer } = commitParser.sync(commit.message);
    let bumpType = null;
    if (
      header.includes("!") ||
      (footer && footer.includes("BREAKING CHANGE:"))
    ) {
      bumpType = "major";
    } else if (type === "feat" || type === "perf") {
      bumpType = "minor";
    } else if (type === "fix") {
      bumpType = "patch";
    }
    return {
      ...commit,
      type,
      header,
      footer,
      bumpType,
    };
  });

  const commitsSinceLastPrerelease = [];
  for (const commit of commits.slice()) {
    if (commit.tag && commit.tag.includes("-beta.")) break;
    commitsSinceLastPrerelease.push(commit);
  }

  const branchName = options.branch
    ? options.branch
    : git("rev-parse --abbrev-ref HEAD");

  const [firstCommit] = commits;

  let releaseType;
  if (firstCommit.header.startsWith("release")) {
    releaseType = "release";
  } else if (/^[0-9]+\.[0-9]+\.[0-9]+$/.test(branchName)) {
    releaseType = "maintenance";
  } else {
    releaseType = "prerelease";
  }

  // determine the "base version",
  // which is the version of the last release
  let { tag: baseVersion } = commits.slice().reverse()[0];
  if (releaseType === "release") baseVersion = firstCommit.header.split(" ")[1];

  // used to determine the semver increment type
  const largestBumpSinceRelease = largestBump(commits);

  // used to determine if a prerelease should be created
  // i.e., if there were only "chore" commits after the last prerelease
  // then a new prerelease publish should not occur
  const largestBumpSincePrerelease = largestBump(commitsSinceLastPrerelease);

  // determine the next version for the tghree release types
  const nextReleaseVersion = `v${semverInc(
    baseVersion,
    largestBumpSinceRelease
  )}`;
  const nextPrereleaseVersion = await nextTag(
    `${nextReleaseVersion}-beta.0`,
    (v) => "v" + semverInc(v, "prerelease", "beta")
  );
  const nextMaintenanceVersion = await nextTag(
    `v${branchName}-maintenance.0`,
    (v) => "v" + semverInc(v, "prerelease", "maintenance")
  );

  let nextVersion = null;

  // determine the next version
  if (releaseType === "prerelease") {
    nextVersion =
      largestBumpSincePrerelease === null ? null : nextPrereleaseVersion;
  } else if (releaseType === "release") {
    nextVersion = baseVersion;
  } else if (releaseType === "maintenance") {
    nextVersion = nextMaintenanceVersion;
  }

  const values = {
    commits,
    baseVersion,
    releaseType,
    largestBumpSinceRelease,
    largestBumpSincePrerelease,
    nextVersion,
  };

  let output = JSON.stringify(values);
  if (options.value) {
    output = values[options.value];
  }
  const prettyOutput = options.pretty
    ? JSON.stringify(JSON.parse(output), null, 2)
    : output;

  console.log(prettyOutput);
}
main();
