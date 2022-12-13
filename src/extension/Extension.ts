import {
    ActionTypes,
    createPaneBindingObject,
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
 * Provides a sample extension registration function
 * @public
 */
export function registerExtension() {
    const extensionObject = registerEditorExtension(
        __EXTENSION_NAME__,
        uiSession => {
            const player = uiSession.extensionContext.player;
            const playerName = player.name;
            console.log('Initializing extension [' + __EXTENSION_NAME__ + '] for player [' + playerName + ']' );

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
                }
            }))

            // Return objects with the IDisposable interface for things you'd like automatically cleaned up when a player leaves
            return [];
        },

        uiSession => {
            const player = uiSession.extensionContext.player;
            const playerName = player.name;
            console.log('Shutting down extension [' + __EXTENSION_NAME__ + '] for player [' + playerName + ']' );
        }
    );

    if (extensionObject) {
        extensionObject.description = 'Insert a useful description of your extension';
        extensionObject.notes = 'http://alturl.com/p749b';
    } else {
        throw 'Failed to register the extension [' + __EXTENSION_NAME__ + ']';
    }
}
