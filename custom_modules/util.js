const {dialog} = require('electron');
const fs = require('fs');

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