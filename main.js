const {app, Menu, Tray, BrowserWindow, ipcMain, dialog, shell} = require('electron');
const fs = require('fs');
const path = require('path');
const dal = require('./custom_modules/dal');
const auth = require('./auth');
const setting = require('./settings');
const word = require('./custom_modules/word');
const util = require('./custom_modules/util');

//local pathing  
const imgPath = `${process.env.USERPROFILE}\\Documents\\Data\\image`;
const documentPath = `${process.env.USERPROFILE}\\Documents\\Data`;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let tray = null;


function createWindow() {
    // Create the browser window.
    win = new BrowserWindow(setting.window);
    // and load the index.html of the app.
    win.loadURL(`file://${__dirname}/dashboard.html`);

    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    });

    //tray menu
    tray = new Tray(`${__dirname}/asset/icon.png`);
    tray.setToolTip('Meal Planner XL');
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Maximize', type: 'normal', click: () => { win.maximize(); } },
        { label: 'Minimize', type: 'normal', click: () => { win.minimize(); } },
        {
            label: 'Meals', type: 'normal', click: () => {
                //this opens up users document folder, where
                //program save diet .docx files
                shell.showItemInFolder(`${app.getPath('documents')}\\test.text`);
            }
        },
        { label: '', type: 'separator', click: () => { win.minimize(); } },
        { label: 'Quit', type: 'normal', click: () => { app.quit(); } },
        { label: 'Tools', type: 'normal', click: () => { win.webContents.openDevTools(); } },
        {
            label: 'Setup', type: 'normal', click: () => {
                let filePath = `${__dirname}/partial/setup.html`;
                fs.readFile(filePath, 'utf8', function (err, data) {
                    win.webContents.send('reply', data);
                });
            }
        }
    ]);
    tray.setContextMenu(contextMenu);
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
ipcMain.on('login', (event, args) => {
    dal.getAdminPromise(args)
        .then(values => {
            let filePath = `${__dirname}/partial/dashboard.html`;
            var partial = fs.readFileSync(filePath, 'utf8');
            win.webContents.send('reply', partial);
        })
        .catch(err => {
            tray.displayBalloon({
                title: 'Error',
                content: err.message
            });
            //dialog.showErrorBox('Error', err.message);
        });
});
//These calls are from controls 
//located on pages
ipcMain.on('navigate', (event, args) => {
    let filePath = `${__dirname}/partial/${args}.html`;
    fs.readFile(filePath, 'utf8', function (err, data) {
        win.webContents.send('reply', data);
    });
});
//window functions 
ipcMain.on('close', (event, args) => {
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
    let filePath = `${__dirname}/partial/${args.body}.html`;
    fs.readFile(filePath, 'utf8', function (err, data) {
        var partialReturn = {
            body: data,
            title: args.title,
            values: args.values
        };
        win.webContents.send('modal-window-reply', partialReturn);
    });
});

ipcMain.on('show-ballon', (event, trayOptions) => {
    tray.displayBalloon(trayOptions);
});



//admin page
ipcMain.on('add-food', (event, args) => {
    dal.insertFoodPromise(args)
        .then(values => {
            tray.displayBalloon({
                title: 'Success',
                content: 'Item has been saved'
            });
        })
        .catch(err => {
            tray.displayBalloon({
                title: 'Error',
                content: err.message
            });
        });
});
ipcMain.on('program-reset', (event, args) => {
    let img = util.deleteDir(imgPath);
    let data = util.deleteDir(documentPath);
    Promise.all([img, data])
        .then((value) => {
            app.relaunch();
            app.exit(0);
        })
        .catch(err => { });
});
//these calls are to query the settings DB
ipcMain.on('find-setting', (event, args) => {

    dal.getSettingPromise(args)
        .then(values => {
            var callBack = (args === 'Require Login') ? 'startpage-return-setting' : 'return-setting';
            if (values) {
                win.webContents.send(callBack, values);
            } else {
                //default value
                win.webContents.send(callBack, { label: args, value: null });
            }
        })
        .catch(err => {
            dialog.showErrorBox('Error', err.message);
        });

    dal.getSettingsPromise('css rule')
        .then(values => {
            win.webContents.send('return-css', values);
        })
        .catch(err => {
            dialog.showErrorBox('Error', err.message);
        });
});
//update or insert a new setting
ipcMain.on('update-setting', (event, args) => {
    dal.updateSettingPromise(args)
        .then((setting => {
            win.webContents.send('return-setting', setting);
        }))
        .catch((err) => {
            tray.displayBalloon({ title: 'Error', content: err.message });
        });
});
//searches by food that contains char in args
ipcMain.on('autocomplete-food-search', (event, args) => {
    dal.getFoodByDescriptionPromise(args)
        .then(values => {
            win.webContents.send('food-search-result', values);
        })
        .catch(err => {
            dialog.showErrorBox('Error', err.message);
        });
});
//returns one food item based on ID
ipcMain.on('food-search-byId', (event, args) => {
    dal.getFoodByIdPromise(args)
        .then(values => {
            win.webContents.send('food-search-byId-result', values);
        })
        .catch(err => {
            dialog.showErrorBox('Error', err.message);
        });
});


//client page
ipcMain.on('profile-image-save', (event, args) => {
    util.openDialogPromise(args)
        .then(dialogReturn => {
            //get image pathing
            let newDir = `${imgPath}\\${dialogReturn.client._id}`;
            let name = path.basename(dialogReturn.image);
            let dest = `${newDir}${path.sep}${name}`;
            //move image over to our folders
            util.copyFilePromise(dialogReturn.image, dest)
                .then(value => {
                    win.webContents.send('image-save-reply', value);
                })
                .catch(value => {
                    dialog.showErrorBox("File Save Error", value.message);
                });
        })
        .catch(err => {
            dialog.showErrorBox("File Save Error", err.message);
        });
});
ipcMain.on('add-client', (event, client) => {
    if (client.profileImage === "") {
        //put in default image 
        client.profileImage = `${__dirname}\\asset\\avatar.png`;
    }

    dal.insertClientPromise(client)
        .then(values => {
            fs.mkdir(`${imgPath}\\${values._id}`, () => {
                win.webContents.send('client-add-reply', { isError: false, item: values });
            });
        })
        .catch(err => {
            dialog.showErrorBox("Client Save Error", err.message);
        });
});
ipcMain.on('update-client', (event, client) => {
    if (client.profileImage === "") {
        //put in default image 
        client.profileImage = `${__dirname}\\asset\\avatar.png`;
    }
    dal.updateClientPromise(client)
        .then(values => {
            win.webContents.send('client-update-reply', {
                isError: false,
                message: 'Item updated successfully',
                client: values
            });
        })
        .catch(err => {
            dialog.showErrorBox("Client Save Error", err.message);
        });
});
ipcMain.on('all-client', (event, args) => {
    dal.getClientsPromise()
        .then(values => {
            let rtrn = {
                length: values.length,
                clients: values,
                isError: false
            };
            win.webContents.send('client-all-reply', rtrn);
        })
        .catch(err => {
            let rtrn = {
                message: err.message,
                isError: true
            };
            dialog.showErrorBox("File Save Error", rtrn);
        });
});
ipcMain.on('generate-client-rows', (event, args) => {
    //get template to workwith
    let filePath = `${__dirname}/template/client.html`;
    var template = fs.readFileSync(filePath, 'utf8');

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
            rtrn.html = rtrn.html.replace('${' + propertyName + '}', client[propertyName]);
        }
        win.webContents.send('client-rows-reply', rtrn);
    }
});
ipcMain.on('delete-client', (event, args) => {
    let clientId = args._id;
    let client = dal.deleteClientPromise(clientId);
    let meal = dal.deleteMealPromise(clientId);
    let progress = dal.deleteProgress(clientId);
    let dir = util.deleteDir(`${imgPath}\\${clientId}`);

    Promise.all([client, meal, progress, dir])
        .then(value => {
            win.webContents.send('client-delete-reply', { isError: false, message: 'Client has been deleted' });
        })
        .catch(err => {
            win.webContents.send('client-delete-reply', { isError: true, message: err.message });
        });
});

//meal plan
ipcMain.on('add-meal', (event, args) => {
    //remove any current diet 
    let deleteMeal = dal.deleteMealPromise(args.client);
    deleteMeal.then(values => {
        let insertMeal = dal.insertMealPromise(args)
        insertMeal.then(values => {
            //call show message
            dialog.showMessageBox({
                title: 'Options',
                message: 'Meal plan has been successfully saved',
                buttons: ['Create Word document', 'Close']
            }, ((dialogOption) => {
                if (dialogOption === 0) {
                    let mealPlan = values;
                    let clientPromise = dal.getClientPromise(mealPlan.client);
                    let mealPromise = dal.getMealPlanPromise(mealPlan.client);
                    Promise.all([clientPromise, mealPromise])
                        .then(values => {
                            let clientData = {
                                client: values[0],
                                mealPlan: values[1]
                            }
                            let mealPlanTemplate = `${documentPath}\\MealTemplate.docx`;
                            let saveLocation = `${app.getPath('documents')}\\${clientData.client.firstName}_${clientData.client.lastName}.docx`;
                            let wordSave = word.saveMealAsDocx(clientData, mealPlanTemplate, saveLocation);
                            wordSave.then(fileLocation => {
                                shell.openItem(fileLocation)
                            });
                        })
                        .catch(reason => {
                            dialog.showErrorBox("File Save Error", reason);
                        });
                }
            }).bind(values));
        })
        insertMeal.catch(err => {
            dialog.showErrorBox("File Save Error", err);
        });
    })
    deleteMeal.catch(err => {
        dialog.showErrorBox('Error', err.message);
    });
});
ipcMain.on('find-meal', (event, args) => {
    dal.getMealPlanPromise(args._id)
        .then(values => {
            win.webContents.send('meal-find-reply', { isError: false, meal: values });
        })
        .catch(err => {
            dialog.showErrorBox("File Save Error", err.message);
        });
});

//progress/image page
ipcMain.on('dialog-open', (event, args) => {
    util.openDialogAllowMultiplePromise(args)
        .then(dialogReturn => {
            var image = dialogReturn.image.join(';');
            win.webContents.send('dialog-open-reply', image);
        })
        .catch(err => {
            dialog.showErrorBox("File Save Error", err.message);
        });
});

ipcMain.on('progress-image-save', (event, args) => {
    var d = new Date(args.info.imageDate);
    var newDir = `${imgPath}\\${args.client._id}\\${d.getMonth() + 1}_${d.getDate()}_${d.getFullYear()}`;
    //make a directory for new images
    util.createDir(newDir)
        .then(value => {
            let files = args.info.images.split(';');
            let promises = [];
            for (var x = 0; x < files.length; x++) {
                let src = files[x] || `${__dirname}\\asset\\avatar.png`;
                let name = path.basename(src);
                let dest = `${newDir}${path.sep}${name}`;
                var prom = util.copyFilePromise(src, dest);
                promises.push(prom);
            }
            Promise.all(promises)
                .then(values => {
                    var saveData = args.info;
                    saveData.clientId = args.client._id;
                    saveData.images = args.info.images = values.join(';');

                    dal.insertImagePromise(saveData)
                        .then(value => {
                            win.webContents.send('progress-add-reply', { isError: false, item: value });
                        })
                        .catch(err => {
                            dialog.showErrorBox("Save Error", err.message);
                        });
                }).catch(err => {
                    dialog.showErrorBox("Save Error", err.message);
                });
        }).catch(err => {
            dialog.showErrorBox("Save Error", err.message);
        });
});

ipcMain.on('find-progress', (event, args) => {
    dal.getProgressPromise(args.id)
        .then(values => {
            win.webContents.send('find-progress-reply', { isError: false, progress: values });
        })
        .catch(err => {
            dialog.showErrorBox("File Save Error", err.message);
        });
});

ipcMain.on('generate-client-progress-row', (event, args) => {
    //get template to workwith
    let filePath = `${__dirname}/template/clientImage.html`;
    var template = fs.readFileSync(filePath, 'utf8');

    //create row for each client
    for (var i = 0; i < args.length; i++) {
        var progress = args[i];
        var d = new Date(progress.imageDate);
        progress.formattedDate = `${d.getMonth() + 1}-${d.getUTCDate()}-${d.getFullYear()}`;
        var rtrn = {
            html: template,
            progress: progress,
            images: args[i].images
        };
        //my kickass template engine :)
        for (var propertyName in progress) {
            rtrn.html = rtrn.html.replace('${' + propertyName + '}', progress[propertyName]);
        }
        win.webContents.send('find-progress-row', rtrn);
    }
});


//setup page
ipcMain.on('setup-start', (event, args) => {
    var rtrn = {
        message: "Success"
    };
    var img = util.createDir(imgPath);
    let data = util.createDir(documentPath);

    Promise.all([img, data], value => {
        win.webContents.send('setup-start-reply', rtrn);
    });
});






//   this is where I am testing stuff out!!!!
//   this is where I am testing stuff out!!!!
//   this is where I am testing stuff out!!!!
//   this is where I am testing stuff out!!!!
//   this is where I am testing stuff out!!!!
//   this is where I am testing stuff out!!!!
//   this is where I am testing stuff out!!!!
Array.prototype.safeElement = function (e) {
    if (this.length >= e + 1) {
        return this[e];
    } else {
        return null;
    }
};


// function test() {
//     fs.unlink(`${imgPath}\\test.txt`, (err) => {
//         debugger;
//     });
// }




