# Minecraft Bedrock Editor
Getting started guide for building Editor Extensions. 

### Contents
- [Minecraft Bedrock Editor](#minecraft-bedrock-editor)
    - [Contents](#contents)
  - [What is the Editor?](#what-is-the-editor)
  - [What is an Editor Extension?](#what-is-an-editor-extension)
  - [Anatomy of an Extension](#anatomy-of-an-extension)
    - [Activation of an Extension](#activation-of-an-extension)
    - [Deactivation of an Extension](#deactivation-of-an-extension)
    - [Example of a Simple Extension](#example-of-a-simple-extension)
  - [UI and Tools](#ui-and-tools)
    - [Element Overview](#element-overview)
    - [Property Pane](#property-pane)
  - [Editing Concepts](#editing-concepts)
    - [Logging](#logging)
    - [Cursor](#cursor)
    - [Selection](#selection)
    - [Clipboard](#clipboard)
    - [Transactions](#transactions)
  - [Available UI Components](#available-ui-components)
    - [Block Picker](#block-picker)
    - [Boolean](#boolean)
    - [Buttons](#buttons)
    - [Divider](#divider)
    - [Dropdown](#dropdown)
    - [Number](#number)
  - [Strings](#strings)
    - [Vector 3 (XYZ)](#vector-3-xyz)
  - [I want to see samples!](#i-want-to-see-samples)
  - [I have feedback](#i-have-feedback)

---
  

## What is the Editor?

The Minecraft Bedrock Editor is a framework that is built into certain platform versions of Minecraft Bedrock Edition and is designed to allow creators to use more complex tools to build, edit and test worlds than simple gameplay allows.  

The Editor framework is built in such a way as to allow creators to build their own tools to accomplish such complex tasks.  

The Minecraft Bedrock Editor leverages the game's built-in JavaScript Scripting API in conjunction with a number of native tools built directly into the game itself, to expose a rich environment in which creators can build tools which empower and enhance their editing experience.  

We call these **Editor Extensions**.

&nbsp;

## What is an Editor Extension?

An Extension is a collective name for a set of resource and behavior packs which contain script and binary assets which are loaded when the Editor starts up.

The Extensions are written in TypeScript and are compiled into JavaScript ready for loading into the game.  The compiler tools and various libraries required to do this are supplied as part of the [Minecraft Bedrock Editor Extension Starter Kit](https://github.com/Mojang/minecraft-editor-extension-starter-kit).

The behavior pack will contain the compiled scripts which execute on the server, and the resource pack will contain the binary assets required by the Extension (icons, text files, etc).

For a full set of install instructions and pre-requisite software required to start, please refer to the [Minecraft Bedrock Editor Extension Starter Kit README file](https://github.com/Mojang/minecraft-editor-extension-starter-kit/blob/main/README.md)  

&nbsp;

## Anatomy of an Extension

It's important to understand how Extensions differ from gameplay scripts.  

When Minecraft server starts up, it loads all of the scripts from all of the behavior packs in the world.  Each script is executed in turn.  This happens only once when the server loads a world.  

> Remember that there may not be a player connected yet; in the case of a dedicated server, the world may be loaded without any players attached - you cannot assume that any players exist at this point.  

Editor takes this initialization opportunity to load and execute all of the Extension scripts. However, because this is a 'global' phase (and there may not be any player connected), the extensions will generally just call `registerEditorExtension`.  (Registering themselves with the system, and informing the Editor that they are Editor specific extensions).  

### Activation of an Extension
There are two main bodies of code associated with an Extension - the `activation` and `deactivation` closures.  

When a player initially connects to the server, the `activation` closure is executed. And, when that player leaves the server, the `deactivation` closure is executed.  

This will happen for all players who join or leave the Editor server session (irrespective of whether the server is running locally, remotely or embedded into the Minecraft game). Minecraft ALWAYS runs in two parts: a server and a client - even when you're just running the Minecraft game. The server is the first thing to start up (even before the player is connected), and it loads the world, runs a bunch of code - and then the client (the graphical part) starts up and connects to the server. Even when you're running a single application on your PC, this is the process that takes place. 

Normal gameplay scripts don't have this concept of activation/deactivation - it's generally up to you to register for "player join" events, but Editor provides a lot of contextual data and interfaces by leveraging these code closures.  

One of the things to remember about Editor which differs slightly from gameplay: The Editor is almost entirely player oriented, and everything you do in the Editor is specific to a player's context. Each player has a collection of services that are used to manage that player's editing environment, undo/redo state, clipboard, etc.), so the Editor provides a lot more wrapping around the standard gameplay Script API to make the player the focus of operations.  

You can see this in the the `activation` closure parameter list - the first parameter is the `IPlayerUISession`.  The `IPlayerUISession` is key to all the player services, and is the main interface through which a creator will build UI elements, access Editor services, etc.

### Deactivation of an Extension
The `deactivation` closure also has a reference to the `IPlayerUISession` object, and provides the extension a chance to clean up and shutdown before the player disconnects completely from the server.

&nbsp;

### Example of a Simple Extension

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

1. The Extension name (this needs to be short and unique)
2. The `activation` closure (and the `IPlayerUISession` object being passed in (called `uiSession`))
3. The `deactivation` closure (with the same argument)
4. The *optional* Extension information parameters (these fields can be used to provide handy information to the Editor and other Creators about the Extension and it's author)

If you examine the contents of the `activation` closure, you can see how the `uiSession` object is being used.  
The first usage shows how the `uiSession` object contains the player information for whom the Extension is being activated.

> Remember that this `activation` closure is executed for every player connection event, so the `uiSession` object contains all the information you need to identify the player who is the context of the connection event

The next line grabs the players name from the player object (via the session object).

The line following that sends a message to the players message log window identifying the players name.

> Note the use of the `uiSession` object to access that particular players log service.  If you check the documentation for the `IPlayerUISession` object, you can get a clearer idea of all of the services that are available for that player.  
The logger service is but one of many player-centric services available.

As you can see the concept of Editor Extensions is actually very simple, but it provides a level of flexibility and functionality which can be very powerful.

If you're unfamiliar with the concept of closures and closure capture in TypeScript - now would be a good time to go do some reading; Editor relies on closure capture almost entirely.  

&nbsp;


## UI and Tools

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

&nbsp;

### Element Overview

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
        displayStringId: 'myExtension.displayName',
        displayAltText: 'My Extension (CTRL + SHIFT + E)',
        icon: 'pack://textures/myExtension.png',
        tooltipStringId: 'myExtension.toolTip',
        tooltipAltText: 'This is my extension',
    });
```

- Note the use of the `uiSession` object here - we're accessing the `toolRail` object and requesting that we `addTool` to the `toolRail`.  
- You'll find that many of the UI parameters are `... StringId` - these hold the string labels to the UI elements, and not the actual strings.  A string label is the 'key' name of a string in the localization file - this allows you to tailor your Extension for multiple languages without adding new code.  
> If you're not familiar with the Minecraft method of localization, then this would be a good opportunity to investigate other articles.  
- For now, you can either set them or just use the string `NO_ID` and the UI element will fall back to the non-`StringId` variant (you can see in the above example there's `displayStringId` and `displayAltText` -- as well as `tooltipStringId` and `tooltipAltText`).  
> The `...AltText` field is just plain text, and is used as a fallback if the `...StringId` cannot be located (or entered as `NO_ID`).  
- The `icon` field contains a path into the Extension resource pack and the icon file within.  

Next, let's register some key-bindings...

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

This blob of code does two things -- defines an `Action` and binds the key event to said `Action`. `Action`'s are basically event definitions which can be bound to 'something' (a key press, a mouse button, a cursor move event, etc).  

The `Action` defines two things
1. The `actionType`; i.e. the type of parameter that is passed into the `onExecute` closure
2. 2. The `onExecute` closure; a code block which defines the action to be taken when the `Action` is triggered

You can see in this example that the `uiSession` object is once again used to reference the players `inputManager` and a key binding is made *(Control + Shift + E)*. It helps to read this as `Perform this action when this event is triggered`  

The `Action::onExecute` contains the code that is executed (in this case, it tells the `toolRail` to set the currently selected tool `id` to be your extension's `id`).

So now, you can activate your Extension using either *(CTRL+SHIFT+E)* or pressing the icon/button on the Tool Palette.


### Property Pane

The next common thing an Extension will want to do is open a property pane to display some UI controls or some unique state information.  

This consists of several steps: 
1. Create a property pane
2. Create a data source which binds the UI elements on the property pane with the `data` that the UI elements are meant to represent
3. Create whatever buttons, text fields or sliders which map to the data source
4. Show the property pane

Create a property pane for our Extension and give it a title: 

```ts
    // Create a property pane for our extension
    const extensionPane = uiSession.createPropertyPane({
        titleStringId: 'NO_ID',
        titleAltText: 'My Extension Pane',
    });
```

```ts
    const paneData = {
        label: 'This is an editor extension property pane!',
        myBoolean: 0,
    };
    const boundData = bindDataSource(extensionPane, paneData);
```

Create a data source object (we sometimes call these `PropertyBags`), which will contain the operational runtime data which is bound into the pane.  As you operate sliders, enter text fields, etc - these values will be the ones which are bound to those UI controls, and will contain the data that is synchronized from the UI elements into the runtime object.

```ts
    // Let's bind an ON/OFF boolean UI element
    extensionPane.addBool(boundData, 'myBoolean', {
        titleStringId: 'NO_ID',
        titleAltText: 'True or False?',
    });
```

In this example, we create a boolean ON/OFF UI element with the title "True or False?" and bind it to the property `myBoolean` in the bound proxy (`boundData`) of `paneData`.  When the user toggles the UI switch on screen, the value `myBoolean` in `boundData` will reflect the current state (`true|false`).

```ts
    // Now we can add a button!  Let's define an action for the button to execute
    const buttonAction = uiSession.actionManager.createAction({
        actionType: ActionTypes.NoArgsAction,
        onExecute: () => {
            const boolString = boundData.myBoolean ? "true" : "false";
            uiSession.log.info(`I've been pressed and the bool flag is ${boolString}`);
        },
    });

    // Now create a button and bind the press action 
    extensionPane.addButton(buttonAction, {
        titleStringId: 'NO_ID',
        titleAltText: 'Click me!',
    });
```

As we saw previously, we can set up an `Action` which will get executed on some event -- in this case, the event is a button press.  We create a button element, give it a title ("Click me!") and bind the action.  

After all that, all we have to do is show the panel...

```ts
    extensionPane.show();
```

**NOTE** : When you create a data source binding (`const boundData = bindDataSource(extensionPane, paneData)` - the `boundData` object is a proxy copy of the data that was passed in.  The proxy is attached to the property pane along with the original data object, and the proxy ensures that the data is synchronized between the client and server.
So, when you make a change to `boundData.myBoolean` on the server - the value of `myBoolean` is then reflected on the client (and presumably the tick box you created).  Similarly, if you change the value of `myBoolean` on the client (by pressing on the tick box), the value is synchronized back to the server and can be read by the server script code.

&nbsp;

## Editing Concepts

Of course, the other big part of an Editor tool is the `editing` part - The `IPlayerUISession` object comes into play once again.  This object provides a number of player-centric services which can be used to perform editing operations on the world.  

&nbsp;


### Logging

We've already touched on the logging system with the previous examples, and there's no much to add.  Logging is an incredibly useful debugging tool during development and can be used to show the execution progress of your code, and allows you to dump useful information that might help you track down problems.  

However, the logging system is also intended to be used to allow extensions to communicate with the user.  

With this in mind, the logging system has a number of dedicated 'channels' which can be filtered by the user.
- *Info* -- The *info* channel is intended to be used to inform the user of useful information (e.g. you might want to report the completion status of some operation... "you selected 123 blocks")
- *Warning* -- The *warning* channel is intended to be used to inform the user of potential (non-fatal) problems (e.g. "You cannot perform this operation without an active selection")
- *Error* -- The *error* channel is intended for fatal errors (e.g., "Unable to allocate memory for this operation")
- *Debug* -- The *debug* channel is intended for extension developers to dump all sorts of useful debugging information that a user generally wouldn't be interested in.  This channel is not visible by default, but can be enabled by the user if they wish to see it.

```ts
    uiSession.log.info('This is an info message');
    uiSession.log.warning('This is a warning message');
    uiSession.log.error('This is an error message');
    uiSession.log.debug('This is a debug message');
```

You can leverage existing JavaScript tools like `JSON.stringify` to output handy information to the log window during debugging sessions: 

```ts
type MyData = {
    name: string;
    age: number;
    address: string;
};

uiSession.log.debug(`My data is ${JSON.stringify(myData)}`);
```

&nbsp;

### Cursor

The editor maintains the concept of a 3D-block cursor. The block cursor exists in the world, and is accessible through the `Cursor` object on the `ExtensionContext`. It represents a single block location in the world and exists as a 'virtual' controllable object - either indirectly controlled the mouse or directly controlled by the user using the keyboard.  

The cursor control mode can be set by the extension depending on how the extension wants to use it.  

The other function of the cursor is that it can either represent the block you're pointing at with the mouse (`Block Mode`) or the face of the block you're pointing at (`Adjacent Mode`).

When using direct keyboard control, the cursor can be moved around using the keyboard (via the `moveBy` function on the cursor object) - but moving the mouse in any way will restore the cursor position back to the world/mouse intersection point.

You can query the cursor at any time to find its current world location: 

```ts
    const cursor = uiSession.extensionContext.cursor;
    const cursorPos = cursor.position;
    uiSession.log.info(`Cursor is at ${cursorPos.x}, ${cursorPos.y}, ${cursorPos.z}`);
```

While there's nothing to stop you from performing your own screen/world raycast operations, the cursor provides a handy construct which provides this information in a standard way across all extensions.

&nbsp;

### Selection

Selection is a key component of the Editor system and it's important to understand how it works. A selection volume is a representation of a volume of space in the world; it does not represent the contents of that volume, only a description of the volume (e.g., you can make a selection volume in mid air or inside solid blocks - the selection volume is the same in both cases).  

- The selection volumes are made up of a collection of areas, each of which is a rectangular volume of (min -> max), and consist of stacks of simple volumes with an associated action (add or subract). 
- The selection volume is not limited to a single contiguous volume - you can add multiple areas to the selection volume to represent a complex shape. For example, you can make a selection volume which is a 3x3x3 cube, or a 3x3x3 cube with a 1x1x1 cube removed from the center.  
- Void spaces can be added to a selection to remove space.  It's an odd concept, but it's useful for building complex shapes simply. For example, if you were to build a large hollow cube using only additive volumes, you'd need to add 6 different volumes - each one representing a face of the cube. Using void spaces, you can define the cube as a large single volume which represents the cube, and then add a single void volume inside to remove the space.

The Editor maintains a single selection object at all times. This is the 'primary selection' and the one which the UI will use to perform operations on (copy, paste, select, etc.) and this primary selection cannot be destroyed (only emptied), so it will always be available to the user.  

```ts
    const selection = uiSession.extensionContext.selectionManager.selection;  // Get the primary selection
    selection.clear(); // clear it out (remove all areas)

    selection.pushVolume({
        action: CompoundBlockVolumeAction.Add,
        volume: {
            from: {x:0, y:0, z:0},
            to: {x:10, y:10, z:10},
        },
    });
```

This doesn't mean that you can't create additional selection objects. Often, it's preferable to create a temporary selection object to perform some operation on, and then destroy it when you're done.  

```ts
    const selection = uiSession.extensionContext.selectionManager.create();  // Create a new selection
    
    // Do lots of stuff with the selection object, push some volumes, etc

    uiSession.extensionContext.selection.set( selection );  // Copy the temporary selection into the primary selection
```

**Note**: This is a common pattern in the Editor - the Editor maintains a single 'primary' object of many types (selection, clipboard, etc) - but you can create temporary objects of the same type to perform operations on, and then copy the temporary object into the primary object when you're done. It's often preferable to do this because temporary objects are generally server-side only and do not incur any network synchronization with the client.  

Because the Selection object is an ordered 'stack' of operations, it uses a method of `push`, `pop` and `peek` to manipulate the stack.  `push` adds a new volume to the top of the stack, `pop` removes the top volume from the stack and `peek` returns the top volume without removing it from the stack.  

In order to iterate across a selection volume, you request a `BlockLocationIterator` - this implements a typical TypeScript iterator which allows the extension to iterate across all of the additive (non-void-space) block locations in the selection volume.  

```ts
    const selection = uiSession.extensionContext.selectionManager.selection;
    const iterator = selection.getBlockLocationIterator();
    for (const blockLocation of iterator) {
        // Do something with the block location
    }
```

If you were to use the `BlockLocationIterator` on a hollow cube selection volume, you would only get the block locations for the outer shell of the cube.  (Any block locations which are encompassed by a void space volume are skipped).  The `BlockLocationIterator` basically allows an extension to remain shape-agnostic.

If you wanted ALL of the blocks in the selection volume, you would instead fetch the `BoundingBox` of the selection (but be aware, the `BoundingBox` may be much larger than you think - it's the smallest bounding box which encompasses all of the volumes within the selection volume).  

```ts
    const selection = uiSession.extensionContext.selectionManager.selection;
    const boundingBox = selection.getBoundingBox();
    const iterator = boundingBox.getBlockLocationIterator();
    for (const blockLocation of iterator) {
        // Do something with the block location
    }
```

### Clipboard

While the Selection system allows you to define areas of space (but not content), the Clipboard system allows you to copy/paste/manipulate the actual content of those areas.  

Much like the "Primary Selection", there also always exists a "Primary Clipboard" - this is the clipboard which the UI will use to perform copy/paste operations.  

The primary clipboard cannot be destroyed (only emptied) - so it will always be available to the user.  

```ts
// Copy an area of blocks into the clipboard, as defined by the current primary selection
// Get the primary clipboard
const clipboardItem = uiSession.extensionContext.clipboard;
clipboardItem.readFromSelection(
    uiSession.extensionContext.selectionManager.selection);

// Now, write the area copied into the clipboard to a new world location
const destination: Vector3 = {x: 10, y: 10, z: 10};
clipboardItem.writeToWorld(destination);
```

As with the Selection system, you can create temporary clipboard objects on which to perform operations; you don't need to always use the primary clipboard.  

Using the `ClipboardWriteOptions` settings structure, you can also manipulate how the clipboard data is written back to the world (i.e. mirror, offsets, rotations, etc).  

One of the options is the concept of an `anchor` - this is a unit vector (`-1.0 <= X/Y/Z <=1`) and is used to modify the `local origin` of the clipboard item.  

The `local origin` is the point within the clipboard item which will be placed at the `destination` location.  By default, the `local origin` is the center of the clipboard item (`{0,0,0}`), but by specifying an `anchor`, you can move the `local origin` to any point within the clipboard item (e.g., (`{0,-1,0}`) represents the bottom-center of the clipboard item).  This is a useful concept for copy/paste operations where you want to align a 'side' of the clipboard item with the destination point (imagine you copied a whole house into the clipboard - when you want to paste it into the world, you want to place it on the ground -- so you would specify an `anchor` of `{0,-1,0}` to align the bottom of the house with the ground -- now, your destination point can be any point on the world surface, and the house will 'sit' on it).  


### Transactions

Transactions are the basic mechanism for UNDO and REDO operations.  By creating a Transaction, an extension can basically record the world contents BEFORE any changes are made, and then also record the changes AFTER they're made.  These changes would be packaged into a transaction and stored in the 'transaction stack'.  
When a creator performs an UNDO, the transaction stack is rolled back by a single transaction and the world state stored within that transaction is applied back into the world (restoring the world to whatever it was before the change was made).  
Performing a REDO operation just does the reverse.  

```ts
// Fill an area of the map specified by a selection volume.  Track all the block changes in a transaction
// then immediately undo it all
 
    private performFillOperation = async (context: ExtensionContext, fillType: BlockType) => {
        const player: Player = context.player;
        const dimension: Dimension = player.dimension;
        if (context.selectionManager.selection.isEmpty) {
            context.log.error('No selection available to fill');
            return;
        }
 
        // Open a transaction record for the fill operations
        context.transactionManager.openTransaction('Select-Fill');
 
        // Create a tracking record for any block changes that occur within a bounding rectangle
        const bounds = context.selectionManager.selection.boundingBox;
        context.transactionManager.trackBlockChangeArea(bounds.min, bounds.max);
 
 
        // execute a large block operation which manually slices the iteration of block positions within
        // a selection object into units of about 8000 invocations of the closure, to avoid the crummy
        // script engine timeout counter.
        // We execute this as a co-routine using the await async functionality
        //
        await executeLargeOperation(context.selectionManager.selection, (blockLocation: Vector3) => {
            const block = dimension.getBlock(blockLocation);
            if (block) {
                block.isWaterlogged = false;
                block.setType(fillType);
            }
        })
            .catch(e => {
                // Something catastrophic went wrong – just abandon the tracking record
                context.log.error(e);
                context.transactionManager.discardOpenTransaction();
            })
            .then(() => {
                // Commit the open transaction (including any block changes that were found during the
                // tracking operation
                context.transactionManager.commitOpenTransaction();
            });
    };
 
 
const vol1 = new BlockVolume({x:0, y:0, z:0}, {x:5, y:5, z:5});
const vol2 = new BlockVolume({x:10, y:10, z:10}, {x:15, y:15, z:15});
 
const selection = uiSession.extensionContext.selectionManager.createSelection();
selection.pushVolume(SelectionBlockVolumeAction.add, vol1);
selection.pushVolume(SelectionBlockVolumeAction.add, vol2);
 
await performFillOperation(ctx, MinecraftBlockTypes.stone);
 
// Then immediately undo it all
 
uiSession.extensionContext.transactionManager.undo();

```



## Available UI Components

There are a number of UI components available to you as an Editor Extension creator.

### Block Picker
(`addBlockPicker`) The block picker is a UI element that provides an on-screen component to allow the user to search through all of the currently available block types using a text-search mechanism.  You can see an example of it in the `Selection` tool; there's a block picker which allows you to choose a fill block type.  
```ts
// Add a block picker to the UI pane, and use it to perform a fill operation

// Create a data source to bind to the property pane.  The data source 
// will contain a property of type BlockType which is bound to the block picker
type BlockPickerDataSource = {
    blockType: BlockType;
};

const dataSource: BlockPickerDataSource = {
    blockType: MinecraftBlockTypes.stone,
};
const boundData = bindDataSource(propertyPane, dataSource);

// Add the block picker to the property pane, and tell it which property in
// the data source it should be bound to
propertyPane.addBlockPicker(boundData, 'blockType', {
    titleStringId: 'NO_ID',
    titleAltText: 'Block Type',
});

// Create an action which will perform the fill operation - note that the fill action
// is passed the block type from the data source.
// Whatever the user has selected in the block picker will be passed to the action
const fillAction = uiSession.actionManager.createAction({
    actionType: ActionTypes.NoArgsAction,
    onExecute: () => {
        this.performFillOperation(uiSession.extensionContext, dataSource.block).catch(
            (e: Error) => uiSession.log.error(e.message)
        );
    },
});

// bind action to a button press... etc
```

### Boolean
(`addBool`) Show a tick-box or toggle on screen which allows the user to switch some functionality on or off
```ts
// Create a data source to bind to the property pane.  The data source will
// contain a property of type boolean which is bound to the bool component
type BoolDataSource = {
    boolValue: boolean;
};

const dataSource: BoolDataSource = {
    boolValue: false,
};
const boundData = bindDataSource(propertyPane, dataSource);

// Add a toggle switch to the UI pane, and tell it which property in the data source it should
// record it's state
propertyPane.addBool(boundData, 'boolValue', {
    titleStringId: 'NO_ID',
    titleAltText: 'On or Off?',
});

// Create an action which will perform some operation based on the bool value
const action = uiSession.actionManager.createAction({
    actionType: ActionTypes.NoArgsAction,
    onExecute: () => {
        if( boundData.boolValue ) {
            uiSession.log.info('The bool is true');
        }else {
            uiSession.log.info('The bool is false');
        }
    },
});

// bind action to a button press... etc
```

### Buttons
(`addButton`) Show a button on screen which executes some *action* when pressed

```ts
// Create an action which will do something when the button is pressed
const action = uiSession.actionManager.createAction({
    actionType: ActionTypes.NoArgsAction,
    onExecute: () => {
        uiSession.log.info('You just pressed a button!!!');
    },
});

// Add a button to the property pane, and associate it with an action
propertyPane.addButton(action, {
    titleStringId: 'NO_ID',
    titleAltText: 'Press Me!',
});
```

### Divider
(`addDivider`) A non-interactive screen component which simply creates a horizontal divider across the width of the pane, to help visually arrange UI components into groups.  This is just a graphical element, and has no associated data or actions.

```ts
// Add a divider to the property pane
propertyPane.addDivider();
```

### Dropdown
(`addDropdown`) A dropdown (sometimes called a combo-box) which can be populated with any number of items and tracks which one of those items is currently selected.
This one is a little more complicated because it must be populated with a list of items to display, so the set up stage is a little more involved

```ts
// Create a datasource which tracks the currently selected index of the item in the list
type DropdownDataSource = {
    selectedValueIndex: number;
};

const dataSource: DropdownDataSource = {
    selectedValueIndex: 0,
};
const boundData = bindDataSource(propertyPane, dataSource);

// Create a list of items to display in the dropdown - it's up to you what these might be; it could be
// a list of strings or a list of objects or world locations, etc - whatever you want to display in the
// dropdown is up to you -- when you convert them to dropdownItems is when you need to convert it to
// something human readable.
const dropdownItemNames[] = ['First', 'Second', 'Third'];

// Create a list of IDropdownItems with which to populate the dropdown UI control - these are what will
// appear on screen
const dropdownItems = dropdownItemNames.map((item, index): IDropdownItem => {
    const item: IDropdownItem = {
        displayAltText: `${index + 1}: ${item}`,
        displayStringId: 'NO_ID',
        value: index,
    };
    return item;
});

// Now add the dropdown to the property pane, and tell it which property in the data source it should
// store the currently selected index.
// Note the `onChange` event - this is executed when the user changes the selected item in the dropdown
// to something else
propertyPane.addDropdown(boundData, 'selectedValueIndex', {
    titleStringId: 'NO_ID',
    titleAltText: 'Stored Location',
    dropdownItems: dropdownItems,
    onChange: (_obj: object, _property: string, _oldValue: object, _newValue: object) => {
        const oldIndex = _oldValue as number;
        const newIndex = _newValue as number;
        const oldItem = dropdownItemNames[oldIndex];
        const newItem = dropdownItemNames[newIndex];
        uiSession.log.info(`You changed the dropdown from ${oldItem} to ${newItem}`);
    },
});

```

### Number
(`addNumber`) A text input box which is specialized to accept only numbers.  By specifying valid ranges (*min* and *max*) the UI control can validate the input.  You can also set `showSlider` and the UI control will also display a slider bar.

```ts
// Create a data source which contains the value of the number input UI control
type NumberDataSource = {
    numberValue: number;
};
const dataSource: NumberDataSource = {
    numberValue: 0,
};
const boundData = bindDataSource(propertyPane, dataSource);

// Create a number input UI control, and tell it which property in the data source it should
// be bound to.
// Note that the min/max fields are optional, but provide some basic validation of the input
// Also note that this number control will display a slider bar
propertyPane.addNumber(boundData, 'numberValue', {
    titleStringId: 'NO_ID',
    titleAltText: 'My Number Value',
    min: 0,
    max: 100,
    showSlider: true,
});
```

## Strings
(`addString`) A text input box which allows the user to type in a string
```ts
// Create a data source which contains the value of the string input UI control
type StringDataSource = {
    stringValue: string;
};
const dataSource: StringDataSource = {
    stringValue: 'Initial String Value',
};
const boundData = bindDataSource(propertyPane, dataSource);

// Create a string input UI control, and tell it which property in the data source it should
// store the string value in
propertyPane.addString(boundData, 'stringValue', {
    titleStringId: 'NO_ID',
    titleAltText: 'My String Value',
});

```

### Vector 3 (XYZ)
(`addVector3`) A specialization of the number input system, but displays 3 number components (*X*, *Y* and *Z*) of a `Vector3` - useful for input of 3D location values

```ts
// Create a data source which contains the value of the vector3 input UI control
type Vector3DataSource = {
    vector3Value: Vector3;
};
const dataSource: Vector3DataSource = {
    vector3Value: { x: 100, y: 200, z: 300 },
};
const boundData = bindDataSource(propertyPane, dataSource);

// Add a vector3 UI control to the property pane, and tell it which property in the data source
// it should store the vector3 value in.
// Note the use of the optional range validators for each component of the vector3 - 
// allowing the control to do some basic validation of the input
propertyPane.addVector3(boundData, 'vector3Value', {
    titleStringId: 'NO_ID',
    titleAltText: 'My Vector3 Value',
    minX: -1000, maxX: 1000,
    minY: -64, maxY: 256,
    minZ: -1000, maxZ: 1000,
});

```

## I want to see samples!

Luckily, we have you covered! 
- **Dedicated Editor Extensions samples repo**: There's an ever expanding library of sample extensions over at [Minecraft Bedrock Editor Extension Samples Repository](https://github.com/Mojang/minecraft-editor-extension-samples) over on GitHub. You can peruse the source code to see how it's done, and even download a whole collection of them to test live in the editor.  
- **Samples in the Editor Extension Starter Kit**: If you're looking to experiment, all of the samples are available as part of the [Minecraft Bedrock Editor Extension Starter Kit](https://github.com/Mojang/minecraft-editor-extension-starter-kit). Just choose any one of them as a sample starter project and you're set! You can install either the `minimal` or `full` Editor Starter Kit sample to see how to build status bar items, menu bar entries, add icons to the tool rail, etc. Feel free to use the examples as a starting point for your own creation! 

## I have feedback
Check out the [Minecraft Bedrock Editor GitHub Page](https://github.com/Mojang/minecraft-editor) for more information about the Editor, join in any discussions, and bring issues and feature requests to the team's attention. 
