const fs = require("fs");
const { execSync } = require("child_process");
const conventionalChangelog = require("conventional-changelog");

const shell = (cmd) => execSync(cmd).toString().trim();
const readFileSync = (path) =>
  fs.readFileSync(path, { encoding: "utf8", flag: "r" });
const CHANGELOG_FILE = "CHANGELOG.md";

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
  const version = shell(
    'node ./bin/version --value="nextVersion" --release'
  ).replace(/^v/, "");
  console.log(`version: ${version}`);

  // const writerTransform = (commit, { bob }) => {
  //   const excludedTypes = ["chore", "release", "test"];
  //   if (excludedTypes.includes(commit.type)) return false;
  //
  //   const { hash, header, committerDate } = commit;
  //   return {
  //     ...commit,
  //     jira: `http://jira.com/${bob}/${hash}`,
  //     // header: "da header"
  //   };
  // };

  // const writerOpts = {
  //   groupBy: "type",
  //   commitsSort: ["subject", "scope"],
  //   commitGroupsSort: "title",
  //   transform: writerTransform,
  //   mainTemplate: readFileSync("./bin/templates/template.hbs"),
  //   headerPartial: readFileSync("./bin/templates/header.hbs"),
  //   commitPartial: readFileSync("./bin/templates/commit.hbs"),
  //   footerPartial: readFileSync("./bin/templates/footer.hbs"),
  //   // TODO: is this useful?
  //   // generateOn: (commit) => {
  //   //   const excludedTypes = ["chore", "release", "test"];
  //   //   if (excludedTypes.includes(commit.type)) return false;
  //   //   return true;
  //   // },
  // };

  const writerOpts = {
    // headerPartial: readFileSync("./bin/templates/header.hbs"),
    commitPartial: readFileSync("./bin/templates/commit.hbs"),
    transform: (commit, { bob }) => {
      // const excludedTypes = ["chore", "release", "test"];
      // if (excludedTypes.includes(commit.type)) return false;

      let type = commit.type;
      if (commit.type === "chore") {
        type = "CCCCHORE";
      }

      if (commit.type === "fix") {
        type = "FIX";
      } else if (commit.type === "feat") {
        type = "FEAT";
      } else {
        type = "OTHER";
      }

      return {
        ...commit,
        type,
        jira: `http://jira.com/${bob}/${commit.hash}`,
        shortHash: commit.hash.substring(0, 7),
        // header: "da header"
      };
    },
  };

  const stream = conventionalChangelog(
    {
      preset: "angular",
      releaseCount: 0,
      pkg: {
        transform: (pkg) => ({
          ...pkg,
          version,
        }),
      },
    },
    {
      bob: "bill",
    },
    {},
    {},
    writerOpts
  );
  const markdown = await streamToString(stream);
  fs.writeFileSync(CHANGELOG_FILE, markdown);

  console.log(`${CHANGELOG_FILE} updated`);
}
main();
