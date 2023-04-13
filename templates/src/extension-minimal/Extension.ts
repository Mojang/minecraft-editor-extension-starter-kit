import {
    ActionTypes,
    createPaneBindingObject,
    EditorStatusBarAlignment,
    IDisposable,
    IPlayerUISession,
    IPropertyPane,
    registerEditorExtension,
} from '@minecraft/server-editor';

declare var __EXTENSION_NAME__: string; // defined in webpack.config (read from .env)

/**
 * Per player storage can be attached to the IPlayerUISession type in a type safe manner for anything
 * you'd like to store and access in a player contextual manner. This makes the data safe for multiplayer
 * usage. This type can be passed to the registerEditorExtension function as a generic parameter to make
 * all access type safe.
 */
type PerPlayerStorage = {
    NUM_TIMES_PLAYER_CLICKED: number;
};

function showConsoleMessage() {
    console.warn('Use console warn to print to console');
}

function incrementClickValue(storage: PerPlayerStorage) {
    storage.NUM_TIMES_PLAYER_CLICKED++;
}

/**
 * Provides a sample extension registration function
 * @public
 */
export function registerExtension() {
    const extensionObject = registerEditorExtension<PerPlayerStorage>(
        __EXTENSION_NAME__,

        // Provide a function closure which is executed when each player connects to the server
        // The uiSession object holds the context for the extension and the player
        uiSession => {
            const player = uiSession.extensionContext.player;
            const playerName = player.name;
            console.log(
                `Initializing extension [${uiSession.extensionContext.extensionName}] for player [${playerName}]`
            );

            // Initialize the player specific, custom extension storage structure with whatever
            // the extension needs to store, and assign it to the `uiSession.scratchStorage` variable.
            // Using this in combination with JavaScript closure captures, you can access this player/extension
            // storage area in whatever events you need it
            const storage: PerPlayerStorage = {
                NUM_TIMES_PLAYER_CLICKED: 0,
            };
            uiSession.scratchStorage = storage;

            // Create a basic property pane with a button.  Property panes are the basic panels on to which you
            // can attach buttons, sliders and various other UI elements.
            // When you create a property pane, you bind it with an object which contains the values which represent
            // the contents of the UI elements you bind to the pane.  The binding object is a 'property bag' - a simple
            // key/value pair collection which the UI elements modify when they are actioned.
            // E.g. if you were to create a slider, the slider would be bound to a property 'mySlider' for example, and
            // when you adjust the slider, you can inspect the binding object property 'mySlider' for the current value.
            const extensionPane = uiSession.createPropertyPane({
                titleStringId: 'Extension Pane',
                titleAltText: 'Extension Pane',
            });
            const paneData = {
                label: 'This is an editor extension property pane!',
                mySliderValue: 0,
            };
            createPaneBindingObject(extensionPane, paneData);

            // Creating UI elements like buttons and sliders require a couple of simple steps.
            // - Create an action (a function declaration of what you want to happen when the element is actioned)
            // - Create the UI element and bind it to the action
            // (You can define a single action and bind it to many UI elements if you wish)

            const buttonAction = uiSession.actionManager.createAction({
                actionType: ActionTypes.NoArgsAction,
                onExecute: () => {
                    showConsoleMessage();
                    incrementClickValue(storage);
                },
            });

            // Now create a button and bind the action you want to execute when it's pressed
            extensionPane.addButtonAndBindAction(buttonAction, {
                titleStringId: 'Click me!',
                titleAltText: 'Click me!',
                visible: true,
            });

            // Create a menu entry and add it to the main menu along the top
            const extensionMenu = uiSession.createMenu({
                name: 'My Extension',
            });

            // Adds a child menu item to show the property pane
            // Note - we're creating an action too, which can be executed when the menu
            // item is selected
            extensionMenu.addItem(
                {
                    name: 'Show My Property Pane',
                },
                uiSession.actionManager.createAction({
                    actionType: ActionTypes.NoArgsAction,
                    onExecute: () => {
                        extensionPane.show();
                        incrementClickValue(storage);
                    },
                })
            );

            // Normally we return a collection of IDisposable objects that the extension system will clean
            // up and dispose of on shutdown.  We don't have any in this example, so let's just return
            // and empty collection
            return [];
        },

        // Provide a function which is executed when the player disconnects from the server
        // This is where the extension would normally clean up any resources it created/loaded during activation
        (uiSession: IPlayerUISession<PerPlayerStorage>) => {
            // Do any explicit cleanup when a player is leaving and the extension instance is shutting down
            const player = uiSession.extensionContext.player;
            const playerName = player.name;

            console.log(
                `Shutting down extension [${uiSession.extensionContext.extensionName}] for player [${playerName}]`
            );
        },
        {
            description: 'Minimal Sample Extension',
            notes: 'Insert any notes, ownership info, etc here.  http://alturl.com/p749b',
        }
    );
}
