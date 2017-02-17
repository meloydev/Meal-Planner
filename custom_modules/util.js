const {dialog} = require('electron');
const fs = require('fs-extra');

exports.openDialogPromise = (client) => {
    return new Promise((res, rej) => {
        let options = {
            filters: [
                { name: 'Images', extensions: ['jpg', 'png', 'gif'] }
            ]
        }
        dialog.showOpenDialog(null, options, function (filePath) {
            if (filePath && filePath.length > 0) {
                res({ image: filePath[0], client: client });
            } else {
                rej({ isError: true, message: 'No file selected' });
            }
        });
    });
}

exports.openDialogAllowMultiplePromise = () => {
    return new Promise((res, rej) => {
        let options = {
            properties: ['multiSelections']
            ,
            filters: [
                { name: 'Images', extensions: ['jpg', 'png', 'gif'] }
            ]
        }
        dialog.showOpenDialog(null, options, function (filePath) {
            if (filePath && filePath.length > 0) {
                res({ image: filePath });
            } else {
                rej({ isError: true, message: 'No file selected' });
            }
        });
    });
}

exports.saveImagePromise = (writeTo, imgRaw) => {
    return new Promise((res, rej) => {
        fs.writeFile(writeTo, imgRaw, (err) => {
            if (err) {
                rej({ message: err.message });
            } else {
                res(writeTo);
            }
        });
    });
}

exports.readFilePromise = (filePath) => {
    return new Promise((res, rej) => {
        fs.readFile(filePath, (err, data) => {
            if (err) {
                rej(err);
            } else {
                res(data);
            }
        });
    });
}

exports.mkmDirPromise = (filePath) => {
    return new Promise((res, rej) => {
        fs.mkdir(filePath, (err, data) => {
            if (err) {
                rej(err);
            } else {
                res(data);
            }
        });
    });
}

//uses fs-extra
exports.copyFilePromise = (src, dest) => {
    return new Promise((res, rej) => {
        fs.copy(src, dest, (err) => {
            if (err)
                rej(err);

            res(dest);
        });
    });
}

exports.deleteDir = (directory) => {
    return new Promise((res, rej) => {
        fs.remove(directory, (err) => {
            if (err)
                rej(err);

            res(directory);
        });
    });
}

exports.createDir = (directory) => {
    return new Promise((res, rej) => {
        fs.ensureDir(directory, (err) => {
            if (err)
                rej(err);

            res(directory);
        });
    });
}

