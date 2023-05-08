import { registerEditorExtension } from "@minecraft/server-editor";

declare var __EXTENSION_NAME__: string; // defined in webpack.config (read from .env)

/**
 * Provides a sample extension registration function
 * @public
 */
export function registerExtension() {
  const extensionObject = registerEditorExtension(
    __EXTENSION_NAME__,
    (uiSession) => {
      const player = uiSession.extensionContext.player;
      const playerName = player.name;
      console.log(
        `Initializing extension [${uiSession.extensionContext.extensionName}] for player [${playerName}]`
      );
      return [];
    },

    (uiSession) => {
      const player = uiSession.extensionContext.player;
      const playerName = player.name;
      console.log(
        `Shutting down extension [${uiSession.extensionContext.extensionName}] for player [${playerName}]`
      );
    },
    {
      description: "Empty Sample Extension",
      notes:
        "Insert any notes, ownership info, etc here.  http://alturl.com/p749b",
    }
  );
}
