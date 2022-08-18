import {
    registerEditorExtension,
} from '@mojang/minecraft-editor';

import { ExtensionContext } from '@mojang/minecraft-editor-bindings';

declare var __EXTENSION_NAME__: string; // defined in webpack.config (read from .env)

/**
 * Provides a sample extension registration function
 * @public
 */
export function registerExtension() {
    const extensionObject = registerEditorExtension(
        __EXTENSION_NAME__,
        (context: ExtensionContext) => {
            const player = context.player;
            const playerName = player.name;
            console.log('Initializing extension [' + __EXTENSION_NAME__ + '] for player [' + playerName + ']' );
        },

        (context: ExtensionContext) => {
            const player = context.player;
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
