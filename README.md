# Minecraft Bedrock Editor Extension Starter Kit

The Minecraft Bedrock Editor Extension Starter Kit is intended to get you up and running in writing your own Minecraft Bedrock Editor extensions.

An Editor Extension is basically a way to allow creators to extend the basic Editor experience and to empower you to write your own custom tools to create cool, fun and engaging Minecraft worlds.

The Minecraft Bedrock Editor Extension Starter Kit assumes that the creator has at least a rudimentary knowledge of typescript and is somewhat comfortable with the command line.  In addition, some basic knowledge of `git` would be useful (but not required).

## Before you begin 

In order to begin, you will need to make sure you have the following software installed

### Required
- [Node.js](https://nodejs.org/en/download) - Node.js provides a full command line driven build environment and tool chain for building scripts for Minecraft Bedrock Scripts (and Editor Extensions) and is a basic requirement
  
### Recommended
- [Git](https://gitforwindows.org/) - We recommend installing Git as a method of fetching the latest starter kit changes, or storing your project where it won't get lost in the event of a system failure.  Git isn't required (there are many other alternative solutions like SVN, Perforce, etc), but Git is the one Mojang uses
- [Visual Studio Code](https://code.visualstudio.com/) - We recommend installing this code editor for developing Minecraft Bedrock Editor Extensions.  Visual Studio Code supports syntax highlighting for JavaScript and Typescript, as well as a full debugging experience for Minecraft Bedrock scripts
  

Also - before you begin, have the following information on hand:
- Where to download (clone) the Bedrock Editor Extension Kit installer
- Where to install the project for your new Bedrock Editor Extension
- Do you want to start with a blank project, or use a template?
- Will you need any icons or text assets for your new extension?

(If you're just starting out, we would recommend creating a folder in "`My Documents`" (maybe call it `minecraft-dev`).  For the purposes of starting out, we'll make that the root of your development environment)

## Downloading

Navigate to `https://github.com/Mojang/minecraft-editor/BedrockEditorExtensionkit` and either clone the repository to a location on your hard drive (use your knowledge of `git` here), or download the kit as a `ZIP` file and uncompress it to a temporary location.


## Installing

Open Windows PowerShell from the Windows Start Menu, and navigate to the location on your hard drive where you placed the Extension Kit Installer.


```powershell
./install.ps1
```

Using the information you prepared in the [Before you begin](#before-you-begin) section, follow the prompts and answer the questions.

At the end of the process, you should have a new folder containing all the files, folders and  assets required to start writing your new Minecraft Bedrock Editor Extension.

## Open your new project

Open Visual Studio Code, and select `File > Open Folder` and select the folder that you chose to install your new Extension project (i.e. `My Documents\minecraft-dev\example1`)

Down the left hand side you will see the file explorer, showing all of the files in your project.

Go to the top menu bar and select `Terminal > New Terminal` (or hit `CTRL+~`).
```bash
yarn install
```
This will process your project settings and install all of the tools and symbols required by the Extension kit.

The first step is to prepare a behavior pack destination (and resource pack destination if you chose to install any assets) - these will be deployed to the Minecraft `development_behavior_packs` and `developement_resource_packs` folders.  These are folders that live in tandem with your Minecraft worlds and various other Minecraft files.
```bash
yarn prepare
```

You can open a file explorer and check if you like.
Open a Windows File Explorer window and paste
```bat
%LOCALAPPDATA%\Packages\Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe\LocalState\games\com.mojang
```
into the address bar.  You should see a number of folders in there...
```
  behavior_packs
  development_behavior_packs
  development_resource_packs
  development_skin_packs
  minecraftWorlds
  minecraftpe
  resource_packs
  skin_packs
  world_templates
```

If you look inside `development_behavior_packs` you should see a folder with the name of your new extension. (If you chose to add assets, there should be a matching folder in `development_resource_packs` too)

The `prepare` step is only really needed if you ever add new assets (textures, text strings, custom files) to your extension - it basically copies the folders from `<install_location>\assets\` to the `development` packs folders where Minecraft can find them.

## Development Cycle

The development cycle is relatively straight forward.<br>
Open Visual Studio Code and write some TypeScript.  Open a `New Terminal` in Visual Studio Code (make sure you're in the root of your new extension project) and type
```bash
yarn build
```

This will run the TypeScript compiler and compile your extension source code.  If it compiles successfully, the compiled code will be deployed to the `development_behavior_packs` folder, ready for Minecraft.

## Open Minecraft (Preview)

Currently, Bedrock Editor is only available in Preview editions of Minecraft Bedrock - you need to make sure that you've installed the Preview edition from the Microsoft Store (or Minecraft Installer)

To open Minecraft in Editor mode, you need to start the game using a special `Protocol Activation` method.
Press the Windows Key and `R` key together - this will launch the `Windows Run Dialog`
Enter the string
```bat
minecraft.exe:?Editor=true
```
and hit ENTER.  The Minecraft Preview edition should start up in Editor mode (you can tell it's Editor mode because the usual `Play Game` and `Settings` buttons are missing, and you're immediately presented with a `Create Project` screen).

Create a new Editor Project (give it any name you want), but before launching it - go to the `Behavior Packs` tab and navigate to `Available Packs`.  You should see your new Editor Extension in that list.
Add the behavior pack to your world project (and add the Resource pack if you chose to add assets) - then launch the world.



