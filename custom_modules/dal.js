const dbPath = `${process.env.USERPROFILE}\\Documents\\Data\\DataBase`;
const Datastore = require('nedb');
const dbClient = new Datastore({ filename: `${dbPath}\\client.db`, autoload: true });
var dbSetting = new Datastore({ filename: `${dbPath}\\setting.db`, autoload: true });
var dbFood = new Datastore({ filename: `${dbPath}\\food.db`, autoload: true });
var dbBaseFood = new Datastore({ filename: `.\\food.db`, autoload: true });
var dbMeal = new Datastore({ filename: `${dbPath}\\meal.db`, autoload: true });
var dbImage = new Datastore({ filename: `${dbPath}\\image.db`, autoload: true });

//Admin methods
exports.getAdminPromise = (args) => {
    return new Promise((res, rej) => {
        dbClient.findOne({ email: args.email }, function (err, user) {
            if (user === null || user.isAdmin === 'false')
                return rej({ found: false, message: 'No User Found' });


            if (user.password !== args.passWord)
                return rej({ found: false, message: 'Incorrect Password' });

            res({ found: true, message: 'User Found' });
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
        dbClient.find({})
            .sort({ lastName: 1, firstName: 1 })
            .exec((err, data) => {
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
    });
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
                res(args.updatedValue);
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
        let one = new Promise((res, resj) => {
            var re = new RegExp(args, 'i');
            dbFood.find({ name: re }, (err, data) => {
                if (err) {
                    rej(err);
                } else {
                    res(data);
                }
            });
        });
        let two = new Promise((res, resj) => {
            var re = new RegExp(args, 'i');
            dbBaseFood.find({ name: re }, (err, data) => {
                if (err) {
                    rej(err);
                } else {
                    res(data);
                }
            });
        });

        Promise.all([one, two])
            .then(value => {
                let ar = [];
                for (var i = 0; i < value.length; i++) {
                    var element = value[i];
                    ar = ar.concat(element);
                }
                res(ar);
            })
            .catch(err => {
                rej(err);
            })

    });
}

exports.getFoodByIdPromise = (foodId) => {
    return new Promise((res, rej) => {
        dbFood.findOne({ '_id': foodId }, (err, data) => {
            if (err) {
                rej(err);
            } else {
                if (data) {
                    res(data);
                } else {
                    //if the user added food does not have the entry, 
                    //use the base foods DB
                    dbBaseFood.findOne({ '_id': foodId }, (err, data) => {
                        if (err) {
                            rej(err);
                        } else {
                            res(data);
                        }
                    });
                }
            }
        });
    })
}

exports.insertFoodPromise = (foodItem) => {
    return new Promise((res, rej) => {
        foodItem.name = foodItem.name.toLowerCase();
        dbFood.update({ name: foodItem.name }, foodItem, { upsert: true }, function (err, data) {
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

exports.valuePromise = (value) => {
    return new Promise((res, rej) => {
        if (value) {
            res(value);
        } else {
            rej();
        }
    });
}

//progress methods
exports.insertImagePromise = (client) => {
    return new Promise((res, rej) => {
        dbImage.insert(client, function (err, data) {
            if (err) {
                rej(err);
            } else {
                res(data);
            }
        });
    });
}

exports.getProgressPromise = (id) => {
    return new Promise((res, rej) => {
        dbImage.find({ clientId: id })
            .sort({ date: 1 })
            .exec((err, data) => {
                if (err) {
                    rej(err);
                }
                else {
                    res(data);
                }
            });
    });
}

exports.deleteProgress = (id) => {
    return new Promise((res, rej) => {
        dbImage.remove({ clientId: id }, function (err, data) {
            if (err) {
                rej(err);
            } else {
                res(data);
            }
        });
    });
}




