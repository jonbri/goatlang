const fs = require("fs");
const { execSync } = require("child_process");
const ConventionalChangelog = require("conventional-changelog");

const shell = (cmd) => execSync(cmd).toString().trim();
const tag = process.argv[2];

// https://stackoverflow.com/a/49428486/2295034
function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

async function main() {
  const version = tag
    ? tag
    : shell('node ./bin/version --value="baseVersion"').replace(/^v/, "");
  console.log(`version: ${version}`);

  const stream = ConventionalChangelog({
    preset: "angular",
    releaseCount: 0,
    pkg: {
      transform(pkg) {
        pkg.version = version;
        return pkg;
      },
    },
  });

  const markdown = await streamToString(stream);
  fs.writeFileSync("CHANGELOG.md", markdown);
}
main();
