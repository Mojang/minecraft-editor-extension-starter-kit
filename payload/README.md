# Creator Editor Extension Starter Kit

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

## Developing your Editor Extension

Next, open a `Terminal` in `Visual Studio Code` and type
- `yarn install`

(This should install all the dependent tools required by the compiler)

And now type
- `yarn prepare-win32` (or) `yarn prepare-uwp` (depending on the executable version of Minecraft you're using)

(This should create a new folder in your `Minecraft\development_behavior_packs` folder)

### TODO: Eventually remove `Win32` - External creators will only ever use uwp (until something better comes along)

To compile your extension, type
- `yarn build-win32` or `yarn build-uwp`

(This will compile the `TypeScript` files into JavaScript, and place them in the destination behavior pack)

Start `Minecraft` in Editor Mode, and create a new world.  Browse to the `Behavior Packs` section and you should see your new behavior pack in the `available packs`.  Activate it, and load the world.

## Your new Editor Extension is now loaded and working

-----------------------------------

## Debugging

-   Follow previous step to build files and put into package output. Today by default the bundle has inline source maps.

Execute `reload` command in game:

> /reload

-   From Visual Studio Code press **F5** to make debugger to start listening. Debugger configuration is at `launch.json`.
-   From game run this command:
    > /script debugger connect localhost 19144

### Known issues

- `--watch` option should not be used - the updated build artifacts won't be copied to the destination folder


## Available Scripts

Below are the most common scripts, but refer to the package.json file for up to date scripts that are available.

| Command                             | Description                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `yarn build`                        | Regular build. This creates JS files into `lib` directory and a webpack bundle into the dist directory.                                                                                                                                                                                                                                             |
| `yarn clean`                        | Cleans all output folders.                                                                                                                                                                                                                                                                                                                                                                                                      |
| `yarn build-uwp`      | Build for quick development for **UWP**. <br/>This creates JS files into `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\development_behavior_packs`.
| `yarn build-win32` | Build for quick development for **Win32 x64**. <br/>This creates JS files into `%APPDATA%\MinecraftPE\games\com.mojang\development_behavior_packs`.    |

# FAQ

## I have downloaded update type assets with a new tarball, how do I install them?
Delete the existing types tarball and copy the new tarball into the ./libraries folder. Then, run
```
yarn cache clean --all
```
This will clean up yarn's global cache so that the new tarball can be installed without appearing as a duplicate. Then simply starts again from [instructions above](#steps-to-prepare).
