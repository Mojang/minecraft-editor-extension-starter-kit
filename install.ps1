# Minecraft Bedrock Editor Extension Kit

# Summary:
# - Check pre-requisites
#   - Node.js (& yarn)
#   - Minecraft (UWP Preview App)
# - Check Optionals
#   - Visual Studio Code
#
# - Ask some questions
#   - Install Path
#   - Extension Name (Validate length and char contents)
#   - Requires Resources?
#   - Check install path - is this an upgrade? (project already exists)
#       - Check version number
#       - Query - upgrade or repair?
#   - Check install path - is it on the same drive as Minecraft?

# - Actions
#   - Open browser at `README.md`
#   - Install Node.js if required
#   - Install Visual Studio Code if required
#   - Copy `payload` folder contents to Install Path
#   - Copy `templates/.env.template` to Install Path as `.env`
#       - Modify all entries within `.env` file with requisite values
#   - Install yarn if required (within scope of project path)
#   - Open VSCode at project path
#   - Open browser at Minecraft Editor hub

## DGC- TODO - Make sure github is hosting our readme
#Start-Process "https://github.com/Mojang/minecraft-editor#readme"


if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "Node.js is installed."
} else {
    Write-Host "Node.js is not installed."
}

if (Get-Command code -ErrorAction SilentlyContinue) {
    Write-Host "Visual Studio Code is installed."
} else {
    Write-Host "Visual Studio Code is not installed."
}