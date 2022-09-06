import {
    createPaneBindingObject,
    EditorInputContext,
    getPlayer,
    getPlayerUISession,
    IModalTool,
    IPlayerUISession,
    Ray,
    registerEditorExtension,
} from '@mojang/minecraft-editor';

import { BlockVolume, BlockVolumeIterator, ExtensionContext } from '@mojang/minecraft-editor-bindings';
import { ActionTypes, InputModifier, KeyboardKey, MouseButton } from '@mojang/minecraft-editor-events';
import { BlockLocation, BlockType, Dimension, MinecraftBlockTypes, Player } from 'mojang-minecraft';

declare var __EXTENSION_NAME__: string; // defined in webpack.config (read from .env)

const MAX_SEARCH_DEPTH = 100;

function plotLine(location1: BlockLocation, location2: BlockLocation, newLocations: BlockLocation[])
{
    const deltaX = Math.abs(location2.x - location1.x);
    const incrementX = location1.x < location2.x ? 1 : -1;
    const deltaZ = -Math.abs(location2.z - location1.z);
    const incrementZ = location1.z < location2.z ? 1 : -1;
    let error = deltaX + deltaZ;
    let x1 = location1.x;
    let x2 = location2.x;
    let z1 = location1.z;
    let z2 = location2.z;
    // const newLocations: BlockLocation[] = [];

    while( true)
    {
        newLocations.push(new BlockLocation(x1, location1.y, z1));
        if (x1 == x2 && z1 == z2)
        {
            break;
        }
        const e2 = 2 * error;
        if (e2 >= deltaZ)
        {
            if(x1 == x2) 
            {
                break;
            }
            error = error + deltaZ;
            x1 = x1 + incrementX;
        }
        if (e2 <= deltaX)
        {
            if (z1 == z2)
            {
                break;
            } 

            error = error + deltaX;
            z1 = z1 + incrementZ;
        }
    }
    return newLocations;
}

function projectLine(context: ExtensionContext, newLocations: BlockLocation[])
{
    const additionalLocations: BlockLocation[] = [];
    const player = getPlayer(context.playerName);
    const dimension = player.dimension;
    for (const newLoc of newLocations) {
        const currentLoc = new BlockLocation(newLoc.x, newLoc.y, newLoc.z);
        let counter = 0;
        let searchDown = false;

        // Look up
        while(++counter < MAX_SEARCH_DEPTH)
        {
            const currentBlock = dimension.getBlock(currentLoc);
            const blockAbove = dimension.getBlock(currentLoc.above());
            if(currentBlock.type === MinecraftBlockTypes.air)
            {
                searchDown = true;
                break;
            }

            if(blockAbove.type === MinecraftBlockTypes.air)
            {
                newLoc.y = currentLoc.y;
                break;
            }

            currentLoc.y++;
        }

        // Look down.
        if(searchDown)
        {
            counter = 0;
            currentLoc.y = newLoc.y - 1;
            while(++counter < MAX_SEARCH_DEPTH)
            {
                const currentBlock = dimension.getBlock(currentLoc);
                if(currentBlock.type !== MinecraftBlockTypes.air)
                {
                    newLoc.y = currentLoc.y;
                    break;
                }

                currentLoc.y--;
            }   
        }
    }
}

function searchBlocksAndAdd(context: ExtensionContext, newLocation: BlockLocation, previousLocation: BlockLocation, width: number) {
    const newLocations: BlockLocation[] = [];
    
    plotLine(newLocation, previousLocation, newLocations);
    if(newLocation.x!=previousLocation.x && (newLocation.z-previousLocation.z)/(newLocation.x-previousLocation.x)<1)
    {
        const wz=(width-1)*Math.sqrt(Math.pow((newLocation.x-previousLocation.x),2)+Math.pow((newLocation.z-previousLocation.z),2))/(2*Math.abs(newLocation.x-previousLocation.x));
        for(let i=0;i<wz;i++)
        {
            plotLine(new BlockLocation(previousLocation.x,previousLocation.y,previousLocation.z-i),new BlockLocation(newLocation.x,newLocation.y,newLocation.z-i), newLocations);
            plotLine(new BlockLocation(previousLocation.x,previousLocation.y,previousLocation.z+i),new BlockLocation(newLocation.x,newLocation.y,newLocation.z+i), newLocations);
        }
    }
     else
    {
        const wx=(width-1)*Math.sqrt(Math.pow((newLocation.x-previousLocation.x),2)+Math.pow((newLocation.z-previousLocation.z),2))/(2*Math.abs(newLocation.z-previousLocation.z));
        for(let i=0;i<wx;i++)
        {
            plotLine(new BlockLocation(previousLocation.x-i, previousLocation.y,previousLocation.z),new BlockLocation(newLocation.x-i, newLocation.y,newLocation.z), newLocations);
            plotLine(new BlockLocation(previousLocation.x+i, previousLocation.y,previousLocation.z),new BlockLocation(newLocation.x+i, newLocation.y,newLocation.z), newLocations);
        }
    }

    // Project line over the terrain.
    projectLine(context, newLocations);

    // Add new positions into the selection.
    for (const newLoc of newLocations) {
        context.selectionManager.selection.pushVolume(0, new BlockVolume(newLoc, newLoc));
    }
}

function performOperation(context: ExtensionContext, fillType: BlockType) {
    const player: Player = context.player;
    const dimension: Dimension = player.dimension;
    if (context.selectionManager.selection.isEmpty) {
        // Need a better way to surface errors and warnings to the user - this only prints to the
        // chat window, so if it's not open - you don't see it
        dimension.runCommand('SAY Selection is empty');
        return;
    }

    const bounds = context.selectionManager.selection.boundingBox;
    context.transactionManager.trackBlockChangeArea(bounds.min, bounds.max, 'Road-Fill');

    const blockIterator: BlockVolumeIterator = context.selectionManager.selection.getBlockPositionIterator();
    for (const iteratorPos of blockIterator) {
        const block = player.dimension.getBlock(iteratorPos);
        block.setType(fillType);
    }

        
    context.selectionManager.selection.clear();

    context.transactionManager.commitTrackedChanges();
}

function addRoadTool(uiSession: IPlayerUISession) {
    return uiSession.toolRail.addTool({
        displayString: 'Road Tool (Ctrl + R)',
        displayStringLocId: 'roadExtension.toolRailTitle',
        icon: 'pack://textures/editor/Tile-View.png?filtering=point',
        tooltip: 'Creates roads',
        tooltipLocId: 'roadExtension.toolRailDescription',
    });
}

function addRoadToolSettingsPane(context: ExtensionContext, uiSession: IPlayerUISession, tool: IModalTool) {
    const pane = uiSession.createPropertyPane(
        'roadExtension.paneTitle',
        'Road Settings'
    );

    // Here is the binding created.
    const settings = createPaneBindingObject(pane, {
        width: 5,
        block: MinecraftBlockTypes.stone,
        dummy: 3
    });

    const subPane = pane.createPropertyPane("Sub Panel ID", "Sub Panel");
    subPane.addNumber(settings, 'dummy', {
        titleStringId: 'Dummy',
        titleAltText: 'Dummy',
    });

    pane.addDivider();

    const onExecute = (ray?: Ray) => {
        if (uiSession.toolRail.selectedOptionId == tool.id) {
            performOperation(context, settings.block);
            subPane.show();
        }
    };

    const onAddPoint = (ray?: Ray) => {
        // TODO: Get from context or event.source.
        const player = getPlayer(context.playerName);
        const targetBlock =
            ray != null
                ? player.dimension.getBlockFromRay(ray.location, ray.direction)
                : player.getBlockFromViewVector();
        if (targetBlock === undefined || targetBlock === null) {
            player.dimension.runCommand('SAY No block from view vector');
            return;
        }

        const location = targetBlock.location.offset(0, 0, 0);
        if(!context.selectionManager.selection.isEmpty)
        {
            console.log("Selection is not empty");
            const lastEntry = context.selectionManager.selection.peekLastVolume;
            searchBlocksAndAdd(context, location, lastEntry.min, settings.width)
        }

        context.selectionManager.selection.pushVolume(0, new BlockVolume(location, location));
    };

    const clearAction = uiSession.actionManager.createAction({
        actionType: ActionTypes.NoArgsAction,
        onExecute: (ray?: Ray) => {
            context.selectionManager.selection.clear();
            subPane.hide();
        },
    });

    const executeAction = uiSession.actionManager.createAction({
        actionType: ActionTypes.NoArgsAction,
        onExecute: onExecute,
    });

    pane.addNumber(settings, 'width', {
        titleStringId: 'roadExtension.widthLabel',
        titleAltText: 'Width',
        min: 1,
        max: 16,
        showSlider: true,
    });

    pane.addBlockPicker(settings, 'block', {
        titleStringId: 'roadExtension.blockTypeLabel',
        titleAltText: 'Fill Block Type',
        allowedBlocks: [
            MinecraftBlockTypes.grass,
            MinecraftBlockTypes.stone,
            MinecraftBlockTypes.water,
            MinecraftBlockTypes.glass,
            MinecraftBlockTypes.snow,
            MinecraftBlockTypes.air,
        ],
    });

    pane.addDivider();

    pane.addButtonAndBindAction(clearAction, {
        titleStringId: 'roadExtension.clearLabel',
        titleAltText: 'Clear',
    });

    pane.addButtonAndBindAction(executeAction, {
        titleStringId: 'roadExtension.runLabel',
        titleAltText: 'Run!!',
    });

    tool.bindPropertyPane(pane);

    const addPointAction = uiSession.actionManager.createAction({
        actionType: ActionTypes.MouseRayCastAction,
        onExecute: (mouseRay: Ray) => {
            if (uiSession.toolRail.selectedOptionId == tool.id) {
                onAddPoint(mouseRay);
            }
        },
    });

    tool.registerMouseBinding(addPointAction, MouseButton.Left);

    // Binding cleanup will be addressed with ADO:867161
    // Will be addressed with ADO:836977
    /* eslint-disable-next-line */
    const ctx = context as any;
    ctx.cleanup.bindings.push(
        uiSession.inputManager.registerKeyBinding(
            EditorInputContext.Viewport,
            executeAction,
            KeyboardKey.KEY_R,
            InputModifier.CONTROL | InputModifier.SHIFT
        )
    );

    return settings;
}

/**
 * Provides a sample extension registration function
 * @public
 */
export function registerExtension() {
    const extensionObject = registerEditorExtension(
        __EXTENSION_NAME__,
        (context: ExtensionContext) => {
            /* eslint-disable-next-line */
            const ctx = context as any;
            ctx.cleanup = {
                bindings: [],
            };

            const uiSession = getPlayerUISession();
            const player = context.player;
            const playerName = player.name;
            console.log('Initializing extension [' + __EXTENSION_NAME__ + '] for player [' + playerName + ']' );
            // Add the tool to the tool rail.
            const tool = addRoadTool(uiSession);

            // Create pane.
            addRoadToolSettingsPane(context, uiSession, tool);

            const roadToggleAction = uiSession.actionManager.createAction({
                actionType: ActionTypes.NoArgsAction,
                onExecute: () => {
                    uiSession.toolRail.setSelectedOptionId(tool.id, true);
                },
            });
            // Binding cleanup will be addressed with ADO:867161
            ctx.cleanup.bindings.push(
                uiSession.inputManager.registerKeyBinding(
                    EditorInputContext.Viewport,
                    roadToggleAction,
                    KeyboardKey.KEY_R,
                    InputModifier.CONTROL | InputModifier.SHIFT
                )
            );

            // Binding cleanup will be addressed with ADO:867161
            ctx.cleanup.toggle = () => {
                tool.unregisterInputBindings();
            };
        },
        (context: ExtensionContext) => {
            const player = context.player;
            const playerName = player.name;
            console.log('Shutting down extension [' + __EXTENSION_NAME__ + '] for player [' + playerName + ']' );

            /* eslint-disable-next-line */
            const ctx = context as any;
            ctx.cleanup.bindings.forEach((unregister: () => void) => unregister());
            ctx.cleanup.toggle();
        }
    );

    if (extensionObject) {
        extensionObject.description = 'Insert a useful description of your extension';
        extensionObject.notes = 'http://alturl.com/p749b';
    } else {
        throw 'Failed to register the extension [' + __EXTENSION_NAME__ + ']';
    }
}


