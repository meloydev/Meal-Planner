
$(document).ready(function () {
    $('.bottom-right').off('click').click(clientClick.buttonExpand);
    $('#btnAddClient').off('click').click(clientClick.modal);
    ipcRenderer.send('all-client', {});
});
//Click events for the clients page
var clientClick = {
    modal: function () {
        $('.base').toggleClass("base-expand");
        $('.top-left').toggleClass("middle-fix");
        var loc = $(this).data('location');
        var title = $(this).data('title');
        ipcRenderer.send('modal-window', { body: loc, title: title });
    },
    buttonExpand: () => {
        $('.base').toggleClass("base-expand");
        //padding for that middle button
        $('.top-left').toggleClass("middle-fix");
    },
    newClientItem: (e) => {
        //prevent form submitting 
        e.preventDefault();
        var form = $("#formAddClient :input").serializeArray();
        var data = {};
        for (var index = 0; index < form.length; index++) {
            var element = form[index];
            data[element.name] = element.value;
        }
        //send to server
        ipcRenderer.send('add-client', data);
    },
    editClientItem: (e) => {
        e.preventDefault();
        var data = {
            id: e.data.values._id
        };
        var form = $("#formAddClient :input").serializeArray();
        for (var index = 0; index < form.length; index++) {
            var element = form[index];
            data[element.name] = element.value;
        }
        ipcRenderer.send('update-client', data);
    },
    delete: (e) => {
        let client = e.data;
        var c = confirm('This will delete ' + client.firstName + ' ' + client.lastName);
        if (c === true) {
            ipcRenderer.send('delete-client', client.id);
        }
    },
    meal: (e) => {
        var selectedClient = e.data;
        //set client "Session"
        //localStorage.setItem('SELECTED-CLIENT', JSON.stringify(selectedClient));
        utilities.setCurrentClient(selectedClient);
        ipcRenderer.send('navigate', 'meal');
    },
    edit: (e) => {
        ipcRenderer.send('modal-window',
            {
                body: 'clientAdd',
                title: 'Edit Client',
                values: e.data
            });
    },
    image: (e) => {
        let client = e.data;
        ipcRenderer.send('image-save', client);
    }
};

// Listen for async-reply message from main process
ipcRenderer.removeAllListeners('modal-window-reply');
ipcRenderer.on('modal-window-reply', (event, arg) => {
    //modal window on parent page
    var popUp = $('#modal-window');
    //set the title of the modal window
    var title = popUp.find('.modal-dialog').find('.modal-title');
    title.text(arg.title);
    //what is passed back
    var contents = $(arg.body);
    //meat of the modal
    var popupBody = popUp.find('.modal-dialog').find('.modal-body');
    //clean it out
    popupBody.empty();
    //add the body to the modal
    contents.appendTo(popupBody);
    //show modal
    popUp.modal();
    //if we sent back arguments, then it's an update not an add client. 
    if (arg.values) {
        var client = arg.values;

        //set control values based on name property
        for (var propertyName in client) {
            var control = $(`[name='${propertyName}']`);
            if (control) {
                control.val(client[propertyName]);
            }
        }

        //click event
        $('#btnSubmitClient').off('click').click(arg, clientClick.editClientItem);
        $('#btnAddClientImg').click(client, clientClick.image);
    } else {
        //send add command
        $('#btnSubmitClient').off('click').click(clientClick.newClientItem);
        //TODO: adding image to NEW client
        let ma = Math.random() * 100;
        console.info(ma);
        //$('#btnAddClientImg').click(client, clientClick.image);
    }

});
//After clients INSERT has been performed
ipcRenderer.removeAllListeners('client-add-reply');
ipcRenderer.on('client-add-reply', (event, arg) => {
    if (arg.isError) {
        utilities.notify(arg.message);
    } else {
        //clear form
        document.getElementById('formAddClient').reset();
        //remove all rows from table
        let tbl = $('#tblClient tbody');
        tbl.find('tr').remove();
        //get all users again... easier than building a row.
        ipcRenderer.send('all-client', {});
    }
});
//After SELECT all on clients is performed
ipcRenderer.removeAllListeners('client-all-reply');
ipcRenderer.on('client-all-reply', (event, arg) => {
    if (arg.isError) {
        utilities.notify(arg.message);
    } else {
        ipcRenderer.send('generate-client-rows', arg);
    }
});
//After a client has been "Deleted"
ipcRenderer.removeAllListeners('client-remove-reply');
ipcRenderer.on('client-remove-reply', (event, arg) => {
    if (arg.isError) {
        var messageOptions = {
            body: 'Client has been deleted',
            title: 'Warning'
        };
        utilities.notify(messageOptions);
    } else {
        var row = $('#' + arg.id);
        row.fadeOut('normal', function () {
            $(this).remove();
        });
    }
});
//After a client has been "Updated"
ipcRenderer.removeAllListeners('client-update-reply');
ipcRenderer.on('client-update-reply', (event, arg) => {
    if (arg.isError) {
        var messageOptions = {
            body: arg.message,
            title: 'Warning!'
        };
        utilities.notify(messageOptions);
    } else { // no error, notify and change grid data
        //remove all rows from table
        let tbl = $('#tblClient tbody');
        tbl.find('tr').remove();
        //get all users again... easier than building a row.
        ipcRenderer.send('all-client', {});
    }
});
//client-rows-reply
ipcRenderer.removeAllListeners('client-rows-reply');
ipcRenderer.on('client-rows-reply', (event, arg) => {
    if (arg.isError) {
        utilities.notify(arg.message);
    } else {
        let tbl = $('#tblClient tbody');
        let row = $(arg.html);
        //set row actions
        row.find('.clientEdit').click(arg.client, clientClick.edit);
        row.find('.clientMeal').click(arg.client, clientClick.meal);
        row.hide().appendTo(tbl).fadeIn(1000);
    }
});
//image save
ipcRenderer.removeAllListeners('image-save-reply');
ipcRenderer.on('image-save-reply', (event, arg) => {
    if (arg.isError) {
        utilities.notify(arg.message);
    } else {
        $('#txtProfileImgUrl').val(arg.url);
    }
});

