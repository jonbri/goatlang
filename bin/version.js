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
    /^v[0-9]+\.[0-9]+\.[0-9]+.*/.test(tag),
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

  const branchName = options.branch
    ? options.branch
    : git("rev-parse --abbrev-ref HEAD");

  const [firstCommit] = commits;
  const { tag: baseVersion } = commits.slice().reverse()[0];

  let releaseType;
  if (firstCommit.header.startsWith("release")) {
    releaseType = "release";
  } else if (/^[0-9]+\.[0-9]+\.[0-9]+$/.test(branchName)) {
    releaseType = "maintenance";
  } else {
    releaseType = "prerelease";
  }

  let highestBump = null;
  const bumpTypes = commits.map(({ bumpType }) => bumpType);
  if (bumpTypes.includes("major")) highestBump = "major";
  else if (bumpTypes.includes("minor")) highestBump = "minor";
  else if (bumpTypes.includes("patch")) highestBump = "patch";

  const nextReleaseVersion = `v${semverInc(baseVersion, highestBump)}`;
  const nextPrereleaseVersion = await nextTag(
    `${nextReleaseVersion}-beta.0`,
    (v) => "v" + semverInc(v, "prerelease", "beta"),
  );
  const nextMaintenanceVersion = await nextTag(
    `v${branchName}-maintenance.0`,
    (v) => "v" + semverInc(v, "prerelease", "maintenance"),
  );

  const versions = {
    base: baseVersion,
    release: highestBump === null ? null : nextReleaseVersion,
    prerelease: highestBump === null ? null : nextPrereleaseVersion,
    maintenance: highestBump === null ? null : nextMaintenanceVersion,
  };

  const values = {
    commits,
    releaseType,
    highestBump,
    versions,
    nextVersion: versions[releaseType],
  };

  const output = options.value ? values[options.value] : JSON.stringify(values);
  const prettyOutput = options.pretty
    ? JSON.stringify(JSON.parse(output), null, 2)
    : output;

  console.log(prettyOutput);
}
main();
