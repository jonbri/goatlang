const fs = require("fs");
const { execSync } = require("child_process");
const conventionalChangelog = require("conventional-changelog");

const shell = (cmd) => execSync(cmd).toString().trim();
const readFileSync = (path) =>
  fs.readFileSync(path, { encoding: "utf8", flag: "r" });
const CHANGELOG_FILE = "CHANGELOG.md";
const excludedTypes = ["release"];

const jiraRegex = /\(([\w]+[-][\d]+)\)/;
const jiraUrl = "http://example.org/browse";
const embedJiraUrl = (s) => {
  if (s === null) return null;
  const jiraMatch = s.match(jiraRegex);
  if (!jiraMatch) return s;
  const jiraId = jiraMatch[1];
  const jiraFullUrl = `${jiraUrl}/${jiraId}`;
  return s.replace(jiraRegex, `([${jiraId}](${jiraFullUrl}))`);
};

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

  const writerOpts = {
    transform: (commit) => {
      if (excludedTypes.includes(commit.type)) return false;

      let type = commit.type;
      switch (commit.type) {
        case "feat":
          type = "Features";
          break;
        case "fix":
          type = "Bug Fixes";
          break;
        case "perf":
          type = "Performance";
          break;
        default:
          type = "Other";
      }

      const header = embedJiraUrl(commit.header);
      const subject = embedJiraUrl(commit.subject);

      return {
        ...commit,
        type,
        header,
        subject,
        shortHash: commit.hash.substring(0, 7),
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
    {},
    {},
    {},
    writerOpts
  );
  const markdown = await streamToString(stream);
  fs.writeFileSync(CHANGELOG_FILE, markdown);

  console.log(`${CHANGELOG_FILE} updated`);
}
main();
