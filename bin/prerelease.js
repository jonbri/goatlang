const { execSync } = require("child_process");

async function main() {
  const version = execSync("git show -s --format=%B | head -n 1 | ./node_modules/.bin/conventional-commits-parser")
    .toString();

  const versionJSON = JSON.parse(version);
  const object = versionJSON[0];

  console.log("type", object.type);
  console.log("scope", object.scope);
  console.log("subject", object.subject);
  console.log("merge", object.merge);
  console.log("header", object.header);
  console.log("body", object.body);
  console.log("footer", object.footer);
  console.log("notes", object.notes);
  console.log("references", object.references);
  console.log("mentions", object.mentions);
  console.log("revert", object.revert);
}

main();
