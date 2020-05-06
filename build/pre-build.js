const fs = require('fs');
const path = require('path');
const util = require('util');
const readDir = util.promisify(fs.readdir);
const target = path.join(__dirname, '/../dist/check-version-test');

if (fs.existsSync(target)) {
    _source = path.join(__dirname, '/../dist/temp');

    if (!fs.existsSync(_source)) {
        fs.mkdirSync(_source);
        _source = path.join(__dirname, '/../dist/temp');
    } else {
        console.log('Non creo la cartella temp.');
    }

    readDir(target).then(targetF => {
        console.log('File presenti nella build => ', targetF);
        for (let f of targetF) {
            if (f.substr(-3) === '.js') {
                copyFileSync(path.join(target, f), path.join(_source, f));
            }
        }
    });
    console.log('Cartella tmp con file creata correttamente.');
} else {
    console.log('Nessuna build presente.');
}

function copyFileSync(source, target) {

    let targetFile = target;

    //if target is a directory a new file with the same name will be created
    if (fs.existsSync(target)) {
        if (fs.lstatSync(target).isDirectory()) {
            targetFile = path.join(target, path.basename(source));
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}
