# Distro packages via Package Map; the rest via Upstream Install

`dot` installs zsh/git/stow/Ghostty through a Package Map so any Distro works. Tools that are not Distro packages (Oh My Zsh, herdr, bun, pi) use their official Upstream Install (curl script or binary). Mixing the two is deliberate: one file for package names, no fake Distro packages for GitHub-only tools.
