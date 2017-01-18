const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const fs = require('fs');
const path = require('path');
const auth = require('./auth');
const setting = require('./settings');
const word = require('./custom_modules/word');
const dal = require('./custom_modules/dal');

//local pathing
const dbPath = `${process.env.USERPROFILE}\\Documents\\Data\\DataBase`;
const imgPath = `${process.env.USERPROFILE}\\Documents\\Data\\image`;
const documentPath = `${process.env.USERPROFILE}\\Documents\\Data`;

//database stuff
const Datastore = require('nedb');
var dbMeal = new Datastore({ filename: `${dbPath}\\meal.db`, autoload: true });
//set dal connections
dal.connections(dbMeal);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

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
    dal.getAdminPromise(args)
        .then(values => {
            let filePath = `${__dirname}/partial/dashboard.html`;
            var partial = fs.readFileSync(filePath, 'utf8');
            win.webContents.send('reply', partial);
        })
        .catch(err => {
            dialog.showErrorBox('Error', 'No User Found!');
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


//admin page
ipcMain.on('add-food', (event, args) => {
    dal.insertFoodPromise(args)
        .then(values => {
            win.webContents.send('meal-add-reply', { isError: false, message: 'Item saved successfully' });
        })
        .catch(err => {
            dialog.showErrorBox('Error', err.message);
        });
});
//these calls are to query the db
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
    var query = { label: args.label };
    var update = { $set: { value: args.updatedValue } };
    var options = { upsert: true };
    var callBack = (err, doc) => {
        // if (!err) {
        //     dialog.showMessageBox({ message: 'Setting has been updated', buttons: ['Create Word document', 'Create PDF', 'Continue', 'Cancel'] }, (e) => {
        //         console.log('User selected: ' + e)
        //         if (e === 0) {

        //         }
        //     });
        // } else {
        //     dialog.showErrorBox("File Save Error", err.message);
        // }
    };
    //runs the actual update
    db.update(query, update, options, callBack);
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
ipcMain.on('image-save', (event, args) => {
    let options = {
        filters: [
            { name: 'Images', extensions: ['jpg', 'png', 'gif'] }
        ]
    }
    //callback for the open dialog window
    let outerCallback = function (filePath) {
        if (filePath && filePath.length > 0) {
            let imgRaw = fs.readFileSync(filePath[0]);
            let fileInfo = {
                ext: path.extname(filePath[0]),
                name: this._id,
                newPath: imgPath,
                img: imgRaw,
                size: imgRaw.length
            };

            //callback for the image save
            let innerCallback = (err) => {
                var rtrn = {
                    error: false,
                    url: '',
                    message: ''
                };
                if (!err) {
                    rtrn.url = `${fileInfo.newPath}\\${fileInfo.name}${fileInfo.ext}`;
                } else {
                    dialog.showErrorBox("File Save Error", err.message);
                    rtrn.error = true;
                    rtrn.message = err.message;
                }
                win.webContents.send('image-save-reply', rtrn);
            }
            fs.writeFile(`${fileInfo.newPath}\\${fileInfo.name}${fileInfo.ext}`, fileInfo.img, (innerCallback).bind(fileInfo));
        }
    }

    dialog.showOpenDialog(null, options, (outerCallback).bind(args));
});
ipcMain.on('add-client', (event, client) => {
    if (client.profileImage === "") {
        //put in default image 
        client.profileImage = `${process.env.USERPROFILE}\\Documents\\Data\\Image\\holder.png`
    }

    dal.insertClientPromise(client)
        .then(values => {
            win.webContents.send('client-add-reply', { isError: false, item: values });
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
    let imgPath = process.env.ProgramData; + '/image';
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
    dal.deleteMealPromise(args.client)
        .then(values => {
            dal.insertMealPromise(args)
                .then(values => {

                    let callBack = (e) => {
                        if (e === 0) {
                            let mealPlan = values;
                            let clientPromise = dal.getClientPromise(mealPlan.client);
                            let mealPromise = dal.getMealPlanPromise(dbMeal, mealPlan.client);
                            Promise.all([clientPromise, mealPromise])
                                .then(values => {
                                    let mealPlanTemplate = `${documentPath}\\MealTemplate.docx`;
                                    let saveLocation = `${app.getPath('documents')}\\test.docx`;
                                    let clientData = {
                                        client: values[0],
                                        mealPlan: values[1]
                                    }
                                    word.saveMealAsDocx(clientData, mealPlanTemplate, saveLocation);
                                })
                                .catch(reason => {
                                    dialog.showErrorBox("File Save Error", reason);
                                });
                        }
                    };
                    //call show message
                    dialog.showMessageBox({
                        title: 'Options',
                        message: 'Meal plan has been successfully saved',
                        buttons: ['Create Word document', 'Create PDF', 'Close']
                    }, (callBack).bind(values));
                })
                .catch(err => {
                    dialog.showErrorBox("File Save Error", err);
                });
        })
        .catch(err => {
            dialog.showErrorBox('Error', err.message);
        });


    //add the new diet
    // dbMeal.insert(args, function (err, doc) {
    //     if (!err) {
    //         //callback for show message
    //         let callBack = (e) => {
    //             //doc is passed into the callback 
    //             let mealPlan = doc;
    //             switch (e) {
    //                 case 0:
    //                     try {
    //                         let clientPromise = dal.getClientPromise(mealPlan.client);
    //                         let mealPromise = dal.getMealPlanPromise(dbMeal, mealPlan.client);
    //                         Promise.all([clientPromise, mealPromise])
    //                             .then(values => {
    //                                 let mealPlanTemplate = `${documentPath}\\MealTemplate.docx`;
    //                                 let saveLocation = `${app.getPath('documents')}\\test.docx`;
    //                                 let clientData = {
    //                                     client: values[0],
    //                                     mealPlan: values[1]
    //                                 }
    //                                 word.saveMealAsDocx(clientData, mealPlanTemplate, saveLocation);
    //                             })
    //                             .catch(reason => {
    //                                 dialog.showErrorBox("File Save Error", reason);
    //                             });
    //                     } catch (e) {
    //                         dialog.showErrorBox("File Save Error", e.message);
    //                     }
    //                     break;
    //                 case 1:
    //                     console.log('Create PDF');
    //                     break;
    //                 case 2:
    //                     console.log('Continue');
    //                     break;
    //                 default:
    //                     console.log('Default');
    //                     break;
    //             }
    //         }
    //         //call show message
    //         dialog.showMessageBox({
    //             title: 'Options',
    //             message: 'Meal plan has been successfully saved',
    //             buttons: ['Create Word document', 'Create PDF', 'Close']
    //         }, (callBack).bind(doc));

    //     } else {
    //         dialog.showErrorBox("File Save Error", err.message);
    //     }
    // });
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






//   this is where I am testing stuff out!!!!
//   this is where I am testing stuff out!!!!
//   this is where I am testing stuff out!!!!
//   this is where I am testing stuff out!!!!
//   this is where I am testing stuff out!!!!
//   this is where I am testing stuff out!!!!
//   this is where I am testing stuff out!!!!






