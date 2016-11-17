// const electron = require('electron');
// const {ipcRenderer} = electron;

$(document).ready(function () {
    $('#formAdd').off('submit').on('submit', submit.newFoodItem); 
});

var submit = {
    newFoodItem: function (e) {
        //prevent form submitting 
        e.preventDefault();
        var form = $("#formAdd :input").serializeArray();
        debugger;
        var data = {
            name: form[0].value,
            calories: form[1].value,
            carb: form[2].value,
            fat: form[3].value,
            protein: form[4].value,
            category: form[5].value
        };
        //send to server
        ipcRenderer.send('add-food', data);
    }
};

ipcRenderer.on('meal-add-reply', (event, arg) => { 
     var messageOptions = {
        body: 'Thank you!',
        title: 'Food item added'
    };
    utilities.notify(messageOptions);
});

