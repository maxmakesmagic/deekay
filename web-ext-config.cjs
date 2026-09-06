module.exports = {
    verbose: true,
    // Command options:
    build: {
      overwriteDest: true,
    },
    ignoreFiles: [
      'config.json',
      'deekay',
      'poetry.lock',
      'pyproject.toml',
      'package-lock.json',
      'package.json',
      'release.config.cjs',
      'scripts',
      'url_mapping_magic_wizards_com.json',
      'web-ext-config.cjs',
      '**/*.log',
      '**/*.md',
      '**/*.py',
      '**/*.sh',
      '**/*.zip',
    ],
  };
