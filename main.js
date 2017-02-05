const {app, Menu, Tray, BrowserWindow, ipcMain, dialog, shell} = require('electron');
const fs = require('fs');
const path = require('path');
const auth = require('./auth');
const setting = require('./settings');
const word = require('./custom_modules/word');
const dal = require('./custom_modules/dal');
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
    tray = new Tray(`${imgPath}//icon.png`);
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
//these calls are to query the settings DB
ipcMain.on('find-setting', (event, args) => {

    dal.getSettingPromise(args)
        .then(values => {
            win.webContents.send('return-setting', values);
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
            util.readFilePromise(dialogReturn.image)
                .then(imgRaw => {
                    //let imgRaw = fs.readFileSync(dialogReturn.image);
                    let ext = path.extname(dialogReturn.image);
                    let writeTo = `${imgPath}\\Profile\\${dialogReturn.client._id}${ext}`;

                    //saves the new image to disk with 
                    //clients id as filename
                    util.saveImagePromise(writeTo, imgRaw)
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
        })
        .catch(err => {
            dialog.showErrorBox("File Save Error", err.message);
        });
});
ipcMain.on('add-client', (event, client) => {
    if (client.profileImage === "") {
        //put in default image 
        client.profileImage = `${process.env.USERPROFILE}\\Documents\\Data\\Image\\holder.png`
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
        client.profileImage = `${process.env.USERPROFILE}\\Documents\\Data\\Image\\holder.png`
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
            win.webContents.send('client-all-reply', values);
        })
        .catch(err => {
            dialog.showErrorBox("File Save Error", err.message);
        });
});
ipcMain.on('delete-client', (event, args) => {
    dal.deleteClientPromise(args)
        .then(values => {

        })
        .catch(err => {
            dialog.showErrorBox("Client delete Error", err.message);
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
        }
        win.webContents.send('client-rows-reply', rtrn);
    }
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
                buttons: ['Create Word document', 'Create PDF', 'Close']
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
            var image = {
                first: dialogReturn.image.safeElement(0),
                second: dialogReturn.image.safeElement(1),
                third: dialogReturn.image.safeElement(2)
            };
            win.webContents.send('dialog-open-reply', image);
        })
        .catch(err => {
            dialog.showErrorBox("File Save Error", err.message);
        });
});

ipcMain.on('progress-image-save', (event, args) => {
    var d = new Date(args.info.date);
    var newDir = `${imgPath}\\${args.client._id}\\${d.getMonth() + 1}_${d.getDate()}_${d.getFullYear()}`;
    //make a directory for new images
    util.mkmDirPromise(newDir)
        .then(value => {
            let files = args.info.images;
            //get all files
            let promises = [
                util.readFilePromise(files[0]),
                util.readFilePromise(files[1]),
                util.readFilePromise(files[2])
            ];
            //when all promises return
            Promise.all(promises)
                .then(value => {
                    let savePromises = [];
                    for (var i = 0; i < value.length; i++) {
                        let ext = path.extname(args.info.images[i]);

                        args.info.images[i] = `${newDir}\\${i}${ext}`


                        let saveP = util.saveImagePromise(args.info.images[i], value[i]);
                        savePromises.push(saveP);
                    }

                    Promise.all(savePromises)
                        .then(value => {
                            //insert record into DB
                            dal.insertImagePromise(args.info)
                                .then(value => {
                                    win.webContents.send('progress-add-reply', { isError: false, item: value });
                                })
                                .catch(err => {
                                    dialog.showErrorBox("Save Error", err.message);
                                });
                        });
                })
                .catch(err => {
                    dialog.showErrorBox("Save Error", err.message);
                });






        })
        .catch(err => {
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




