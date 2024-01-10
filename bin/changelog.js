const fs = require("fs");
const { execSync } = require("child_process");
const conventionalChangelog = require("conventional-changelog");

const shell = (cmd) => execSync(cmd).toString().trim();

// https://stackoverflow.com/a/49428486/2295034
const streamToString = (stream) => {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
};

async function main() {
  const version = shell('node ./bin/version --value="baseVersion"').replace(
    /^v/,
    ""
  );
  console.log(`version: ${version}`);

  const changelogOpts = {
    releaseCount: 0,
    pkg: {
      transform: (pkg) => ({
        ...pkg,
        version,
      }),
    },
  };

  const writerOpts = {
    transform: (commit, cb) => {
      const excludedTypes = ["chore", "release"];
      if (excludedTypes.includes(commit.type)) return false;
      return commit;
    },
  };

  const markdown = await streamToString(
    conventionalChangelog(changelogOpts, {}, {}, {}, writerOpts)
  );
  fs.writeFileSync("CHANGELOG.md", markdown);

  console.log("CHANGELOG.md updated");
}
main();
