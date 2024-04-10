# Minecraft Bedrock Editor Extension Kit

# Summary:
# - Check pre-requisites (exit out if not present)
#   - Minecraft (UWP Preview App)
#   - Node.js
# - Check Optionals
#   - Visual Studio Code
#
# - Ask some questions
#   - Extension Name (Validate length and char contents)
#   - Install Path
#   - Pick a template
#   - Check install path - is this an upgrade? (project already exists)
#   - Check install path - is it on the same drive as Minecraft?

# - Actions
#   - Copy `payload` folder contents to Install Path
#   - Copy `templates/.env.template` to Install Path as `.env`
#       - Modify all entries within `.env` file with requisite values
#   - Copy `package.json` and alter any entries within
#   - Copy any README files over
#   - Unzip the template into the Install Path
#   - Run `npm install` in the Install Path
#   - Open VSCode at project path
#   - Open browser at Minecraft Editor hub

$osDescription = [System.Runtime.InteropServices.RuntimeInformation]::OSDescription
if (-not ($osDescription -match "Windows")) {
    $osDescription = [System.Environment]::OSVersion
    if (-not ($osDescription -match "Windows")) {
        Clear-Host
        Write-Host @"
The Minecraft Bedrock Editor Extension Kit is currently only designed to work in Windows environments.
If you really want to start developing Minecraft Bedrock Editor Extensions, then you should 
investigate either using a Windows PC, or installing Windows in a Virtual Machine Environment.
Thanks for trying though!
"@  -ForegroundColor Red
        exit
    }
}

$projectName = $null
$projectLocation = $null
$programFilesPath = [Environment]::GetEnvironmentVariable('ProgramFiles')
$applicationDriveLetter = (Split-Path -Qualifier $programFilesPath).TrimEnd(':')
$payloadFolderPath = Join-Path -Path $PSScriptRoot -ChildPath "payload"
$installerScriptPath = Join-Path -Path $PSScriptRoot -ChildPath "install.ps1"
$templatesFolderPath = Join-Path -Path $PSScriptRoot -ChildPath "templates"
$templatesSampleIndexFilePath = Join-Path -Path $templatesFolderPath -ChildPath "sample-index.json"
$sampleTemplatesList = $null

Add-Type -AssemblyName System.Windows.Forms

function validateCurrentLocation() {
    # check to see if there's an install file in the current folder
    if ( !(Test-Path -Path $installerScriptPath) ) {
        Write-Error "Missing installer script"
        return $false
    }

    if ( !(Test-Path -Path $payloadFolderPath) ) {
        Write-Error "Missing payload folder"
        return $false
    }

    if ( !(Test-Path -Path $templatesFolderPath) ) {
        Write-Error "Missing templates folder"
        return $false
    }

    
    if ( !(Test-Path -Path $templatesSampleIndexFilePath) ) {
        Write-Error "Missing sample index file"
        return $false
    }
    
    return $true
}


# Validate the loaded sample index JSON file and check that all the
# sample archives are present
function validateTemplateIndex {
    param($templateJson)

    if($null -eq $templateJson) {
        Write-Error "Failed to load JSON sample index - check it's there, and is valid JSON"
        return $false
    }

    $returnValue = $true
    $templateCount = 0;

    foreach ($item in $templateJson) {
        $archiveFilename = Join-Path -Path $PSScriptRoot -ChildPath ".\templates\$($item.target_name).zip"
        if ( !(Test-Path -Path $archiveFilename) ) {
            Write-Error "Missing template sample $($item.target_name).zip"
            $returnValue = $false
        }
        else {
            $templateCount++
        }
    }

    Write-Host "Found $($templateCount) samples..."

    return $returnValue
}


function Get-YesNoResponse {
    param(
        [string]$prompt,
        [string]$default
    )
    
    $default = $default.ToUpper()
    if ($default -ne 'Y' -and $default -ne 'N') {
        $default = ""
    }
    if ($default.Length -gt 1) {
        $default = $default[0]
    }

    do {
        $response = Read-Host -Prompt $prompt
        if ($response.Length -lt 1) {
            if ($default.Length -eq 1) {
                $response = $default
            }
            else {
                continue
            }
        }
        $response = $response.toUpper()[0];
    } while ($response -ne 'Y' -and $response -ne 'N')

    return $response
}

function Get-AnyResponse {
    param([string]$prompt)
    $response = Read-Host -Prompt $prompt
    return $response
}


function Get-ExtensionTypeResponse {
    param($templateList)

    if($null -eq $templateList) {
        Write-Error "Failed to load JSON sample index - check it's there, and is valid JSON"
        return $null
    }

    Write-Host @"

Choose a template for your extension:
    - If you're starting out to write your own, choose 'Empty'
    - If you're looking for an example to copy - choose one that best
        matches what you're trying to do.
    Check out the Editor Samples GitHub repo for a complete list of the sample templates
        available, and what they do.
        https://github.com/Mojang/minecraft-editor-extension-samples

"@

    $templateCount = 0
    foreach ($item in $templateList) {
        Write-Host "$($templateCount + 1). $($item.name) -- $($item.short_description)"
        $templateCount++
    }

    if(0 -ge $templateCount) {
        Write-Host "Something is wrong, there are no templates to choose from"
        return $null
    }

    Write-Host ""
    $isValid = $false

    do {
        $response = Get-AnyResponse "Which sample template ?  (1 ... $($templateCount))"
        $isValid = $response -match '^[1-9][0-9]*$'
        if ($isValid) {
            $response = [int]$response
            if ($response -gt $templateCount) {
                $isValid = $false
            }
        }
    } while (-not $isValid)

    $sample = $templateList[$response - 1]
    return $sample
}


function Get-ValidatedName {
    param(
        [string]$prompt
    )

    do {
        $name = Read-Host -Prompt $prompt
        $isValid = $name -match '^[_a-zA-Z][_a-zA-Z0-9\-]{0,14}$'
        
        if (-not $isValid) {
            Write-Host "Invalid name. Please enter a name that is 16 characters long (or fewer), begins with a letter or underscore, and contains only alphanumeric characters, underscores, or minus signs."
        }
    } while (-not $isValid)

    return $name
}

function Get-ValidatedProjectFolderDialog {
    
    $canQuit = $false
    while (!($canQuit)) {

        $returnValue = "" | Select-Object -Property success, target

        # Create an instance of FolderBrowserDialog
        $folderBrowserDialog = New-Object System.Windows.Forms.FolderBrowserDialog

        # Set the dialog properties (optional)
        $folderBrowserDialog.Description = 'Select or Create a Project install folder:'
        $folderBrowserDialog.RootFolder = "MyComputer"

        # Display the folder selector dialog
        $dialogResult = $folderBrowserDialog.ShowDialog((New-Object System.Windows.Forms.Form -Property @{TopMost = $true }))

        # Check the dialog result and get the selected folder
        if ($dialogResult -eq [System.Windows.Forms.DialogResult]::OK) {
            $selectedFolder = $folderBrowserDialog.SelectedPath

            $selectedDriveLetter = (Split-Path -Qualifier $selectedFolder).TrimEnd(':')
            if (!($selectedDriveLetter.Equals($applicationDriveLetter))) {
                $message = "Project location should really be on the same drive as Minecraft`n. Please choose a different location."
                $title = "Warning"
                $buttons = [System.Windows.Forms.MessageBoxButtons]::OK
                [System.Windows.Forms.MessageBox]::Show($message, $title, $buttons)
                continue;
            }

            $returnValue.success = $true
            $returnValue.target = $selectedFolder
            $canQuit = $true;
        }
        else {
            $returnValue.success = $false
            $canQuit = $true;
        }
    }

    return $returnValue
}

function Get-ChooseProjectName() {
    Write-Host @"

Let's choose a name for your new Minecraft Bedrock Editor Extension project.
We recommend you keep it relatively short (16 characters or less), begins with a letter or underscore, and contains only alphanumeric characters, underscores, or minus signs.
This will be used to name your project folder AND the resource and behavior packs which will contain your
extension.

"@

    $name = Get-ValidatedName("Enter your project name");
    Write-Host "'$name' it is... "
    
    return $name
}

function Get-ChooseProjectLocation() {
    Write-Host @"

Choose an install location into which '${projectName}' will be created.
This can be anywhere on your computer.

Important Note: 
We recommend that you choose a project install location which is on the '${applicationDriveLetter}:\' drive,
otherwise there may be issues with building and debugging your Extension.

Use the folder selector to find a location into which we can install your new project...

"@

    $projectLocationResponse = Get-ValidatedProjectFolderDialog
    if (-not $projectLocationResponse.success) {
        Write-Host "User cancelled operation"  -ForegroundColor Red
        exit
    }

    return $projectLocationResponse;
}

function RefreshEnvironmentAfterInstall() {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
}

###################################################################################################
#
# Installer Begins here
#
###################################################################################################




# Clear the screen, and start asking questions
Clear-Host

# Let's check (as best we can) that nothing is missing
if ( !(validateCurrentLocation) ) {
    Write-Error @"

This doesn't appear to be a valid install source (or there are files missing from the starter kit).

Ensure that you are running the install script from the extension kit installer folder.
If you continue to encounter issues - just delete this whole folder and re-download it from GitHub.

"@
    exit
}

# Load the sample index JSON file and convert it to a PowerShell object
#  - We're going to use the contents of this file to drive the template choice
#
$sampleTemplatesList = Get-Content -Path $templatesSampleIndexFilePath -Raw -ErrorAction SilentlyContinue | ConvertFrom-Json
if ($null -eq $sampleTemplatesList) {
    Write-Error "Unable to load sample index file"
    exit
}
if(!(validateTemplateIndex $sampleTemplatesList)) {
    exit;
}


Write-Host @"

Minecraft Bedrock Editor Extension Starter Kit
----------------------------------------------

Before we begin creating a new Minecraft Bedrock Editor Extension Project, you're going to be
asked a few questions to help guide us through the process.

There are some key pieces of software required to get us going, so we're going to check that 
they're installed.

Remember: If at any time during this process you want to stop, hit CTRL+C to break out.

Here we go!

Checking prerequisites...

"@

Get-AnyResponse "Hit ENTER to continue"

Clear-Host


# Check to see if Minecraft Preview is installed, and give the user a chance to do so
# REQUIRED!
$minecraftPreviewInstalled = Get-AppxPackage -Name "Microsoft.MinecraftWindowsBeta" -ErrorAction SilentlyContinue
Write-Host "[ $(if($minecraftPreviewInstalled) {'INSTALLED'} else {'NOT INSTALLED'}) ] Minecraft Preview"

# Check to see if Node.js is installed
# REQUIRED!
$nodeInstalled = Get-Command node -ErrorAction SilentlyContinue
Write-Host "[ $(if($nodeInstalled) {'INSTALLED'} else {'NOT INSTALLED'}) ] Node.js"


$vscodeInstalled = Get-Command code -ErrorAction SilentlyContinue
Write-Host "[ $(if($vscodeInstalled) {'INSTALLED'} else {'NOT INSTALLED'}) ] Visual Studio Code"

if( !($minecraftPreviewInstalled -and $nodeInstalled) ) {
    Write-Host @"

It looks like you're missing some of the required software to get started.
This Starter Kit will exit now to give you a chance to install the prerequisite software.
When you're confident that you've installed the missing software, run this script again.
"@ -ForegroundColor Red
    exit
}


# OK, let's sit in a loop and ensure that we end up with a validated destination folder location
# and project name for the extension

$validProjectAndLocation = $false
do {
    $projectName = Get-ChooseProjectName

    $projectLocationResponse = Get-ChooseProjectLocation
   
    $projectLocation = Join-Path -Path $projectLocationResponse.target -ChildPath $projectName
    if (Test-Path -Path $projectLocation) {

        $promptString = @"

The folder '$projectLocation' already exists.  
Take a quick look inside to make sure there isn't anything you don't want to lose.
If you choose to continue with installation at this location, the contents will be destroyed!

Open the folder and check (y/N)?
"@

        $response = Get-YesNoResponse $promptString "N"
        if ($response -eq 'N') {
            # Back to choose name
            continue
        }

        $promptString = @"
Opening the folder for you to check.  Take a look inside and come back and
choose whether you want to continue.

Continue and delete everything (y/N)?
"@
        # Open a file explorer at the new location
        Invoke-Item $projectLocation

        $response = Get-YesNoResponse $promptString "N"
        if ($response -eq 'N') {
            # Back to choose name
            continue
        }

        # When we get around to doing a new version or upgrade path - we can check the `.version` file
        # here and update the package.json and a few other files rather than blasting the folder contents

        # Delete the folder contents
        try {
            Write-Host "Clearing the contents of '$projectLocation'"
            Remove-Item -Path "$projectLocation\*" -Recurse -ErrorAction Stop
        }
        catch {
            Write-Error "Clearing out the folder failed with an error.  We recommend you choose a new location."
            Write-Error $_
            continue
        }
    }

    # Create the new project folder if it doesn't exist
    if (!(Test-Path -PathType container "$projectLocation")) {
        try {
            Write-Host "Creating new project folder - '$projectLocation'"
            New-Item -ItemType Directory -Path $projectLocation -ErrorAction Stop | Out-Null
        }
        catch {
            Write-Error "An error occurred creating the new project install folder.  We recommend you choose a new location."
            Write-Error $_
            continue
        }
    }

    # Let's do a quick temporary file write to see if we have permissions
    try {
        $testFilePath = Join-Path -Path $projectLocation -ChildPath "temp_file.txt"
        New-Item -ItemType File -Path $testFilePath -Force | Out-Null
        Remove-Item -Path $testFilePath -Force
    }
    catch {
        Write-Error "There appears to be issues writing to that location.  Please choose a different one."
        Write-Error $_
        continue;
    }

    $validProjectAndLocation = $true

} while (!$validProjectAndLocation)


$resourcesRequired = "Yes"

# Fetch the JSON item that relates to the particular sample template that the user has chosen
#
$extensionType = Get-ExtensionTypeResponse $sampleTemplatesList
if($null -eq $extensionType) {
    Write-Error "Unable to determine the template to use for the project"
    exit
}

# START THE INSTALL PROCESS!
# --------------------------------------------------------------------------

Clear-Host

Write-Host ""
Write-Host ""

$promptString = @"

Project '${projectName}' will be installed to '${projectLocation}'.
  The template '$($extensionType.name)' will be used to create the project.

Do you want to proceed? (y/N)

"@
$confirmContinue = Get-YesNoResponse $promptString "N"
if ($confirmContinue -ne 'Y') {
    exit
}

Write-Host "`nPreparing installation...`n"

# Now, let's start copying files from the payload to the destination folder

Write-Host "[ Deploying Build Tools ]"
$sourcePayload = Join-Path -Path $PSScriptRoot -ChildPath "payload\*"
try {
    Copy-Item -Path $sourcePayload -Destination $projectLocation -Recurse
}
catch {
    Write-Error "There was an issue copying the files to the project folder."
    Write-Error $_
    exit
}

$sourceEnvTemplate = $null
$sourceEnvTemplateLocation = Join-Path -Path $PSScriptRoot -ChildPath ".\templates\.env.template"
$behaviorPackGUID = New-Guid
$behaviorScriptModuleGUID = New-Guid
$resourcePackGUID = New-Guid
$resourcePackResourcesModuleGUID = New-Guid
$destinationEnvLocation = Join-Path -Path $projectLocation -ChildPath ".env"
$minecraftPreviewPackageFamilyName = $minecraftPreviewInstalled.PackageFamilyName

try {
    Write-Host "[ Deploying Customized Build Environment ]"

    # Load the template .env file and find/replace the keys with the actual values
    # we've generated over the course of the installer

    $sourceEnvTemplate = Get-Content -Path $sourceEnvTemplateLocation -Raw

    $sourceEnvTemplate = $sourceEnvTemplate -replace ">>MC_EXTENSION_NAME<<", $projectName
    $sourceEnvTemplate = $sourceEnvTemplate -replace ">>MC_PACK_NAME<<", $projectName
    $sourceEnvTemplate = $sourceEnvTemplate -replace ">>MC_BEHAVIOR_PACK_UUID<<", $behaviorPackGUID
    $sourceEnvTemplate = $sourceEnvTemplate -replace ">>MC_BEHAVIOR_PACK_SCRIPT_UUID<<", $behaviorScriptModuleGUID
    $sourceEnvTemplate = $sourceEnvTemplate -replace ">>MC_EXTENSION_GENERATE_RESOURCE_PACK<<", $resourcesRequired
    $sourceEnvTemplate = $sourceEnvTemplate -replace ">>MC_RESOURCE_PACK_UUID<<", $resourcePackGUID
    $sourceEnvTemplate = $sourceEnvTemplate -replace ">>MC_RESOURCE_PACK_RESOURCES_UUID<<", $resourcePackResourcesModuleGUID
    $sourceEnvTemplate = $sourceEnvTemplate -replace ">>MC_UWP_APPLICATION_ID<<", $minecraftPreviewPackageFamilyName

    # And write it out to the new location
    Set-Content -Path $destinationEnvLocation -Value $sourceEnvTemplate

    # Load the package.json and make sure the project name is set correctly for npm
    $packageJsonLocation = Join-Path -Path $projectLocation -ChildPath "package.json"
    $sourcePackageJson = Get-Content -Path $packageJsonLocation -Raw

    $sourcePackageJson = $sourcePackageJson -replace ">>MC_EXTENSION_NAME<<", $projectName

    # write it out to the new location
    Set-Content -Path $packageJsonLocation -Value $sourcePackageJson -Force -ErrorAction Continue
}
catch {
    Write-Error "There was an issue setting up the default environment template."
    Write-Error $_
    exit;
}

Write-Host "[ Deploying README files ]"
try {
    # Copy over the README markdown and html files
    $readme = Join-Path -Path $PSScriptRoot -ChildPath "README.*"
    Copy-Item -Path $readme -Destination $projectLocation
}
catch {
    Write-Error "There was an issue copying the README files to the extension folder."
    Write-Error $_
    exit
}

Write-Host "[ Deploying Extension Template ]"

# The $extensionType variable is set by the Get-ExtensionTypeResponse function
# and contains a JSON object of from the `sample-index.json` list
try {
    $templateZip = Join-Path -Path $PSScriptRoot -ChildPath "templates\$($extensionType.target_name).zip"
    Expand-Archive -Path $templateZip -DestinationPath $projectLocation -Force

    # Some of the ZIP's don't contain assets, but the helper scripts and package.json sometimes assume
    # that the asset folders exist.  So, let's make sure they do.
    New-Item -ItemType Directory -Path "$projectLocation\assets\resource\textures" -Force | Out-Null
    New-Item -ItemType Directory -Path "$projectLocation\assets\resource\texts" -Force | Out-Null
}
catch {
    Write-Error "There was an issue copying the template project files to the extension folder."
    Write-Error $_
    exit
}

# Run npm install to make sure that all the dev tool dependencies are all set up
# and everything is cached in the lock file

Write-Host "[ Setting up dev dependencies ]"
try {
    Push-Location $projectLocation
    npm install --legacy-peer-deps
}
catch {
    Write-Error "There was an issue installing npm package cache. You may have to do it manually."
}
finally {
    Pop-Location
}

# Display a summary - we're all ready to go now!

Write-Host @"

[ Project Deployment Complete ]

The Minecraft Bedrock Editor Extension named '$projectName' has been installed to
'$projectLocation' and is ready to be used.

Check out the README.md in the root of the install folder for instructions on how to build
and test the extension in the Minecraft Bedrock Editor

Have fun!

Hit ENTER to open Visual Studio Code the README and start creating!

"@

Get-AnyResponse("All done - Hit ENTER")

if (-not $vscodeInstalled) {
    # If VSCode is not installed, open the browser pointing at the README.html file
    
    $readmeLocation = Join-Path -Path $projectLocation -ChildPath "README.html"
    Start-Process "$readmeLocation"
}
else {
    # if VSCode IS installed, open it at the project location, and open the README.md file by default
    $readmeLocation = Join-Path -Path $projectLocation -ChildPath "README.md"
    code $projectLocation $readmeLocation
}
