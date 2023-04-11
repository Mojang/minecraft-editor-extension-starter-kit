# Creator Editor Extension Starter Kit

Editor extensions allow the creator to extend the functionality of the Minecraft Editor using specially defined editor Extensions written primarily in Typescript/JavaScript.

This starter kit should provide everything you need to get started writing your own extension code, including preparing behavior packs in the correct destination folders where the various Minecraft executable types can find them.

Currently, we support
- ### Win32
- ### UWP

Further build targets will be supported as required.

# Development tools

Ensure that you have `Visual Studio Code` and `yarn` installed
(TODO: Expand on these instructions)

# Steps to prepare

To first create a new extension, `unzip` the contents of the starter kit to a folder on your hard drive where you will be developing.  This can be anywhere, but make sure it's somewhere that gets regularly backed up.
e.g.
<br>
- `Documents\Minecraft\My Editor Extensions\my-new-extension`

<br>
Open `Visual Studio Code` and select `Open Folder`.<br>
Select the path you where you chose to extract the files.
<br><br>

Next thing you need to do is locate the `.env` file in the project window in `Visual Studio Code` (on the left pane) - open it, and set the values to the various fields to your preferences.
<br><br>

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
