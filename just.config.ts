import * as fs from 'fs-extra';
import * as envHelpers from './environment-helpers';

import { argv, option, series, task, webpackTask, logger } from 'just-scripts';
import rimraf from 'rimraf';
import path from 'path';

require('dotenv').config();

option('overrideConfig');

task('bundle', () => {
	return webpackTask(argv().overrideConfig ? { config: argv().overrideConfig } : undefined);
});

task('build', series('bundle'));

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

task('prepare-uwp', () => {
	const exeType = "UWP";
	_prepareTargetFolder(exeType);
});

task('prepare-win32', () => {
	const exeType = "Win32";
	_prepareTargetFolder(exeType);
});

/*
  Internal function to create and prepare the destination folder,
  and modify the assets contained within to match with the settings
  stored in the .env file
*/

function _prepareTargetFolder(exeType: string) {

	logger.info('Preparing destination behavior pack folder (' + exeType + ')');

	const extensionName = envHelpers.getExtensionName();
	const targetFolder = envHelpers.getTargetDir(exeType, extensionName);
	if(!targetFolder) {
		throw 'Unable to resolve target behavior pack folder';
	}

	// Check that the behavior pack folder exists
	try {
		if (!fs.existsSync(targetFolder)) {
			logger.info('Creating behavior pack folder [' + targetFolder + ']');
			fs.mkdirSync(targetFolder);
		}
	} catch(err) {
		logger.error(err);
		throw err;
	}

	// Copy our assets into that folder
	const sourcePath = path.resolve(__dirname, 'assets');
	logger.info('Copying template files to destination (' + targetFolder + ')');
	try{
		// check that our assets folder exists!
		if(!fs.existsSync(sourcePath)) {
			const msg = 'Failed to locate template `assets` folder';
			logger.error(msg);
			throw msg;
		}
	} catch(err) {
		logger.error(err);
		throw err;
	}

	// Copy the folder contents to the destination
	fs.copySync(sourcePath, targetFolder, {overwrite: true}, (err) => {
		if(err) {
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
	} catch(err) {
		logger.error(err);
		throw err;
	}

	// find/replace all expandable variables '{var-name}' and replace them
	// with the ones defined in the .env file
	manifest = envHelpers.expandVariablesWithEnvironmentVariables(manifest);

	// Now, replace the manifest file with the updated one
	try {
		// Write out the new file
		fs.writeFileSync(manifestFilename, manifest, {encoding: 'utf8', flag: 'w'});
	} catch(err) {
		logger.error(err);
		throw err;
	}
}