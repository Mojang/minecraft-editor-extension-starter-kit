import {
    ActionTypes,
    createPaneBindingObject,
    EditorStatusBarAlignment,
    IDisposable,
    IPlayerUISession,
    IPropertyPane,
    registerEditorExtension
} from '@minecraft/server-editor';

declare var __EXTENSION_NAME__: string; // defined in webpack.config (read from .env)

function showMyPropertyPane(pane: IPropertyPane) {
    pane.show();
}

function showConsoleMessage() {
    console.warn('Use console warn to print to console');
}

/**
 * Global state can be used to share data across all players. This should be purely data as it is
 * not managed by the multiplayer system. For example, here we can use to track how often editor UI
 * was clicked across all players and rendered in the UI during shutdown.
 */
let MENU_CLICKED_TIMES_ALL_PLAYERS = 0;

/**
 * Per player storage can be attached to the IPlayerUISession type in a type safe manner for anything
 * you'd like to store and access in a player contextual manner. This makes the data safe for multiplayer
 * usage. This type can be passed to the registerEditorExtension function as a generic parameter to make
 * all access type safe.
 */
type PerPlayerStorage = {
    NUM_TIMES_PLAYER_CLICKED: number;
}

/**
 * Provides a sample extension registration function
 * @public
 */
export function registerExtension() {
    const extensionObject = registerEditorExtension<PerPlayerStorage>(
        __EXTENSION_NAME__,
        uiSession => {
            const player = uiSession.extensionContext.player;
            const playerName = player.name;
            console.log('Initializing extension [' + __EXTENSION_NAME__ + '] for player [' + playerName + ']' );

            // Example usage of initializing scratch storage that is associated with this specific player's UI
            const storage: PerPlayerStorage  = {
                NUM_TIMES_PLAYER_CLICKED: 0
            };
            uiSession.scratchStorage = storage;

            // Creates an example of adding a menu item to the UI
            const extensionMenu = uiSession.createMenu({
                name: 'Extension Menu'
            });
            
            // Creates an extension pane with data bound to the pane
            const extensionPane = uiSession.createPropertyPane({titleStringId: 'Extension Pane', titleAltText: 'Extension Pane'});
            const paneData = {
                label: 'This is an editor extension property pane!'
            };
            createPaneBindingObject(extensionPane, paneData);
            extensionPane.addButtonAndBindAction(
                uiSession.actionManager.createAction({actionType:ActionTypes.NoArgsAction, onExecute: () => { showConsoleMessage() }}),
                {titleStringId: 'Click me!', titleAltText: 'Click me!', visible: true});

            // Adds a menu item to show the property pane using actions
            extensionMenu.addItem({
                name: 'Show My Property Pane'
            },
            uiSession.actionManager.createAction({
                actionType: ActionTypes.NoArgsAction,
                onExecute: () => {
                    showMyPropertyPane(extensionPane);
                    MENU_CLICKED_TIMES_ALL_PLAYERS++;
                    storage.NUM_TIMES_PLAYER_CLICKED++;
                }
            }))

            const playerJoinStatusBar = uiSession.createStatusBarItem(EditorStatusBarAlignment.Right, 30);
            playerJoinStatusBar.text = `Welcome to editor ${player.name}`;

            // Return objects with the IDisposable interface for things you'd like automatically cleaned up when
            // an extension is shutdown. The following is a simple example of this. This serves as an alternative to
            // explicit cleanup in the shutdown function for more complex scenarios
            const onCleanDisposable: IDisposable = {teardown: () => {
                player.runCommandAsync(`say A player has left. The menu item has now been clicked ${MENU_CLICKED_TIMES_ALL_PLAYERS} across all players in the current multiplayer session.`)
            }};

            return [onCleanDisposable];
        },

        (uiSession: IPlayerUISession<PerPlayerStorage>) => {
            // Do any explicit cleanup when a player is leaving and the extension instance is shutting down
            const player = uiSession.extensionContext.player;
            const playerName = player.name;

            // Example usage of IPlayerUISession scratch storage to access this players specific data that was saved during activation.
            console.log(`Shutting down extension [${__EXTENSION_NAME__}] for player [${playerName}]. This player clicked the menu items ${uiSession.scratchStorage?.NUM_TIMES_PLAYER_CLICKED} times in the session.`);
        }
    );

    if (extensionObject) {
        extensionObject.description = 'Insert a useful description of your extension';
        extensionObject.notes = 'http://alturl.com/p749b';
    } else {
        throw `Failed to register the extension [${__EXTENSION_NAME__}]`;
    }
}
