const {app, BrowserWindow, ipcMain} = require('electron');
const auth = require('./auth');
const setting = require('./settings');
const fs = require('fs');
const path = `${__dirname}/`;

//database stuff
var Datastore = require('nedb');
var db = new Datastore({ filename: __dirname + '/setting.db', autoload: true });
var dbAdmin = new Datastore({ filename: __dirname + '/admin.db', autoload: true });

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

ipcMain.on('meal-window', (event, args) => {
    var partial = fs.readFileSync(path + '/partial/' + args + '.html', 'utf8');
    win.webContents.send('meal-window-reply', partial);
});
//these calls are to query the db
ipcMain.on('setting', (event, args) => {
    db.findOne({ label: args }, function (err, doc) {
        win.webContents.send('setting', doc);
    });
});

