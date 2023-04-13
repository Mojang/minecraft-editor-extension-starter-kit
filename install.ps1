# Minecraft Bedrock Editor Extension Kit

# Summary:
# - Check pre-requisites
#   - Git
#   - Node.js (& yarn)
#   - Minecraft (UWP Preview App)
# - Check Optionals
#   - Visual Studio Code
#
# - Ask some questions
#   - Extension Name (Validate length and char contents)
#   - Install Path
#   - Requires Resources?
#   - Check install path - is this an upgrade? (project already exists)
#   - Check install path - is it on the same drive as Minecraft?

# - Actions
#   - Install Node.js if required
#   - Install Visual Studio Code if required
#   - Copy `payload` folder contents to Install Path
#   - Copy `templates/.env.template` to Install Path as `.env`
#       - Modify all entries within `.env` file with requisite values
#   - Copy `package.json` and alter any entries within
#   - Install yarn
#   - Open VSCode at project path
#   - Open browser at Minecraft Editor hub

$projectName = $null
$projectLocation = $null
$programFilesPath = [Environment]::GetEnvironmentVariable('ProgramFiles')
$applicationDriveLetter = (Split-Path -Qualifier $programFilesPath).TrimEnd(':')

Add-Type -AssemblyName System.Windows.Forms

function validateCurrentLocation() {
    # check to see if there's an install file in the current folder
    $installScript = Join-Path -Path $PSScriptRoot -ChildPath "install.ps1"
    if ( !(Test-Path -Path $installScript) ) {
        Write-Error "Missing installer script"
        return $false
    }

    $installPayload = Join-Path -Path $PSScriptRoot -ChildPath "payload"
    if ( !(Test-Path -Path $installPayload) ) {
        Write-Error "Missing payload folder"
        return $false
    }

    $installTemplates = Join-Path -Path $PSScriptRoot -ChildPath "templates"
    if ( !(Test-Path -Path $installTemplates) ) {
        Write-Error "Missing templates folder"
        return $false
    }

    return $true
}


function Get-YesNoResponse {
    param([string]$prompt)
    do {
        $response = Read-Host -Prompt $prompt
        if ($response.Length -le 1) {
            continue;
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
    Write-Host @"

What kind of Minecraft Bedrock Editor Extension would you like to deploy?
 1. Full functional example (lots of bells & whistles)
 2. Minimal example (just to get an idea how it works)
 3. Empty (just the bare minimum with a stub to get you started)

"@
    while ( $true ) {
        $response = Get-AnyResponse("1, 2 or 3");
        if ($response -eq '1') {
            return "full"
        }
        elseif ($response -eq '2') {
            return "minimal"
        }
        elseif ( $response -eq '3') {
            return "empty"
        }
        else {
            Write-Host "That's an invalid response... try again"
            continue
        }
    }
}


function Get-ValidatedName {
    param(
        [string]$prompt
    )

    do {
        $name = Read-Host -Prompt $prompt
        $isValid = $name -match '^[_a-zA-Z][_a-zA-Z0-9\-]{0,14}$'
        
        if (-not $isValid) {
            Write-Host "Invalid name. Please enter a name that is less than 16 characters long, begins with a letter or underscore and contains only alphanumeric characters, underscores or minus sign"
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
        $dialogResult = $folderBrowserDialog.ShowDialog()

        # Check the dialog result and get the selected folder
        if ($dialogResult -eq [System.Windows.Forms.DialogResult]::OK) {
            $selectedFolder = $folderBrowserDialog.SelectedPath

            $selectedDriveLetter = (Split-Path -Qualifier $selectedFolder).TrimEnd(':')
            if (!($selectedDriveLetter.Equals($applicationDriveLetter))) {
                $message = "Project location should really be on the same drive as Minecraft`nChoose a different location"
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
We recommend you keep it relatively short (16 characters or less), and only include numbers, letters, minus signs or
underscores.
This will be used to name your project folder AND the resource and behavior packs which will contain your
extension, so chose wisely.
(Or just choose something like 'myExtension1' - it's up to you!)

"@

    $name = Get-ValidatedName("Enter your project name");
    Write-Host "'$name' it is... "
    
    return $name
}

function Get-ChooseProjectLocation() {
    Write-Host @"

OK, now we need to choose an install location into which '${projectName}' will be created.
This can be anywhere on your computer.

Important Note: 
This is a little embarrasing, but there's a bug in some of the open source software we rely on during the
build stage of our extension projects.  It's not something we can fix, so we have to work around it.
We recommend that you chose a project install location which is on the '${applicationDriveLetter}:\' drive,
otherwise building and debugging of Minecraft Bedrock Editor Extensions may not work properly.

Use the folder selector to find a location into which we can install your new project...
"@

    $projectLocationResponse = Get-ValidatedProjectFolderDialog
    if (-not $projectLocationResponse.success) {
        Write-Host "User cancelled operation"
        exit
    }

    return $projectLocationResponse;
}

function RefreshEnvironmentAfterInstall() {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
}

# Clear the screen, and start asking questions
Clear-Host

if ( !(validateCurrentLocation) ) {
    Write-Error "This doesn't appear to be a valid install location.`nEnsure that you are running the install script from the extension kit installer folder"
    exit
}

Write-Host @"
Minecraft Bedrock Editor Extension Starter Kit
----------------------------------------------
Before we begin creating a new Minecraft Bedrock Editor Extension Project, you're going to be
asked a few questions to help guide us through the process.

There are some key pieces of software required to get us going, so we're going to check that 
they're installed (and if not, give you a chance to install them).

Remember - If, at any time during this process, you want to stop - hit CTRL+C to break out.

Here we go...

Checking Pre-Requisites...
"@

$minecraftPreviewInstalled = Get-AppxPackage -Name "Microsoft.MinecraftWindowsBeta" -ErrorAction SilentlyContinue
while (-not $minecraftPreviewInstalled) {
    $response = Get-YesNoResponse("Minecraft Preview is a requirment to continue - do you want to continue? (Y/N)");
    if ($response -ne 'Y') {
        exit
    }
    Write-Host "Use the Microsoft Store App to download Minecraft Preview for Windows, and install from there"
    Start-Process "https://apps.microsoft.com/store/detail/minecraft-preview-for-windows/9p5x4qvlc2xr"
    Get-AnyResponse("Waiting... Press ENTER when Minecraft Preview has been installed")

    RefreshEnvironmentAfterInstall
    $minecraftPreviewInstalled = Get-AppxPackage -Name "Microsoft.MinecraftWindowsBeta" -ErrorAction SilentlyContinue
}
Write-Host "[ $(if($minecraftPreviewInstalled) {'INSTALLED'} else {'NOT INSTALLED'}) ] Minecraft Preview"


$nodeInstalled = Get-Command node -ErrorAction SilentlyContinue
while (-not $nodeInstalled) {
    $response = Get-YesNoResponse("Node.js is a requirment to continue - do you want to continue? (Y/N)");
    if ($response -ne 'Y') {
        exit
    }
    Write-Host "Download and install Node.js from this website and return to this installer when you're done"
    Start-Process "https://nodejs.org/en/download"
    Get-AnyResponse("Waiting... Press ENTER when Node.js has been installed")

    RefreshEnvironmentAfterInstall
    $nodeInstalled = Get-Command node -ErrorAction SilentlyContinue
}
Write-Host "[ $(if($nodeInstalled) {'INSTALLED'} else {'NOT INSTALLED'}) ] Node.js"


$vscodeInstalled = Get-Command code -ErrorAction SilentlyContinue
while (-not $vscodeInstalled) {
    $response = Get-YesNoResponse("Visual Studio Code is highly recommended - do you want to continue? (Y/N)");
    if ($response -ne 'Y') {
        break
    }
    Write-Host "Download and install Visual Studio Code from this website and return to this installer when you're done"
    Start-Process "https://code.visualstudio.com/"
    Get-AnyResponse("Waiting... Press ENTER when Visual Studio Code has been installed")

    RefreshEnvironmentAfterInstall
    $vscodeInstalled = Get-Command code -ErrorAction SilentlyContinue
}
Write-Host "[ $(if($vscodeInstalled) {'INSTALLED'} else {'NOT INSTALLED'}) ] Visual Studio Code"


$gitInstalled = Get-Command git -ErrorAction SilentlyContinue
while (-not $gitInstalled) {
    $response = Get-YesNoResponse("Git is highly recommended - do you want to continue? (Y/N)");
    if ($response -ne 'Y') {
        break
    }
    Write-Host "Download and install Git from this website and return to this installer when you're done"
    Start-Process "https://gitforwindows.org/"
    Get-AnyResponse("Waiting... Press ENTER when Git has been installed")

    RefreshEnvironmentAfterInstall    
    $gitInstalled = Get-Command git -ErrorAction SilentlyContinue
}
Write-Host "[ $(if($gitInstalled) {'INSTALLED'} else {'NOT INSTALLED'}) ] Git"

Get-AnyResponse("OK, let's continue -- press ENTER")

# OK, let's sit in a loop and ensure that we end up with a validated destination folder location
# and project name for the extension

$validProjectAndLocation = $false
do {
    Clear-Host

    $projectName = Get-ChooseProjectName

    $projectLocationResponse = Get-ChooseProjectLocation
   
    $projectLocation = Join-Path -Path $projectLocationResponse.target -ChildPath $projectName
    if (Test-Path -Path $projectLocation) {
        Write-Host 
        @"
The folder '$projectLocation' already exists.  
Why don't you take a quick look inside and make sure there's nothing you don't want to lose.
If you chose to continue with installation at this location, the contents will be destroyed!

"@

        $response = Get-YesNoResponse("Do you want to continue (Y) or choose a new location (N)")
        if ($response -eq 'N') {
            # Back to choose name
            continue
        }
        Write-Host @"
I'll open it up and you take a look inside.  Come back and choose whether or not to continue.
"@
        Invoke-Item $projectLocation

        $response = Get-YesNoResponse("Are you really sure you want to use this location? (Y/N)")
        if ($response -eq 'N') {
            # Back to choose name
            continue
        }

        # Delete the folder contents
        try {
            Write-Host "Clearing the contents of '$projectLocation'"
            Remove-Item -Path "$projectLocation\*" -Recurse -ErrorAction Stop
        }
        catch {
            Write-Error "Clearing out the folder failed with an error.  Recommend you chose a new location."
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
            Write-Error "An error occurred creating the new project install folder.  Recommend you chose a new location."
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
        Write-Error "There appears to be issues with writing to that location.  You should choose a different one."
        Write-Error $_
        continue;
    }

    $validProjectAndLocation = $true

} while (!$validProjectAndLocation)

Clear-Host

$resourcesRequired = Get-YesNoResponse("Do you plan on adding any Resources to your extension? (Icons, Textures, text strings, etc?) (Y/N)")
if ($resourcesRequired -eq 'Y') {
    $resourcesRequired = "Yes"
}
else {
    $resourcesRequired = "No"
}

$extensionType = Get-ExtensionTypeResponse

Clear-Host

Write-Host "Project '${projectName}' will be installed to '${projectLocation}'"
Write-Host "`nPreparing installation...`n"

# Now, let's start copying files from the payload to the destination folder

Write-Host "[ Deploying Build Pipeline ]"
$sourcePayload = Join-Path -Path $PSScriptRoot -ChildPath "payload\*"
try {
    Copy-Item -Path $sourcePayload -Destination $projectLocation -Recurse
}
catch {
    Write-Error "There was an issue copying the files to the project folder"
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
    $sourceEnvTemplate = Get-Content -Path $sourceEnvTemplateLocation -Raw

    $sourceEnvTemplate = $sourceEnvTemplate -replace ">>MC_EXTENSION_NAME<<", $projectName
    $sourceEnvTemplate = $sourceEnvTemplate -replace ">>MC_PACK_NAME<<", $projectName
    $sourceEnvTemplate = $sourceEnvTemplate -replace ">>MC_BEHAVIOR_PACK_UUID<<", $behaviorPackGUID
    $sourceEnvTemplate = $sourceEnvTemplate -replace ">>MC_BEHAVIOR_PACK_SCRIPT_UUID<<", $behaviorScriptModuleGUID
    $sourceEnvTemplate = $sourceEnvTemplate -replace ">>MC_EXTENSION_GENERATE_RESOURCE_PACK<<", $resourcesRequired
    $sourceEnvTemplate = $sourceEnvTemplate -replace ">>MC_RESOURCE_PACK_UUID<<", $resourcePackGUID
    $sourceEnvTemplate = $sourceEnvTemplate -replace ">>MC_RESOURCE_PACK_RESOURCES_UUID<<", $resourcePackResourcesModuleGUID
    $sourceEnvTemplate = $sourceEnvTemplate -replace ">>MC_UWP_APPLICATION_ID<<", $minecraftPreviewPackageFamilyName

    Set-Content -Path $destinationEnvLocation -Value $sourceEnvTemplate


    $packageJsonLocation = Join-Path -Path $projectLocation -ChildPath "package.json"
    $sourcePackageJson = Get-Content -Path $packageJsonLocation -Raw

    $sourcePackageJson = $sourcePackageJson -replace ">>MC_EXTENSION_NAME<<", $projectName
    Set-Content -Path $packageJsonLocation -Value $sourcePackageJson -Force -ErrorAction Continue
}
catch {
    Write-Error "There was an issue setting up the default environment template"
    Write-Error $_
    exit;
}

Write-Host "[ Deploying Extension Template ]"

$templateSource = Join-Path -Path $PSScriptRoot -ChildPath "templates/src/extension-$extensionType/*"
$templateDest = Join-Path -Path $projectLocation -ChildPath "src/extension/"
try {
    New-Item -ItemType Directory -Path $templateDest -ErrorAction SilentlyContinue -Force | Out-Null
    Copy-Item -Path $templateSource -Destination $templateDest -Recurse
}
catch {
    Write-Error "There was an issue copying the template project files to the extension folder"
    Write-Error $_
    exit
}

Write-Host "[ Setting up Node.js and yarn command line tools ]"
try {
    Push-Location $projectLocation
    npm install -g yarn
}
catch {
    Write-Error "There was an issue installing yarn from npm and building the yarn cache - you may have to do it by hand"
}
finally {
    Pop-Location
}

Write-Host "[ Setting up dev dependencies using yarn ]"
try {
    Push-Location $projectLocation
    yarn install
}
catch {
    Write-Error "There was an issue installing yarn from npm and building the yarn cache - you may have to do it by hand"
}
finally {
    Pop-Location
}

Write-Host @"

[ Project Deployment Complete ]

The Minecraft Bedrock Editor Extension named '$projectName' has been installed to
'$projectLocation' and is ready to be used.

Check out the README.md in the root of the install folder for instructions on how to build
and test the extension in the Minecraft Bedrock Editor

Have fun!

"@

$readmeLocation = Join-Path -Path $projectLocation -ChildPath "GettingStarted.html"
Start-Process "$readmeLocation"
exit
