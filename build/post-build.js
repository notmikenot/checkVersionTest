// LIBRARIES
const path = require('path');
const fs = require('fs');
const util = require('util');

// UTILS
const readDir = util.promisify(fs.readdir);
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const deleteFileSync = util.promisify(fs.unlinkSync);
const stat = util.promisify(fs.stat);

// PATHS
const temp = path.join(__dirname, '/../dist/temp');
const target = path.join(__dirname, '/../dist/check-version-test');

console.log('\nEseguo post-build');
if (fs.existsSync(temp)) {
    copyTempFile().then(() => {
        setVersionJSON();
    });
} else {
    console.log('Cartella temp non trovata.')
    setVersionJSON();
}

async function copyTempFile() {
    await readDir(temp).then(tempF => {
        console.log('File presenti nella cartella temp => ', tempF);
        for (let f of tempF) {
            copyFileSync(path.join(temp, f), path.join(target, f)).then(async source => {
                await deleteFileSync(source);
            });
        }
    });
    return true;
}

function setVersionJSON() {
    const versionFilePath = path.join(__dirname + '/../dist/check-version-test/version.json');
    let mainBundleFiles = [];

    // RegExp
    const mainBundleRegexp = /^main.?([a-z0-9]*)?.js$/;

    // Leggo la cartella della build per trovare i file
    readDir(path.join(__dirname, '/../dist/check-version-test'))
        .then(files => {
            files.find(f => {
                if (mainBundleRegexp.test(f)) {
                    console.log('mainBundleFile', f)
                    mainBundleFiles.push(f);
                }
            });
            console.log('mainBundleFiles', mainBundleFiles)
            pushSources(mainBundleFiles, mainBundleRegexp).then((_sources) => {
                console.log('sources', _sources);
                return writeFile(versionFilePath, JSON.stringify(_sources));
            })
        }).catch(err => {
        console.log('Error with post build:', err);
    });
}

async function pushSources(mainBundleFiles, mainBundleRegexp) {
    let _sources = [];
    let mainHash = '';
    if (mainBundleFiles.length > 0) {
        for (let mainBundleFile of mainBundleFiles) {
            await stat(path.join(target, mainBundleFile)).then((fsStat) => {
                const matchHash = mainBundleFile.match(mainBundleRegexp);
                if (matchHash.length > 1 && !!matchHash[1]) {
                    mainHash = matchHash[1];
                }
                let src = {};
                src.hash = mainHash;
                src.date = fsStat.mtime;
                src.version = getVersion(mainHash, fsStat.mtime)
                _sources.push(src)
            });
        }
        return _sources;
    }
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

function getVersion(hash, date) {
    const day = ('' + new Date(date).getDate()).length === 1 ? '0' + new Date(date).getDate() : new Date(date).getDate();
    const month = ('' + (new Date(date).getMonth() + 1)).length === 1 ? '0' + (new Date(date).getMonth() + 1) : (new Date(date).getMonth() + 1);
    return `${day}${month}${new Date(date).getFullYear()}_${('' + hash.substr(1, 5)).toUpperCase()}`;
}
