import * as fs from 'fs-extra';
import * as envHelpers from './environment-helpers';
import * as archiver from 'archiver';

import { argv, option, series, task, webpackTask, logger } from 'just-scripts';
import rimraf from 'rimraf';
import path from 'path';

require('dotenv').config();

// Win32 or UWP
option('exetype');

// Forces the behavior pack folder to be created and the assets to be copied over and
// various environment variables to be injected
option('forceprepare');

task('bundle', () => {
    return webpackTask();
});

task('prepare', () => {
    const exeType: string = (argv().exetype as string).toUpperCase();
    if (!exeType) {
        throw 'No exetype option specified - unknown target platform';
    }

    const forcePrepare: boolean = argv().forceprepare ? (argv().forceprepare as boolean) : false;

    _prepareBehaviorPackFolder(exeType, forcePrepare);
    _prepareResourcePackFolder(exeType, forcePrepare);
    _prepareVSCode(exeType);
});

task('copyBuildToTarget', () => {
    const exeType: string = (argv().exetype as string).toLowerCase();
    if (!exeType) {
        throw 'No exetype option specified - unknown target platform';
    }

    var targetFolder = envHelpers.getBehaviorPackFolder(exeType);
    targetFolder = path.resolve(targetFolder, 'scripts');
    try {
        // check that our destination scripts folder exists
        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder, { recursive: true });
        }
    } catch (err) {
        logger.error(err);
        throw err;
    }

    const sourcePath = path.resolve(__dirname, 'dist');
    logger.info('Copying build artifacts to destination (' + targetFolder + ')');
    try {
        // check that our assets folder exists!
        if (!fs.existsSync(sourcePath)) {
            const msg = 'Failed to locate build artifact `dist` folder';
            logger.error(msg);
            throw msg;
        }
    } catch (err) {
        logger.error(err);
        throw err;
    }

    // Copy the dist folder contents to the destination target
    fs.copySync(sourcePath, targetFolder, { overwrite: true }, err => {
        if (err) {
            logger.error(err);
            throw err;
        }
        logger.info('Copy Success');
    });
});

task('build', series('prepare', 'bundle', 'copyBuildToTarget'));

task('clean', () => {
    rimraf('temp', {}, () => {
        // Silent failure on failing to clean
    });
    rimraf('lib', {}, () => {
        // Silent failure on failing to clean
    });
    rimraf('dist', {}, () => {
        // Silent failure on failing to clean
    });
    rimraf('publish', {}, () => {
        // Silent failure on failing to clean
    });
});

task('superclean', () => {
    rimraf('node_modules', {}, () => {});
    rimraf('.yarn/cache', {}, () => {});
    rimraf('.yarn/install-state.gz', {}, () => {});
    rimraf('yarn.lock', {}, () => {});
    const behaviorPackFolderWin32 = envHelpers.getBehaviorPackFolder('WIN32');
    if (behaviorPackFolderWin32) {
        rimraf(behaviorPackFolderWin32, {}, () => {});
    }
    const behaviorPackFolderUWP = envHelpers.getBehaviorPackFolder('UWP');
    if (behaviorPackFolderUWP) {
        rimraf(behaviorPackFolderUWP, {}, () => {});
    }
    const resourcePackFolderWin32 = envHelpers.getResourcePackFolder('WIN32');
    if (resourcePackFolderWin32) {
        rimraf(resourcePackFolderWin32, {}, () => {});
    }
    const resourcePackFolderUWP = envHelpers.getResourcePackFolder('UWP');
    if (resourcePackFolderUWP) {
        rimraf(resourcePackFolderUWP, {}, () => {});
    }
});

task('nuke', series('clean', 'superclean'));

task('compressTarget', async () => {
    const exeType: string = (argv().exetype as string).toLowerCase();
    if (!exeType) {
        throw 'No exetype option specified - unknown target platform';
    }

	const bpName = envHelpers.getBehaviorPackName();
	const rpName = envHelpers.getResourcePackName();
    const bpFolder = envHelpers.getBehaviorPackFolder(exeType);
    const rpFolder = envHelpers.getResourcePackFolder(exeType);
    const extensionName = envHelpers.getExtensionName() + '.mceditoraddon';
    const extensionArchivePath = path.resolve(__dirname, 'dist', extensionName);

    await _createAddon(extensionArchivePath, bpFolder, bpName, rpFolder, rpName);

	console.log(`.mceditoraddon has been created at "${extensionArchivePath}"`)
});

task('make-addon', series('build', 'compressTarget'));
/*
  Internal function to create and prepare the resource pack folder,
  and modify the assets contained within to match with the settings
  stored in the .env file
*/
function _prepareVSCode(exeType: string) {
    logger.info('Preparing VSCode settings');

    const extensionName = envHelpers.getExtensionName();

    const assetSource = path.resolve(__dirname, 'assets', '.vscode');
    const vsCodeDest = path.resolve(__dirname, '.vscode');

    logger.info('Copying VSCode settings to .vscode (' + vsCodeDest + ')');
    // Copy the folder contents to the destination
    fs.copySync(assetSource, vsCodeDest, { overwrite: true }, err => {
        if (err) {
            logger.error(err);
            throw err;
        }
        logger.info('Copy Success');
    });

    const launchSettingsPath = path.resolve(vsCodeDest, 'launch.json');
    var launchSettings = require(launchSettingsPath);

    interface configuration {
        type?: string;
        request?: string;
        name?: string;
        mode?: string;
        sourceMapRoot?: string;
        port?: number;
    }

    logger.info('Inserting destination source mapping');
    var found = false;

    for (var configAny of launchSettings.configurations) {
        const config: configuration = configAny as configuration;
        found = true;
        const buildTarget = path.resolve(envHelpers.getBehaviorPackFolder(exeType), 'scripts');
        config.sourceMapRoot = buildTarget;
    }

    if (!found) {
        throw 'Unable to locate vscode.launch.json configuration';
    }

    // Now re-write the file
    try {
        // Write out the modified file
        fs.writeFileSync(launchSettingsPath, JSON.stringify(launchSettings, null, 2), { encoding: 'utf8', flag: 'w' });
    } catch (err) {
        logger.error(err);
        throw err;
    }
}

/*
  Internal function to create and prepare the resource pack folder,
  and modify the assets contained within to match with the settings
  stored in the .env file
*/
function _prepareResourcePackFolder(exeType: string, force: boolean) {
    if (!envHelpers.shouldGenerateResourcePack()) {
        logger.info('Skipping Resource Pack generation');
        return false;
    }

    logger.info('Preparing destination resource pack folder (' + exeType + ')');

    const extensionName = envHelpers.getExtensionName();
    const targetFolder = envHelpers.getResourcePackFolder(exeType);
    if (!targetFolder) {
        throw 'Unable to resolve target resource pack folder';
    }

    // Check that the resource pack folder exists
    try {
        if (!fs.existsSync(targetFolder)) {
            logger.info('Creating resource pack folder [' + targetFolder + ']');
            fs.mkdirSync(targetFolder, { recursive: true });
        } else {
            // Resource Pack folder exists - no need to carry on unless we're
            // forced to
            if (!force) {
                logger.info('Resource Pack exists - skipping prepare step');
                return;
            }
            logger.info('Forcing Resource Pack prepare step');
        }
    } catch (err) {
        logger.error(err);
        throw err;
    }

    // Copy our assets into that folder
    const sourcePath = path.resolve(__dirname, 'assets', 'resource');
    logger.info('Copying template files to destination (' + targetFolder + ')');
    try {
        // check that our assets folder exists!
        if (!fs.existsSync(sourcePath)) {
            const msg = 'Failed to locate template `resource assets` folder';
            logger.error(msg);
            throw msg;
        }
    } catch (err) {
        logger.error(err);
        throw err;
    }

    // Copy the folder contents to the destination
    fs.copySync(sourcePath, targetFolder, { overwrite: true }, err => {
        if (err) {
            logger.error(err);
            throw err;
        }
        logger.info('Copy Success');
    });

    // Now grep through the manifest file and expand upon the variables
    logger.info('Preparing Manifest file');

    var manifest: string;
    const manifestFilename = path.resolve(targetFolder, 'manifest.json');
    try {
        // Load the manifest file
        manifest = fs.readFileSync(manifestFilename, 'utf8');
    } catch (err) {
        logger.error(err);
        throw err;
    }

    // find/replace all expandable variables '{var-name}' and replace them
    // with the ones defined in the .env file
    manifest = envHelpers.expandVariablesWithEnvironmentVariables(manifest);

    // Now, replace the manifest file with the updated one
    try {
        // Write out the new file
        fs.writeFileSync(manifestFilename, manifest, { encoding: 'utf8', flag: 'w' });
    } catch (err) {
        logger.error(err);
        throw err;
    }

    // Rebuild the textures_list.json
    const texturesPath = path.resolve(sourcePath, 'textures');
    const textureList = _getFileList(texturesPath, ['png', 'tga', 'jpg', 'jpeg'], sourcePath);

    const textureListFilename = path.resolve(targetFolder, 'textures', 'textures_list.json');

    // Now, write out the new textures_list.json file
    try {
        // Write out the new file
        fs.writeFileSync(textureListFilename, JSON.stringify(textureList, null, 2), { encoding: 'utf8', flag: 'w' });
    } catch (err) {
        logger.error(err);
        throw err;
    }

    // We need to add the dependency for the resource pack to the behavior pack
    const behaviorPackFolder = envHelpers.getBehaviorPackFolder(exeType);
    const behaviorPackManifestFilename = path.resolve(behaviorPackFolder, 'manifest.json');
    const resourcePackUUID = envHelpers.getResourcePackUUID();
    var behaviorPackManifest = require(behaviorPackManifestFilename);

    interface dependency {
        module_name?: string;
        uuid: string;
        version: number[];
    }

    // Let's make sure we haven't added it already
    var found = false;
    for (const d of behaviorPackManifest.dependencies) {
        const dep: dependency = d as dependency;
        if (dep && dep.uuid === resourcePackUUID) {
            found = true;
            break;
        }
    }

    if (!found) {
        logger.info('Adding resource pack dependency to behavior pack');

        // Insert the new dependency object into the JSON object
        const newKey: dependency = { uuid: envHelpers.getResourcePackUUID(), version: [0, 0, 1] };
        behaviorPackManifest.dependencies.push(newKey);

        // Now re-write the file
        try {
            // Write out the modified file
            fs.writeFileSync(behaviorPackManifestFilename, JSON.stringify(behaviorPackManifest, null, 2), {
                encoding: 'utf8',
                flag: 'w',
            });
        } catch (err) {
            logger.error(err);
            throw err;
        }
    } else {
        logger.info('Skipping dependency addition to behavior pack - already found');
    }
}
/*
  Internal function to create and prepare the behavior pack folder,
  and modify the assets contained within to match with the settings
  stored in the .env file
*/
function _prepareBehaviorPackFolder(exeType: string, force: boolean) {
    logger.info('Preparing destination behavior pack folder (' + exeType + ')');

    const extensionName = envHelpers.getExtensionName();
    const targetFolder = envHelpers.getBehaviorPackFolder(exeType);
    if (!targetFolder) {
        throw 'Unable to resolve target behavior pack folder';
    }

    // Check that the behavior pack folder exists
    try {
        if (!fs.existsSync(targetFolder)) {
            logger.info('Creating behavior pack folder [' + targetFolder + ']');
            fs.mkdirSync(targetFolder, { recursive: true });
        } else {
            // Behavior Pack folder exists - no need to carry on unless we're
            // forced to
            if (!force) {
                logger.info('Behavior Pack exists - skipping prepare step');
                return;
            }
            logger.info('Forcing Behavior Pack prepare step');
        }
    } catch (err) {
        logger.error(err);
        throw err;
    }

    // Copy our assets into that folder
    const sourcePath = path.resolve(__dirname, 'assets', 'behavior');
    logger.info('Copying template files to destination (' + targetFolder + ')');
    try {
        // check that our assets folder exists!
        if (!fs.existsSync(sourcePath)) {
            const msg = 'Failed to locate template `behavior assets` folder';
            logger.error(msg);
            throw msg;
        }
    } catch (err) {
        logger.error(err);
        throw err;
    }

    // Copy the folder contents to the destination
    fs.copySync(sourcePath, targetFolder, { overwrite: true }, err => {
        if (err) {
            logger.error(err);
            throw err;
        }
        logger.info('Copy Success');
    });

    // Now grep through the manifest file and expand upon the variables
    logger.info('Preparing Manifest file');

    var manifest: string;
    const manifestFilename = path.resolve(targetFolder, 'manifest.json');
    try {
        // Load the manifest file
        manifest = fs.readFileSync(manifestFilename, 'utf8');
    } catch (err) {
        logger.error(err);
        throw err;
    }

    // find/replace all expandable variables '{var-name}' and replace them
    // with the ones defined in the .env file
    manifest = envHelpers.expandVariablesWithEnvironmentVariables(manifest);

    // Now, replace the manifest file with the updated one
    try {
        // Write out the new file
        fs.writeFileSync(manifestFilename, manifest, { encoding: 'utf8', flag: 'w' });
    } catch (err) {
        logger.error(err);
        throw err;
    }
}

function _getFileList(dirName: string, extensions: string[], pathPrefix: string) {
    var files: string[] = [];

    const items = fs.readdirSync(dirName, { withFileTypes: true });
    for (const item of items) {
        if (item.isDirectory()) {
            files = [...files, ..._getFileList(`${dirName}/${item.name}`, extensions, pathPrefix)];
        } else {
            for (const extension of extensions) {
                if (item.name.endsWith(extension)) {
                    const fullName = `${dirName}/${item.name}`;
                    const relativeName = fullName.substring(pathPrefix.length + 1);
                    files.push(relativeName);
                    break;
                }
            }
        }
    }

    return files;
}

async function _createAddon(extensionArchivePath: string, bpPath: string, bpName: string, rpPath: string, rpName: string) {
    const stream = fs.createWriteStream(extensionArchivePath);
    const archive = archiver.create('zip', { zlib: { level: 9 } });

    archive.on('error', function (err) {
        throw err;
    });

    await new Promise((resolve, reject) => {
        archive.pipe(stream);
        archive.directory(bpPath, bpName);
        archive.directory(rpPath, rpName);
        archive.on('error', err => {
            throw err;
        });
        archive.finalize();

        stream.on('close', function () {
            console.log(`zipped ${archive.pointer()} total bytes.`);
            resolve();
        });
    });
}
