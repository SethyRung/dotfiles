export const helpText = `Usage: dotfiles <command>

Commands:
  init    Bootstrap the Workflow
  doctor  Report what is present or missing
  stow    Re-link home/ and ~/.local/bin/dotfiles
  clean   Delete Stow backup files from $HOME
  sync    Pull the repo and re-Stow config

Options:
      --version  Show version
  -h, --help     Show help
`;

export const initHelpText = `Usage: dotfiles init [options]

Bootstrap the Workflow

Options:
      --yes   Answer yes to prompts; skip Ghostty unless the Preset enables it
  -h, --help  Show help
`;

export const doctorHelpText = `Usage: dotfiles doctor [options]

Report what is present or missing

Options:
      --json  Print Workflow Health as JSON
  -h, --help  Show help
`;

export const stowHelpText = `Usage: dotfiles stow [options]

Re-link home/ and ~/.local/bin/dotfiles

Options:
      --dry-run  Preview changes without modifying the filesystem
  -h, --help     Show help
`;

export const cleanHelpText = `Usage: dotfiles clean [options]

Delete Stow backup files from $HOME

Options:
      --yes   Delete Stow backups without prompting
  -h, --help  Show help
`;

export const syncHelpText = `Usage: dotfiles sync [options]

Pull the repo and re-Stow config

Options:
      --dry-run  Preview changes without modifying the filesystem
  -h, --help     Show help
`;

export const commandHelpTexts: Record<string, string> = {
  init: initHelpText,
  doctor: doctorHelpText,
  stow: stowHelpText,
  clean: cleanHelpText,
  sync: syncHelpText,
};
