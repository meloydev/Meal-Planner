const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const auth = require('./auth');
const setting = require('./settings');
const fs = require('fs');
const dbPath = process.env.HOMEPATH + '/Documents/Data/DataBase';
const path = `${__dirname}/`;
const extention = require('path');

//this sets pathing app uses later 
//app.setPath('image', extention.join(app.getPath('appData'), 'image'));
//app.setPath('db', extention.join(app.getPath('appData'), 'dataBase'));
//app.setPath('pdf', extention.join(app.getPath('appData'), 'pdf'));

//database stuff
var Datastore = require('nedb');
var db = new Datastore({ filename: dbPath + '/setting.db', autoload: true });
var dbAdmin = new Datastore({ filename: dbPath + '/admin.db', autoload: true });
var dbFood = new Datastore({ filename: dbPath + '/food.db', autoload: true });
var dbClient = new Datastore({ filename: dbPath + '/client.db', autoload: true });
var dbMeal = new Datastore({ filename: dbPath + '/meal.db', autoload: true });

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win



function createWindow() {
    // Create the browser window.
    win = new BrowserWindow(setting.window);
    // and load the index.html of the app.
    win.loadURL(`file://${__dirname}/dashboard.html`)
    // Open the DevTools.
    //win.webContents.openDevTools(); 
    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
})
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.on('login', function (event, args) {
    dbAdmin.findOne({ userName: args.userName }, function (err, user) {
        if (user !== null && user.userName === args.userName &&
            user.passWord === args.passWord) {
            var partial = fs.readFileSync(path + '/partial/dashboard.html', 'utf8');
            win.webContents.send('reply', partial);
        } else {
            //TODO..
        }
    });

});
//These calls are from controls 
//located on pages
ipcMain.on('navigate', (event, args) => {
    let filePath = path + '/partial/' + args + '.html';
    fs.readFile(filePath, 'utf8', function (err, data) {
        win.webContents.send('reply', data);
    });
});
//window functions
ipcMain.on('tool', (event, args) => {
    win.webContents.openDevTools();
});
ipcMain.on('close', function (event, args) {
    win.close();
});
ipcMain.on('min', (event, args) => {
    win.minimize();
});
ipcMain.on('max', (event, args) => {
    var x = win.isMaximized();
    if (win.isMaximized()) {
        win.setSize(400, 400);
    } else {
        win.maximize();
    }
});
ipcMain.on('modal-window', (event, args) => {
    let filePath = path + '/partial/' + args.body + '.html';
    fs.readFile(filePath, 'utf8', function (err, data) {
        var partialReturn = {
            body: data,
            title: args.title,
            values: args.values
        };
        win.webContents.send('modal-window-reply', partialReturn);
    });
});
//admin page
ipcMain.on('add-food', (event, args) => {
    dbFood.insert(args, function (err, doc) {
        var rtrn = {};
        if (!err) {
            console.log('Inserted', doc.name, 'with ID', doc._id);
            rtrn = { isError: false, message: 'Item saved successfully' };
        } else {
            rtrn = { isError: true, message: err };
        }
        win.webContents.send('meal-add-reply', rtrn);
    });
});
//these calls are to query the db
ipcMain.on('find-setting', (event, args) => {
    db.findOne({ label: args }, function (err, doc) {
        win.webContents.send('return-setting', doc);
    });
    //get user defined CSS values
    db.find({ label: 'css rule' }, function (err, doc) {
        win.webContents.send('return-css', doc);
    });
});
//update or insert a new setting
ipcMain.on('update-setting', (event, args) => {
    var query = { label: args.label };
    var update = { $set: { value: args.updatedValue } };
    var options = { upsert: true };
    var callBack = (err, doc) => {
        console.log('Updated setting');
    };
    db.update(query, update, options, callBack);
});
//searches by food that contains char in args
ipcMain.on('autocomplete-food-search', (event, args) => {
    try {
        var re = new RegExp(args, 'i');
        dbFood.find({ name: re }, function (err, doc) {
            win.webContents.send('food-search-result', doc);
        });
    } catch (e) {
        console.log(e.message);
    }
});
//returns one food item based on ID
ipcMain.on('food-search-byId', (event, args) => {
    dbFood.findOne({ '_id': args }, function (err, doc) {
        win.webContents.send('food-search-byId-result', doc);
    });
});
//client page
ipcMain.on('add-client', (event, args) => {
    if (args.profileImage === "") {
        //put in default image 
        args.profileImage = `${process.env.USERPROFILE}\\Documents\\Data\\Image\\holder.png`
    }
    dbClient.insert(args, function (err, doc) {
        var rtrn = {};
        if (!err) {
            rtrn = { isError: false, item: doc };
        } else {
            rtrn = { isError: true, message: err };
        }
        win.webContents.send('client-add-reply', rtrn);
    });
});
ipcMain.on('update-client', (event, args) => {
    if (args.profileImage === "") {
        //put in default image 
        args.profileImage = `${process.env.USERPROFILE}\\Documents\\Data\\Image\\holder.png`
    }
    dbClient.update(
        { _id: args.id },
        args,
        function (err, numReplaced) {
            var rtrn = {};
            if (!err) {
                rtrn = { isError: false, message: 'Item updated successfully', client: args };
            } else {
                rtrn = { isError: true, message: err };
            }
            //send response of update
            win.webContents.send('client-update-reply', rtrn);
        });
});
ipcMain.on('all-client', (event, args) => {
    dbClient.find({}).sort({ lastName: 1, firstName: 1 }).exec(function (err, doc) {
        win.webContents.send('client-all-reply', doc);
    });
});
ipcMain.on('delete-client', (event, args) => {
    dbClient.remove({ _id: args }, function (err, doc) {
        var rtrn = {};
        if (!err) {
            rtrn = { isError: false, id: args };
            win.webContents.send('client-remove-reply', rtrn);
        } else {
            rtrn = { isError: true, message: err.message };
            win.webContents.send('client-remove-reply', rtrn);
        }
    });
});
//meal plan
ipcMain.on('add-meal', (event, args) => {
    //remove any current diet
    dbMeal.remove({ client: args.client }, { multi: true });
    //add the new diet
    dbMeal.insert(args, function (err, doc) {
        var rtrn = {};
        if (!err) {
            rtrn = { isError: false, item: doc };
        } else {
            rtrn = { isError: true, message: err };
        }
        win.webContents.send('meal-add-reply', rtrn);
    });
});

ipcMain.on('find-meal', (event, args) => {
    //remove any current diet
    dbMeal.findOne({ client: args.id }, (err, doc) => {
        rtrn = {};
        if (err) {
            rtrn.isError = true;
            rtrn.message = err.message;
        } else {
            rtrn.isError = false;
            rtrn.meal = doc;
        }
        win.webContents.send('meal-find-reply', rtrn);
    });
});
//client page
ipcMain.on('generate-client-rows', (event, args) => {
    //get template to workwith
    let filePath = path + '/template/client.html';
    var template = fs.readFileSync(filePath, 'utf8');
    let imgPath = process.env.HOMEPATH + '/Documents/Data/image';
    //create row for each client
    for (var i = 0; i < args.length; i++) {
        var client = args[i];
        var rtrn = {
            html: template,
            client: client
        };
        //my kickass template engine :)
        for (var propertyName in client) {
            rtrn.html = rtrn.html.replace('${' + propertyName + '}', client[propertyName]);
        }
        win.webContents.send('client-rows-reply', rtrn);
    }
});





//   this is where I am testing stuff out!!!!
//   this is where I am testing stuff out!!!!
//   this is where I am testing stuff out!!!!
//   this is where I am testing stuff out!!!!
//   this is where I am testing stuff out!!!!
//   this is where I am testing stuff out!!!!
//   this is where I am testing stuff out!!!!








//a little demo on how to use the showOpenDialog
// ipcMain.on('show-save', (event, args) => {
//     var options = {
//         filters: [
//             { name: 'Images', extensions: ['jpg', 'png', 'gif'] }
//         ]
//     }

//     var x = function (filePath) {
//         if (filePath.length > 0) {

//             let i = {
//                 ext: extention.extname(filePath[0]),
//                 name: this.user,
//                 newPath: app.getPath('client-image'),
//                 img: fs.readFileSync(filePath[0])
//             };

//             fs.writeFile(`${i.newPath}/${i.name}${i.ext}`, i.img);
//         }
//     }

//     dialog.showOpenDialog(null, options, (x).bind(args));



// });


//a little demo on how the show message works
// ipcMain.on('show-message', (event, args) => {
//     var options = {
//         type: 'info',
//         title: 'this is the title!',
//         detail: 'a little info here',
//         message: 'you done messed up a a ron!',
//         buttons: ['yes', 'no', 'help']
//     };
//     dialog.showMessageBox(null, options, (response) => {

//     });
// });



