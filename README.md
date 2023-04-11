# Minecraft Bedrock Editor Extension Starter Kit

This starter kit is intended to get you up and running in writing your own Minecraft Bedrock Editor extensions.

An Editor Extension is basically a way to allow creators to extend the basic Editor experience and to empower you to write your own custom tools to create cool, fun and engaging Minecraft worlds.

The Editor Extension Starter Kit assumes that the creator has at least a rudimentary knowledge of typescript and is somewhat comfortable with the command line.  In addition, some basic knowledge of `git` would be useful.

## Before you begin 

In order to begin, you will need to make sure you have the following software installed

### Required
- [Node.js](https://nodejs.org/en/download) - Node.js provides a full command line driven build environment and tool chain for building scripts for Minecraft Bedrock Scripts (and Editor Extensions) and is a basic requirement
  
### Recommended
- [Visual Studio Code](https://code.visualstudio.com/) - We recommend installing this code editor for developing Minecraft Bedrock Editor Extensions.  Visual Studio Code supports syntax highlighting for JavaScript and Typescript, as well as a full debugging experience for Minecraft Bedrock scripts
  

Also - before you begin, have the following information on hand:
- Where to download (clone) the Bedrock Editor Extension Kit installer
- Where to install the project for your new Bedrock Editor Extension
- Do you want to start with a blank project, or use a template?
- Will you need any icons or text assets for your new extension?

(If you're just starting out, we would recommend creating a folder in "`My Documents`" (maybe call it `minecraft-dev`).  For the purposes of starting out, we'll make that the root of your development environment)

## Downloading

Navigate to `https://github.com/Mojang/minecraft-editor/BedrockEditorExtensionkit` and clone the repository

*(insert clone instructions)*

## Installing

Open Windows PowerShell from the Windows Start Menu, and navigate to the location on your hard drive where you cloned the `BedrockEditorExtensionKit` repository.


Type the following
```bat
node -v
```

If this fails in any way, please ensure you have [Node.js](https://nodejs.org/en/download) installed correctly.

```bat
./install.cmd
```

Using the information you prepared in the [Before you begin](#before-you-begin) section, follow the prompts and answer the questions.

At the end of the process, you should have a new folder containing all the files, folders and  assets required to start your new Minecraft Bedrock Editor Extension.

## Open it your new project

Open Visual Studio Code, and select `File > Open Folder` and select the folder that you chose to install your new Extension project (i.e. `My Documents\minecraft-dev\example1`)

Down the left hand side you will see the file explorer, showing all of the files in your project.

Go to the top menu bar and select `Terminal > New Terminal` (or hit `CTRL+~`).
At the command line, type
```bash
npm install yarn
```
Check that `yarn` installed correctly by typing (you should have a version on or above `v3.2.1`)
```bash
yarn --version
```

Once `node` and `yarn` are installed, all the other tools can be installed by the project itself
```bash
yarn install
```
(This will process your project settings and install all of the tools and symbols required by the Extension kit)