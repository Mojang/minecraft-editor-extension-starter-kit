# Minecraft Bedrock Editor

## What is is?

The Minecraft Bedrock Editor is a framework that is built into certain platform versions of Minecraft Bedrock Edition that is designed to allow creators to use more complex tools than simple gameplay allows to build, edit and test worlds.  
In fact, the Editor framework is built in such a way as to allow creators to build their own tools to accomplish complex tasks.  

The Minecraft Bedrock Editor (the Editor) leverages the games built-in JavaScript Scripting API in conjunction with a number of native tools built directly into the game to expose a rich environment in which creators can build and test tools which empower and enhance their editing experience.  

We call these **Editor Extensions**.

&nbsp;

## What is an Editor Extension?

An Extension is a collective name for a set of resource and behavior packs which contain script and binary assets which are loaded when the Editor starts up.

The Extensions are written in TypeScript and are compiled into JavaScript for loading into the game.  The compiler tools and various libraries required to do this are supplied in the [Editor Extension Starter Kit](https://github.com/dacowan/EditorExtensionStarterKit).

The behavior pack will contain the compiled scripts which will execute on the server, and the resource pack will contain the binary assets required by the Extension (icons, text files, etc).

For a set of install instructions and pre-requisite software that is required to start, please refer to the [Editor Extension Starter Kit README](https://github.com/dacowan/EditorExtensionStarterKit/blob/main/README.md)  

&nbsp;

## Anatomy of an Extension

It's important to understand how Extensions differ from gameplay scripts.  
When Minecraft server starts up, it loads all of the scripts from all of the behavior packs in the world.  Each script is executed in turn.  This happens only once when the server loads a world.  
> Remember that there may not be a player connected yet; in the case of a dedicated server, the world may be loaded without any players attached - you cannot assume that any players exist at this point.  

Editor takes this initialization opportunity to load and execute all of the Extension scripts - but because this is a 'global' phase (and there may not be any player connected), the extensions will generally just call `registerEditorExtension`.  

There are two main bodies of code associated with an Extension - the `activation` and `deactivation` closures.  

When a player initially connects to the server, the `activation` closure is executed.  
When that player leaves the server, the `deactivation` closure is executed.  

This will happen for all players who join the Editor server.  

Normal gameplay scripts don't have this concept of activation/deactivation - it's generally up to you to register for "player join" events, but Editor provides a lot of contextual data and interfaces by leveraging these code closures.  

One of the things to remember about Editor which differs slightly from gameplay -- Editor is almost entirely player oriented; everything you do in editor is specific to the player context (each player has a collection of services that are used to manage that players editing environment, undo/redo state, clipboard, etc), so editor provides a lot more wrapping around the standard gameplay Script API to make the player the focus.  

You can see this in the the `activation` closure parameter list - the first parameter is the `IPlayerUISession`.  The `IPlayerUISession` is key to all the player services, and is the main interface through which a creator will build UI elements, access Editor services, etc.

The `deactivation` closure also has a reference to the `IPlayerUISession` object, and provides the extension a chance to clean up and shutdown before the player disconnects completely from the server.

## A Simple Extension

```ts

registerEditorExtension(
    // Extension name to register
    "My Extension",

    // Activation closure
    (uiSession) => {
      const player = uiSession.extensionContext.player;
      const playerName = player.name;
      uiSession.log.info(
        `Initializing for player [${playerName}]`
      );
      return [];
    },

    // Deactivation closure
    (uiSession) => {
      const player = uiSession.extensionContext.player;
      const playerName = player.name;
      uiSession.log.info(
        `Shutting down for player [${playerName}]`
      );
    },

    // Handy info for my extension
    { description: "My Extension Description",
      notes: "This extension is just empty and doesn't do anything yet" }
  );
```

You can see the concepts we've talked about displayed in the example above.  
1. The Extension Name (This needs to be short and unique)
2. The `activation` closure (and the `IPlayerUISession` object being passed in (called `uiSession`))
3. The `deactivation` closure (with the same argument)
4. The [optional] Extension information parameters (these fields can be used to provide handy information to the Editor and other Creators about the Extension and it's author)

If you examine the contents of the `activation` closure, you can see how the `uiSession` object is being used.  
The first usage shows how the `uiSession` object contains the player information for whom the Extension is being activated.

> Remember that this `activation` closure is executed for every player connection event, so you need to know 'which' player is the context!

The next line grabs the players name from the player object.

The line following that sends a message to the players message log window identifying the players name.

> Note the use of the `uiSession` object to access that particular players log service.  If you check the documentation for the `IPlayerUISession` object, you can get a clearer idea of all of the services that are available for that player.  
The logger service is but one of many player-centric services available.

&nbsp;

As you can see the concept of Editor Extensions is actually very simple, but it provides a level of flexibility and functionality which can be very powerful.

# UI and Tools

An Editor is nothing without user interaction, and a big part of the Editor API is providing the tools to construct User Interface elements to control and adjust your Extension.  

When you start the Editor, you will see the traditional UI elements of any editor/paint/modelling tool:
- Status Bar
- Menu Bar
- Tool Palette
- Action Bar
- Floating Property Panes
- 3D Viewport
  
All of these are accessible from the API (*`Action Bar is still in development and currently unavailable`*) and can be modified by your Extension.

Let's start simple, and add a message to the status bar.

```ts
    // Activation closure
    (uiSession) => {
      const statusItem = uiSession.createStatusBarItem(EditorStatusBarAlignment.Left, 30);
      statusItem.text = `Hello there ${uiSession.player.name}`;
      return [];
    },
```

See? Easy!

### Extension Tool UI elements

Generally an Extension will install a single tool, but there's no reason why it is limited to one.  
A tool generally consists of
- An icon in the Tool Palette
- A global hotkey to activate the tool
- A property pane with one or more UI elements (like text boxes, sliders, buttons)

In addition, a tool can also
- Add a menu bar item
- Add a status bar item
- Add property controls to the Action Bar

Let's start with adding a Tool Palette item

```ts
    const tool = uiSession.toolRail.addTool({
        displayStringLocId: 'myExtension.displayName',
        displayString: 'My Extension (CTRL + SHIFT + E)',
        icon: 'pack://textures/myExtension.png',
        tooltipLocId: 'myExtension.toolTip',
        tooltip: 'This is my extension',
    });
```

Note the use of the `uiSession` object here - we're accessing the `toolRail` object and requesting to `addTool`.  
You'll find that many of the UI parameters are `... LocId` - these hold the string labels to the UI elements, and not the actual strings.  A string label is the 'key' name of a string in the localization file - this allows you to tailor your Extension for multiple languages without adding new code.  
For now, you can either set them or just use the string `NO_ID` and the UI element will fall back to the non-`LocId` variant (you can see in the above example there's `displayStringLocId` and `displayString` -- as well as `tooltipLocId` and `tooltip`).  
The `icon` field contains a path into the Extension resource pack and the icon file within.  



```ts
    // Register a global shortcut (CTRL + SHIFT + E) to select the tool
    const toolToggleAction = uiSession.actionManager.createAction({
        actionType: ActionTypes.NoArgsAction,
        onExecute: () => {
            uiSession.toolRail.setSelectedOptionId(tool.id, true);
        },
    });

    uiSession.inputManager.registerKeyBinding(
        EditorInputContext.GlobalToolMode,
        toolToggleAction,
        KeyboardKey.KEY_E,
        InputModifier.Control | InputModifier.Shift
    );
```

This blob of code does two things -- defines an `Action` and registers a key binding to said `Action`.  
`Action`s are basically event definitions which can be bound to 'something' (a key press, a mouse button, a cursor move event, etc).  
The `Action` defines two things
- The `actionType`; i.e. the type of parameter that is passed into the `onExecute` closure
- The `onExecute` closure; a code block which defines the action to be taken when the `Action` is triggered

You can see here that the `uiSession` object is once again used to reference the players `inputManager` and a key binding is made (Control + Shift + E).  The binding specifies the `Action` to take when that key is activated.  
The `Action::onExecute` contains the code that is executed (in this case, it tells the `toolRail` to set the currently selected tool `id` to be your extension's `id`).

So now, you can activate your Extension using either CTRL+SHIFT+E or pressing the icon/button on the Tool Palette.

&nbsp;

The next common thing an Extension will want to do is open a property window (or pane) to display some UI controls or some unique state information.  

This consists of a couple of steps...
1. Create a property pane
2. Create a binding object and bind it to the pane
3. Create whatever buttons, text fields or sliders which modify the binding object
4. Show the pane

```ts
    // Create a property pane for our extension
    const extensionPane = uiSession.createPropertyPane({
        titleStringId: 'NO_ID',
        titleAltText: 'My Extension Pane',
    });
```

This creates a property pane for our Extension and gives it a name (and a localization `Id` if required).

```ts
    const paneData = {
        label: 'This is an editor extension property pane!',
        myBoolean: 0,
    };
    createPaneBindingObject(extensionPane, paneData);
```

We create a binding object (we call these `PropertyBags`) which will contain the operational runtime data which is bound into the pane.  As you operate sliders, enter text fields, etc - these values will be the ones which are bound to those UI controls, and will contain the data that is synchronized from the UI elements into the runtime object.

```ts
    // Let's bind an ON/OFF boolean UI element
    extensionPane.addBool(paneData, 'myBoolean', {
        titleStringId: 'NO_ID',
        titleAltText: 'True or False?',
    });
```

In this example, we create a boolean ON/OFF UI element with the title "True or False?" and bind it to the property `myBoolean` in the `paneData`

```ts
    // Now we can add a button!  Let's define an action for the button to execute
    const buttonAction = uiSession.actionManager.createAction({
        actionType: ActionTypes.NoArgsAction,
        onExecute: () => {
            uiSession.log.info("I've been pressed!!!");
        },
    });

    // Now create a button and bind the press action 
    extensionPane.addButtonAndBindAction(buttonAction, {
        titleStringId: 'NO_ID',
        titleAltText: 'Click me!',
    });
```

As we saw previously, we can set up an `Action` which will get executed on some event -- in this case, the event is a button press.  We create a button element, give it a title ("Click me!") and bind the action.  

After all that, all we have to do is show the panel...

```ts
    extensionPane.show();
```

## Working Examples

You can install either the `minimal` or `full` Editor Starter Kit sample to see how to build status bar items, menu bar entries, add icons to the tool rail, etc.  

Feel free to experiment

&nbsp;

# Editing Concepts

Of course, the other big part of an Editor tool is the `editing` part - The `IPlayerUISession` object comes into play once again.  This object provides a number of player-centric services which can be used to perform editing operations on the world.  

