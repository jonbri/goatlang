const fs = require("fs");
const { execSync } = require("child_process");
const conventionalChangelog = require("conventional-changelog");

const shell = (cmd) => execSync(cmd).toString().trim();
const tag = process.argv[2];

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
  const version = tag
    ? tag
    : shell('node ./bin/version --value="baseVersion"').replace(/^v/, "");
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

  const context = {};
  const gitRawCommitsOpts = {};
  const parserOpts = {};
  const writerOpts = {};

  // import config from '@org/conventional-changelog-custom-preset';
  // conventionalChangelog({config}).pipe(process.stdout); // or any writable stream

  const markdown = await streamToString(conventionalChangelog(changelogOpts, context, gitRawCommitsOpts, parserOpts, writerOpts));
  fs.writeFileSync("CHANGELOG.md", markdown);
}
main();

// {
// preset: "angular",
// releaseCount: 0,
// // outputUnreleased: true,
// skipUnstable: true,
// pkg: {
//   transform: (pkg) => ({
//     ...pkg,
//     version,
//   }),
// },
// transform: (commit, cb) => {
//   // console.log(commit);
//   cb();
// }
// context: {
//   version: 'foo',
// },

// transform: (commit, cb) => {
//   const result = {
//     ...commit,
//     // subject: "the subject",
//     // type: "foo",
//     // references: commit.references.map((reference) => ({
//     //   ...reference,
//     //   issue: "blah"
//     // }))
//     // references: [],
//   };
//   // return result;
//   // cb(result);
//   // cb(result);
//   return {};
// },

// groupBy: "type",
// }
