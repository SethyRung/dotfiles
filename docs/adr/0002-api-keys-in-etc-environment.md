# API Keys go in /etc/environment

Bootstrap prompts for `key=value` pairs and writes them to `/etc/environment` so every process on the machine sees them, not only the shell. The cost is sudo during Bootstrap and a world-readable file (mode 644). A user-owned `600` file or systemd user env would be safer; we rejected those because system-wide visibility is the point. Writes merge: add or update only those keys, never replace the whole file (PATH and other lines stay).
