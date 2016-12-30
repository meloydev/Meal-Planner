const {app, BrowserWindow, ipcMain} = require('electron');
const auth = require('./auth');
const setting = require('./settings');
const fs = require('fs');
const dbPath = process.env.HOMEPATH + '/Documents/Data';
const path = `${__dirname}/`;

//database stuff
var Datastore = require('nedb');
var db = new Datastore({ filename: dbPath + '/setting.db', autoload: true });
var dbAdmin = new Datastore({ filename: dbPath + '/admin.db', autoload: true });
var dbFood = new Datastore({ filename: dbPath + '/food.db', autoload: true });
var dbClient = new Datastore({ filename: dbPath + '/client.db', autoload: true });

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
    var partial = fs.readFileSync(path + '/partial/' + args + '.html', 'utf8');
    win.webContents.send('reply', partial);
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
    var partial = fs.readFileSync(path + '/partial/' + args.body + '.html', 'utf8');
    var partialReturn = {
        body: partial,
        title: args.title,
        values: args.values
    };
    win.webContents.send('modal-window-reply', partialReturn);
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
    dbClient.insert(args, function (err, doc) {
        var rtrn = {};
        if (!err) {
            console.log('Inserted', doc.firstName, 'with ID', doc._id);
            rtrn = { isError: false, item: doc };
        } else {
            rtrn = { isError: true, message: err };
        }
        win.webContents.send('client-add-reply', rtrn);
    });
});
ipcMain.on('update-client', (event, args) => {
    var newValues = {
        comment: args.comment,
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        phone: args.phone,
    };
    dbClient.update(
        { _id: args.id },
        newValues,
        function (err, numReplaced) {
            var rtrn = {};
            if (!err) {
                rtrn = { isError: false, message: 'Item updated successfully', client: args };
            } else {
                rtrn = { isError: true, message: err };
            }

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




