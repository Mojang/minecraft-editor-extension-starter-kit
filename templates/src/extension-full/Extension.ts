import {
    createPaneBindingObject,
    IPlayerUISession,
    registerEditorExtension,
    getLocalizationId,
    Ray,
    IModalTool,
    ActionTypes,
    MouseProps,
    MouseActionType,
    MouseInputType,
    KeyboardKey,
    InputModifier,
    EditorInputContext,
  } from '@minecraft/server-editor';
  import { MinecraftBlockTypes, Player, Vector3 } from '@minecraft/server';
  
  enum PortalType {
    Nether = 0,
    End = 1,
  }
  
  enum Orientation {
    X = 0,
    Z = 1,
  }
  
  function getRandomInt(upper: number) {
    return Math.ceil(Math.random() * (upper + 1));
  }
  
  function addPortalGeneratorSettingsPane(uiSession: IPlayerUISession, tool: IModalTool) {
    const windowPane = uiSession.createPropertyPane({
        titleStringId: 'portalGenerator.windowTitle',
        titleAltText: 'Portal Generator',
    });
  
    const settings = createPaneBindingObject(windowPane, {
        portalType: PortalType.Nether,
        netherSizeX: 4,
        netherSizeY: 5,
        netherOrientation: Orientation.X,
        netherCorners: true,
        netherPercentComplete: 100,
        replaceFloor: false,
        enderNumEye: 12,
    });
  
    const onExecuteGenerator = (ray?: Ray) => {
        const player: Player = uiSession.extensionContext.player;
  
        // Use the mouse ray if it is available
        const targetBlock =
            ray !== undefined
                ? player.dimension.getBlockFromRay(ray.location, ray.direction)
                : player.getBlockFromViewDirection();
  
        if (targetBlock === undefined) {
            player.dimension.runCommand('SAY No block from view vector');
            return;
        }
  
        // Offset the location of the brush by 1 on the y axis (up) if we are not replacing the floor
        const location: Vector3 = {
            x: targetBlock.location.x,
            y: targetBlock.location.y + (settings.replaceFloor ? 0 : 1),
            z: targetBlock.location.z,
        };
  
        if (settings.portalType === PortalType.Nether) {
            if (settings.netherPercentComplete === 0) {
                return;
            }
  
            if (player.dimension.id.endsWith('the_end')) {
                player.dimension.runCommand('SAY You cannot place a nether portal in the end');
                return;
            }
  
            uiSession.extensionContext.transactionManager.openTransaction('Transaction group portal generator');
  
            let from: Vector3 = location;
            let to: Vector3 = { x: 0, y: 0, z: 0 };
  
            if (settings.netherOrientation === Orientation.X) {
                to = {
                    x: location.x + settings.netherSizeX,
                    y: location.y + settings.netherSizeY,
                    z: location.z,
                };
            } else if (settings.netherOrientation === Orientation.Z) {
                to = {
                    x: location.x,
                    y: location.y + settings.netherSizeY,
                    z: location.z + settings.netherSizeX,
                };
            } else {
                player.dimension.runCommand('SAY Failed to get valid orientation');
                uiSession.extensionContext.transactionManager.discardOpenTransaction();
                return;
            }
  
            const yEnd = settings.netherSizeY - 1;
            const xEnd = settings.netherSizeX - 1;
            uiSession.extensionContext.transactionManager.trackBlockChangeArea(from, to);
            for (let y = 0; y < settings.netherSizeY; ++y) {
                for (let x = 0; x < settings.netherSizeX; ++x) {
                    let block = MinecraftBlockTypes.air;
  
                    // Percent complete is randomized percentage
                    if (settings.netherPercentComplete !== 100) {
                        const randVal = getRandomInt(100);
                        if (settings.netherPercentComplete - randVal < 0) {
                            continue;
                        }
                    }
  
                    // Set as obsidian for bottom, top, and edges of portal
                    if (
                        !settings.netherCorners &&
                        ((y === 0 && x === 0) ||
                            (y === 0 && x === xEnd) ||
                            (y === yEnd && x === xEnd) ||
                            (y === yEnd && x === 0))
                    ) {
                        continue; // no corners
                    } else if (y === 0 || y === yEnd || x === 0 || x === xEnd) {
                        block = MinecraftBlockTypes.obsidian;
                    } else {
                        continue;
                    }
  
                    const loc: Vector3 =
                        settings.netherOrientation === Orientation.X
                            ? { x: location.x + x, y: location.y + y, z: location.z }
                            : { x: location.x, y: location.y + y, z: location.z + x };
  
                    player.dimension.getBlock(loc)?.setType(block);
                }
            }
  
            let ori = 'x';
            if (settings.netherOrientation === Orientation.Z) {
                ori = 'z';
                from = { x: location.x, y: location.y + 1, z: location.z + 1 };
                to = {
                    x: location.x,
                    y: location.y + settings.netherSizeY - 2,
                    z: location.z + settings.netherSizeX - 2,
                };
            } else {
                from = { x: location.x + 1, y: location.y + 1, z: location.z };
                to = {
                    x: location.x + settings.netherSizeX - 2,
                    y: location.y + settings.netherSizeY - 2,
                    z: location.z,
                };
            }
  
            if (settings.netherPercentComplete === 100) {
                // We must fill the portals as it must have the axis set while setting the type
                // or the engine will destroy the block and the scripting API wont allow both in one operation
                player.dimension.runCommand(
                    `FILL ${from.x} ${from.y} ${from.z} ${to.x} ${to.y} ${to.z} portal ["portal_axis":"${ori}"]`
                );
            }
            uiSession.extensionContext.transactionManager.commitOpenTransaction();
  
        } else if (settings.portalType === PortalType.End) {
            uiSession.extensionContext.transactionManager.openTransaction('Transaction group portal generator');
  
            const from: Vector3 = { x: location.x, y: location.y, z: location.z };
            const to: Vector3 = { x: location.x + 4, y: location.y, z: location.z + 4 };
  
            let eyesToUse: boolean[] = [
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
            ];
            if (settings.enderNumEye === 12) {
                eyesToUse = [true, true, true, true, true, true, true, true, true, true, true, true];
            } else if (settings.enderNumEye !== 0) {
                const possibleEyeLocs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
                for (let i = 0; i < settings.enderNumEye; ++i) {
                    const rand = getRandomInt(possibleEyeLocs.length);
  
                    eyesToUse[possibleEyeLocs[rand]] = true;
                    possibleEyeLocs.splice(rand, 1);
                }
            }
  
            let i = 0;
            uiSession.extensionContext.transactionManager.trackBlockChangeArea(from, to);
            for (let z = 0; z < 5; ++z) {
                for (let x = 0; x < 5; ++x) {
                    let rot = 0;
                    let blockType = MinecraftBlockTypes.air;
                    if (x === 0 && z !== 0 && z !== 4) {
                        // west edge
                        blockType = MinecraftBlockTypes.endPortalFrame;
                        rot = 3;
                    } else if (x === 4 && z !== 0 && z !== 4) {
                        // east edge
                        blockType = MinecraftBlockTypes.endPortalFrame;
                        rot = 1;
                    } else if (z === 0 && x !== 0 && x !== 4) {
                        // south edge
                        blockType = MinecraftBlockTypes.endPortalFrame;
                        rot = 0;
                    } else if (z === 4 && x !== 0 && x !== 4) {
                        // north edge
                        blockType = MinecraftBlockTypes.endPortalFrame;
                        rot = 2;
                    } else if (settings.enderNumEye === 12 && x >= 1 && z >= 1 && x <= 3 && z <= 3) {
                        // center
                        blockType = MinecraftBlockTypes.endPortal;
                    } else {
                        continue;
                    }
  
                    const block = player.dimension.getBlock({ x: location.x + x, y: location.y, z: location.z + z });
  
                    if (block) {
                        block.setType(blockType);
                        if (blockType === MinecraftBlockTypes.endPortalFrame) {
                            const perms = block.permutation.clone();
                            perms.withState('direction', rot);
                            perms.withState('end_portal_eye_bit', eyesToUse[i]);
                            block.setPermutation(perms);
                            i += 1;
                        }
                    } else {
                        player.dimension.runCommand('SAY Invalid block');
                    }
                }
            }
            uiSession.extensionContext.transactionManager.commitOpenTransaction();
        } else {
            player.dimension.runCommand('SAY Unknown portal type');
            return;
        }
    };
  
    // Create an action that will be executed on left mouse click
    const executeMouseAction = uiSession.actionManager.createAction({
        actionType: ActionTypes.MouseRayCastAction,
        onExecute: (mouseRay: Ray, mouseProps: MouseProps) => {
            if (
                mouseProps.mouseAction === MouseActionType.LeftButton &&
                mouseProps.inputType === MouseInputType.ButtonDown
            ) {
                onExecuteGenerator(mouseRay);
            }
        },
    });
  
    // Create and an action that will be executed on CTRL + P
    const executeKeyAction = uiSession.actionManager.createAction({
        actionType: ActionTypes.NoArgsAction,
        onExecute: () => {
            onExecuteGenerator();
        },
    });
  
    // Register actions as input bindings to tool context
    tool.registerKeyBinding(executeKeyAction, KeyboardKey.KEY_P, InputModifier.Control);
    tool.registerMouseButtonBinding(executeMouseAction);
  
    const netherPane = windowPane.createPropertyPane({ titleStringId: 'NO_ID', titleAltText: 'Nether Portal' });
    const enderPane = windowPane.createPropertyPane({ titleStringId: 'NO_ID', titleAltText: 'Ender Portal' });
  
    windowPane.addDropdown(settings, 'portalType', {
        titleStringId: getLocalizationId('portalGenerator.settings.portalType'),
        titleAltText: 'Portal Type',
        dropdownItems: [
            {
                displayAltText: 'Nether Portal',
                displayStringId: 'portalGenerator.type.nether',
                value: PortalType.Nether,
            },
            { displayAltText: 'End Portal', displayStringId: 'portalGenerator.type.end', value: PortalType.End },
        ],
        onChange: (obj: object, _property: string, _oldValue: object, _newValue: object) => {
            settings.portalType = Number(_newValue);
            if (settings.portalType === PortalType.Nether) {
                netherPane.hide();
            } else if (settings.portalType === PortalType.End) {
                enderPane.hide();
            }
        },
    });
  
    windowPane.addBool(settings, 'replaceFloor', {
        titleStringId: getLocalizationId('portalGenerator.settings.replaceFloor'),
        titleAltText: 'Replace Floor',
    });
  
    netherPane.addDropdown(settings, 'netherOrientation', {
        titleStringId: getLocalizationId('portalGenerator.settings.portalType'),
        titleAltText: 'Portal Orientation',
        dropdownItems: [
            { displayAltText: 'X Axis', displayStringId: 'NO_ID', value: Orientation.X },
            { displayAltText: 'Z Axis', displayStringId: 'NO_ID', value: Orientation.Z },
        ],
        onChange: (obj: object, _property: string, _oldValue: object, _newValue: object) => {
            settings.netherOrientation = Number(_newValue);
        },
    });
  
    netherPane.addNumber(settings, 'netherSizeX', {
        titleStringId: getLocalizationId('portalGenerator.settings.sizeX'),
        titleAltText: 'Size Width',
        min: 4,
        max: 33,
        showSlider: false,
    });
  
    netherPane.addNumber(settings, 'netherSizeY', {
        titleStringId: getLocalizationId('portalGenerator.settings.sizeY'),
        titleAltText: 'Size Height',
        min: 5,
        max: 33,
        showSlider: false,
    });
  
    netherPane.addBool(settings, 'netherCorners', {
        titleStringId: 'NO_ID',
        titleAltText: 'Corners',
    });
  
    netherPane.addNumber(settings, 'netherPercentComplete', {
        titleStringId: 'NO_ID',
        titleAltText: 'Percent Complete',
        min: 0,
        max: 100,
        showSlider: true,
    });
  
    enderPane.addNumber(settings, 'enderNumEye', {
        titleStringId: 'NO_ID',
        titleAltText: 'Filled Eye of Ender Count',
        min: 0,
        max: 12,
        showSlider: true,
    });
  
    tool.bindPropertyPane(windowPane);
    tool.bindPropertyPane(enderPane);
    tool.bindPropertyPane(netherPane);
  
    return settings;
  }
  
  /**
  * Create a new tool rail item for portal generator
  */
  function addPortalGeneratorTool(uiSession: IPlayerUISession) {
    return uiSession.toolRail.addTool({
        displayStringLocId: 'portalGenerator.displayName',
        displayString: 'Portal Generator (CTRL + SHIFT + P)',
        icon: '',
        tooltipLocId: 'portalGenerator.toolTip',
        tooltip: 'Creates portals',
    });
  }
  
  /**
  * Register Portal Generator extension
  */
  export function registerExtension() {
    registerEditorExtension(
        'PortalGenerator',
        (uiSession: IPlayerUISession) => {
            console.log(`Initializing ${uiSession.extensionContext.extensionName} extension`);
  
            // Add tool to tool rail
            const portalGeneratorTool = addPortalGeneratorTool(uiSession);
  
            // Create settings pane/window
            addPortalGeneratorSettingsPane(uiSession, portalGeneratorTool);
  
            // Register a global shortcut (CTRL + SHIFT + P) to select the tool
            const toolToggleAction = uiSession.actionManager.createAction({
                actionType: ActionTypes.NoArgsAction,
                onExecute: () => {
                    uiSession.toolRail.setSelectedOptionId(portalGeneratorTool.id, true);
                },
            });
            uiSession.inputManager.registerKeyBinding(
                EditorInputContext.GlobalToolMode,
                toolToggleAction,
                KeyboardKey.KEY_P,
                InputModifier.Control | InputModifier.Shift
            );
  
            return [];
        },
        (uiSession: IPlayerUISession) => {
            console.log(`Shutting down ${uiSession.extensionContext.extensionName} extension`);
        },
        { description: 'Tool for generating portals' }
    );
  }
  