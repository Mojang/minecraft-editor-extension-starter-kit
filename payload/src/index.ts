import { registerExtension } from "./extension/Extension"

declare var __BEHAVIOR_PACK_NAME__: string; // defined in webpack.config (read from .env)

/**
 * Simple function to get the name of the behavior pack being built
 *
 * @returns The name of the behavior pack
 * @public
 */
export function getBehaviorPackName(): string {
    return __BEHAVIOR_PACK_NAME__;
}

registerExtension();