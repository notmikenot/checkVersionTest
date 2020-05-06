const path = require('path');
const fs = require('fs');
const util = require('util');
// get application version from package.json
const appVersion = require('../package.json').version;
// promisify core API's
const readDir = util.promisify(fs.readdir);
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const deleteFileSync = util.promisify(fs.unlinkSync);
console.log('\nRunning post-build tasks');

const temp = path.join(__dirname, '/../dist/temp');
const target = path.join(__dirname, '/../dist/check-version-test');
if (fs.existsSync(temp)) {
    readDir(temp).then(tempF => {
        console.log('File presenti nella cartella temp => ', tempF);
        for (let f of tempF) {
            copyFileSync(path.join(temp, f), path.join(target, f)).then(async source => {
                await deleteFileSync(source);
            });
        }
    });
    setVersionJSON();
} else {
    console.log('Cartella temp non trovata.')
    setVersionJSON();
}


function setVersionJSON() {
    // our version.json will be in the dist folder
    const versionFilePath = path.join(__dirname + '/../dist/check-version-test/version.json');
    let mainHash = '';
    let mainBundleFile = '';
    // RegExp to find main.bundle.js, even if it doesn't include a hash in it's name (dev build)
    let mainBundleRegexp = /^main.?([a-z0-9]*)?.js$/;
    // read the dist folder files and find the one we're looking for
    readDir(path.join(__dirname, '/../dist/check-version-test'))
        .then(files => {
            mainBundleFile = files.find(f => mainBundleRegexp.test(f));
            console.log('mainBundleFile', mainBundleFile);
            if (mainBundleFile) {
                let matchHash = mainBundleFile.match(mainBundleRegexp);
                // if it has a hash in it's name, mark it down
                if (matchHash.length > 1 && !!matchHash[1]) {
                    mainHash = matchHash[1];
                }
            }
            console.log(`Writing version and hash to ${versionFilePath}`);
            // write current version and hash into the version.json file
            const src = `{"version": "${appVersion}", "hash": "${mainHash}"}`;
            return writeFile(versionFilePath, src);
        }).then(() => {
        // main bundle file not found, dev build?
        if (!mainBundleFile) {
            return;
        }
        console.log(`Replacing hash in the ${mainBundleFile}`);
        // replace hash placeholder in our main.js file so the code knows it's current hash
        const mainFilepath = path.join(__dirname, '/../dist/check-version-test', mainBundleFile);
        return readFile(mainFilepath, 'utf8')
            .then(mainFileData => {
                const replacedFile = mainFileData.replace('{{POST_BUILD_ENTERS_HASH_HERE}}', mainHash);
                return writeFile(mainFilepath, replacedFile);
            });
    }).catch(err => {
        console.log('Error with post build:', err);
    });
}

async function copyFileSync(source, target) {

    let targetFile = target;

    //if target is a directory a new file with the same name will be created
    if (fs.existsSync(target)) {
        if (fs.lstatSync(target).isDirectory()) {
            targetFile = path.join(target, path.basename(source));
        }
    }

    await fs.writeFileSync(targetFile, fs.readFileSync(source));
    return source;
}
