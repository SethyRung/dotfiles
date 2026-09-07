# .env Input and Selectable Store Location for Environment Variables

Bootstrap loads default environment variables from `.env` in the repository root if present, displaying only variable names (never secret values), and allows modifying them via Override or Append before writing. If no `.env` is present, it falls back to the interactive CSV prompt.

The destination store location is selectable from predefined options (defaulting to `/etc/environment`, with `~/.zshenv`, `~/.profile`, and custom paths supported). Writes merge into the chosen target without overwriting unrelated existing lines.
