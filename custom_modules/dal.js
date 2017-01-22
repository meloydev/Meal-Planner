const dbPath = `${process.env.USERPROFILE}\\Documents\\Data\\DataBase`;
const Datastore = require('nedb');
const dbClient = new Datastore({ filename: `${dbPath}\\client.db`, autoload: true });
var dbAdmin = new Datastore({ filename: `${dbPath}\\admin.db`, autoload: true });
var dbSetting = new Datastore({ filename: `${dbPath}\\setting.db`, autoload: true });
var dbFood = new Datastore({ filename: `${dbPath}\\food.db`, autoload: true });
var dbMeal = new Datastore({ filename: `${dbPath}\\meal.db`, autoload: true });


//Admin methods
exports.getAdminPromise = (args) => {
    return new Promise((res, rej) => {
        dbAdmin.findOne({ userName: args.userName }, function (err, user) {
            if (user !== null && user.userName === args.userName &&
                user.passWord === args.passWord) {
                res(true);
            } else {
                rej(false);
            }
        });
    })
}
//Client methods
exports.getClientPromise = (clientId) => {
    return new Promise((res, rej) => {
        dbClient.findOne({ _id: clientId }, (err, data) => {
            if (err) {
                rej(err);
            }
            else {
                res(data);
            }
        });
    });
}

exports.getMealPlanPromise = (clientId) => {
    return new Promise((res, rej) => {
        dbMeal.findOne({ client: clientId }, (err, data) => {
            if (err) {
                rej(err);
            }
            else {
                res(data);
            }
        });
    });
}

exports.getClientsPromise = () => {
    return new Promise((res, rej) => {
        dbClient.find({}).sort({ lastName: 1, firstName: 1 }).exec(function (err, data) {
            if (err) {
                rej(err);
            }
            else {
                res(data);
            }
        });
    })
}

exports.updateClientPromise = (client) => {
    return new Promise((res, rej) => {
        dbClient.update({ _id: client.id }, client, (err, data) => {
            if (err) {
                rej(err);
            } else {
                res(client);
            }
        });
    });
}

exports.deleteClientPromise = (client) => {
    return new Promise((res, rej) => {
        dbClient.remove({ _id: client }, function (err, data) {
            if (err) {
                rej(err);
            } else {
                res(data);
            }
        });
    })
}

exports.insertClientPromise = (client) => {
    return new Promise((res, rej) => {
        dbClient.insert(client, function (err, data) {
            if (err) {
                rej(err);
            } else {
                res(data);
            }
        });
    })
}

exports.updateSettingPromise = (args) => {
    return new Promise((res, rej) => {
        //query arguments
        var query = { label: args.label };
        var update = { $set: { value: args.updatedValue } };
        var options = { upsert: true };
        //run query
        dbSetting.update(query, update, options, (err, data) => {
            if (err) {
                rej(err);
            } else {
                res(data)
            }
        });
    });
}

exports.getSettingPromise = (args) => {
    return new Promise((res, rej) => {
        dbSetting.findOne({ label: args }, (err, data) => {
            if (err) {
                rej(err);
            } else {
                res(data)
            }
        });
    })
}

exports.getSettingsPromise = (args) => {
    return new Promise((res, rej) => {
        dbSetting.find({ label: args }, (err, data) => {
            if (err) {
                rej(err)
            } else {
                res(data);
            }
        });
    })
}

exports.getFoodByDescriptionPromise = (args) => {
    return new Promise((res, rej) => {
        var re = new RegExp(args, 'i');
        dbFood.find({ name: re }, (err, data) => {
            if (err) {
                rej(err);
            } else {
                res(data);
            }
        });
    })
}

exports.getFoodByIdPromise = (foodId) => {
    return new Promise((res, rej) => {
        dbFood.findOne({ '_id': foodId }, (err, data) => {
            if (err) {
                rej(err);
            } else {
                res(data);
            }
        });
    })
}

exports.insertFoodPromise = (foodItem) => {
    return new Promise((res, rej) => {
        dbFood.insert(foodItem, function (err, data) {
            if (err) {
                rej(err);
            } else {
                res(data);
            }
        });
    });
}

exports.insertMealPromise = (mealPlan) => {
    return new Promise((res, rej) => {
        dbMeal.insert(mealPlan, (err, data) => {
            if (err) {
                rej(err);
            } else {
                res(data);
            }
        });
    })
}

exports.deleteMealPromise = (clientId) => {
    return new Promise((res, rej) => {
        dbMeal.remove({ client: clientId }, { multi: true }, (err, data) => {
            if (err) {
                rej(err);
            } else {
                res(data);
            }
        });
    })
}




