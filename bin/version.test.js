const test = require("tape");
const { execSync } = require("child_process");
const shell = (cmd) => execSync(cmd).toString().trim();

const prepare = (raw) => JSON.stringify(JSON.stringify(raw)).slice(1, -1);
const pick = (o, a) => a.reduce((acc, key) => ({ ...acc, [key]: o[key] }), {});
const commit = (sha, message, tag) => ({ sha, message, tag });
const v100 = commit(0, "release: v1.0.0", "v1.0.0");

const run =
  ({ options, args }, expected) =>
  (t) => {
    let fullCommand = "node bin/version.js ";

    // add options
    for (const [key, value] of Object.entries(options)) {
      fullCommand += `--${key}="${value}" `;
    }

    // add args
    if (args) {
      fullCommand += args.map((arg) => `--${arg} `).join("");
    }

    const fullResult = JSON.parse(shell(fullCommand));
    // console.log(fullResult);

    const trimmedResult = pick(fullResult, Object.keys(expected));
    t.deepEqual(trimmedResult, expected);
    t.end();
  };

test(
  "Prerelease patch",
  run(
    {
      options: {
        branch: "main",
        test: prepare([
          commit(2, "fix: bug fix"),
          commit(1, "fix: bug fix", "v1.0.1-beta.0"),
          v100,
        ]),
      },
    },
    {
      largestBumpSinceRelease: "patch",
      nextVersion: "v1.0.1-beta.1",
      releaseType: "prerelease",
    }
  )
);

test(
  "Prerelease minor",
  run(
    {
      options: {
        branch: "main",
        test: prepare([
          commit(2, "feat: new feature"),
          commit(1, "fix: bug fix", "v1.0.1-beta.0"),
          v100,
        ]),
      },
    },
    {
      largestBumpSinceRelease: "minor",
      nextVersion: "v1.1.0-beta.0",
      releaseType: "prerelease",
    }
  )
);

test(
  "Prerelease with mixed commit types",
  run(
    {
      options: {
        branch: "main",
        test: prepare([
          commit(5, "fix: bug fix"),
          commit(4, "feat: new feature"),
          commit(3, "fix: bug fix"),
          commit(2, "feat: new feature", "v1.1.0-beta.0"),
          commit(1, "fix: bug fix", "v1.0.1-beta.0"),
          v100,
        ]),
      },
    },
    {
      largestBumpSinceRelease: "minor",
      nextVersion: "v1.1.0-beta.1",
      releaseType: "prerelease",
    }
  )
);

test(
  "Prerelease with mixed commit types ending with a chore",
  run(
    {
      options: {
        branch: "main",
        test: prepare([
          commit(7, "chore: doc"),
          commit(6, "chore: doc"),
          commit(5, "fix: bug fix"),
          commit(4, "feat: new feature"),
          commit(3, "fix: bug fix"),
          commit(2, "feat: new feature", "v1.1.0-beta.0"),
          commit(1, "fix: bug fix", "v1.0.1-beta.0"),
          v100,
        ]),
      },
    },
    {
      largestBumpSinceRelease: "minor",
      nextVersion: "v1.1.0-beta.1",
      releaseType: "prerelease",
    }
  )
);

test(
  "Chore commits are ignored",
  run(
    {
      options: {
        branch: "main",
        test: prepare([
          commit(3, "chore: doc"),
          commit(2, "chore: doc"),
          commit(1, "chore: doc"),
          v100,
        ]),
      },
    },
    {
      largestBumpSinceRelease: null,
      nextVersion: null,
      releaseType: "prerelease",
    }
  )
);

test(
  "Major bump with chore commits skipped",
  run(
    {
      options: {
        branch: "main",
        test: prepare([
          commit(3, "feat!: major feature"),
          commit(2, "chore: doc"),
          commit(1, "chore: doc"),
          v100,
        ]),
      },
    },
    {
      largestBumpSinceRelease: "major",
      nextVersion: "v2.0.0-beta.0",
      releaseType: "prerelease",
    }
  )
);

test(
  "Release",
  run(
    {
      options: {
        branch: "main",
        test: prepare([
          commit(2, "release: v2.0.0"),
          commit(1, "feat!: new feature", "v2.0.0-beta.0"),
          v100,
        ]),
      },
    },
    {
      largestBumpSinceRelease: "major",
      nextVersion: "v2.0.0",
      releaseType: "release",
    }
  )
);

test(
  "Release 2",
  run(
    {
      options: {
        branch: "main",
        test: prepare([commit(0, "release: v1.0.1"), v100]),
      },
    },
    {
      largestBumpSinceRelease: null,
      largestBumpSincePrerelease: null,
      nextVersion: "v1.0.1",
      releaseType: "release",
    }
  )
);

test(
  "Maintenance branch",
  run(
    {
      options: {
        branch: "1.0.0",
        test: prepare([
          commit(2, "fix: bug fix"),
          commit(1, "fix: bug fix", "v1.0.1-beta.0"),
          v100,
        ]),
      },
    },
    {
      largestBumpSinceRelease: "patch",
      nextVersion: "v1.0.0-maintenance.0",
      releaseType: "maintenance",
    }
  )
);

test(
  "Maintenance branch with existing maintenance versions",
  run(
    {
      options: {
        branch: "1.0.0",
        test: prepare([
          commit(3, "fix: hotfix"),
          commit(2, "fix: hotfix", "v1.0.0-maintenance.1"),
          commit(1, "fix: hotfix", "v1.0.0-maintenance.0"),
          v100,
        ]),
      },
    },
    {
      largestBumpSinceRelease: "patch",
      nextVersion: "v1.0.0-maintenance.2",
      releaseType: "maintenance",
    }
  )
);

test(
  "Release",
  run(
    {
      options: {
        branch: "main",
        test: prepare([commit(1, "release: v1.0.1")]),
      },
    },
    {
      largestBumpSinceRelease: null,
      nextVersion: "v1.0.1",
      releaseType: "release",
    }
  )
);

test(
  "Chore after fix",
  run(
    {
      options: {
        branch: "main",
        test: prepare([
          commit(3, "chore: bump"),
          commit(2, "fix: bump", "v1.0.0-beta.0"),
          commit(1, "chore: bump"),
          v100,
        ]),
      },
    },
    {
      largestBumpSinceRelease: "patch",
      nextVersion: null,
      releaseType: "prerelease",
    }
  )
);

test(
  "Chore after fix 2",
  run(
    {
      options: {
        branch: "main",
        test: prepare([
          commit(6, "release: v1.0.1"),
          commit(5, "chore: bump"),
          commit(5, "chore: bump"),
          commit(2, "fix: bump", "v1.0.1-beta.1"),
          commit(5, "chore: bump"),
          commit(4, "chore: bump"),
          commit(3, "chore: bump"),
          commit(2, "fix: bump", "v1.0.1-beta.0"),
          commit(1, "chore: bump"),
          v100,
        ]),
      },
    },
    {
      largestBumpSinceRelease: "patch",
      nextVersion: "v1.0.1",
      releaseType: "release",
    }
  )
);

test(
  "--release",
  run(
    {
      args: ["release"],
      options: {
        branch: "main",
        test: prepare([
          commit(3, "chore: bump"),
          commit(2, "fix: bump", "v1.0.1-beta.0"),
          commit(1, "chore: bump"),
          v100,
        ]),
      },
    },
    {
      largestBumpSinceRelease: "patch",
      nextVersion: "v1.0.1",
      releaseType: "cut",
    }
  )
);

test(
  "--release",
  run(
    {
      args: ["release"],
      options: {
        branch: "main",
        test: prepare([commit(1, "chore: bump"), v100]),
      },
    },
    {
      largestBumpSinceRelease: null,
      nextVersion: null,
      releaseType: "cut",
    }
  )
);

test(
  "--release",
  run(
    {
      args: ["release"],
      options: {
        branch: "main",
        test: prepare([commit(1, "release: v1.0.1"), v100]),
      },
    },
    {
      largestBumpSinceRelease: null,
      nextVersion: null,
      releaseType: "cut",
    }
  )
);
