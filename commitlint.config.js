module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "docs", // Documentation only changes
        "style", // Changes that do not affect the meaning of the code (formatting, etc)
        "refactor", // Code change that neither fixes a bug nor adds a feature
        "perf", // A code change that improves performance
        "test", // Adding missing tests or correcting existing tests
        "build", // Changes that affect the build system or external dependencies
        "ci", // Changes to our CI configuration files and scripts
        "chore", // Other changes that don't modify src or test files
        "revert", // Reverts a previous commit
      ],
    ],
    "type-case": [2, "always", "lower-case"],
    "subject-case": [2, "always", "sentence-case"],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "body-leading-blank": [2, "always"],
    "body-max-line-length": [2, "always", 100],
  },
};
