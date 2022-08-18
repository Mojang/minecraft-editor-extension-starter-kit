import * as fs from 'fs-extra';
import * as envHelpers from './environment-helpers';

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
	const exeType: string = (argv().exetype as string).toLowerCase();
	if(!exeType) {
		throw 'No exetype option specified - unknown target platform';
	}

	const forcePrepare: boolean = (argv().forceprepare ? argv().forceprepare as boolean : false);

	if(exeType === 'win32') {
		_prepareTargetFolder('Win32', forcePrepare);
	}
	else if( exeType === 'uwp') {
		_prepareTargetFolder('UWP', forcePrepare);
	}
	else {
		throw 'Unrecognized target platform';
	}
});

task('copyBuildToTarget', () => {

	const exeType: string = (argv().exetype as string).toLowerCase();
	if(!exeType) {
		throw 'No exetype option specified - unknown target platform';
	}

	var targetFolder = envHelpers.getBehaviorPackFolder(exeType);
	targetFolder = path.resolve(targetFolder, 'scripts');
	try{
		// check that our destination scripts folder exists
		if(!fs.existsSync(targetFolder)) {
			fs.mkdirSync(targetFolder);
		}
	} catch(err) {
		logger.error(err);
		throw err;
	}

	const sourcePath = path.resolve(__dirname, 'dist');
	logger.info('Copying build artifacts to destination (' + targetFolder + ')');
	try{
		// check that our assets folder exists!
		if(!fs.existsSync(sourcePath)) {
			const msg = 'Failed to locate build artifact `dist` folder';
			logger.error(msg);
			throw msg;
		}
	} catch(err) {
		logger.error(err);
		throw err;
	}

	// Copy the dist folder contents to the destination target
	fs.copySync(sourcePath, targetFolder, {overwrite: true}, (err) => {
		if(err) {
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

/*
  Internal function to create and prepare the destination folder,
  and modify the assets contained within to match with the settings
  stored in the .env file
*/
function _prepareTargetFolder(exeType: string, force: boolean) {

	logger.info('Preparing destination behavior pack folder (' + exeType + ')');

	const extensionName = envHelpers.getExtensionName();
	const targetFolder = envHelpers.getBehaviorPackFolder(exeType);
	if(!targetFolder) {
		throw 'Unable to resolve target behavior pack folder';
	}

	// Check that the behavior pack folder exists
	try {
		if (!fs.existsSync(targetFolder)) {
			logger.info('Creating behavior pack folder [' + targetFolder + ']');
			fs.mkdirSync(targetFolder);
		}
		else {
			// Behavior Pack folder exists - no need to carry on unless we're
			// forced to
			if( !force ) {
				logger.info('Behavior Pack exists - skipping prepare step');
				return;
			}
			logger.info('Forcing Behavior Pack prepare step');
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