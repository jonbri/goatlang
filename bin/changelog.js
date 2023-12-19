const { execSync } = require("child_process");
const fs = require("fs");
const ConventionalChangelog = require("conventional-changelog");

const shell = (cmd) => execSync(cmd).toString().trim();

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
  const version = shell("./bin/gotagger").replace(/^v/, "");

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
