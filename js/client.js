
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
        let isValid = clientValidation.password();
        if (isValid) {
            ipcRenderer.send('add-client', data);
        } else {
            ipcRenderer.send('show-ballon', {
                title: 'Error',
                content: 'Password is required'
            });
        }
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

        let isValid = clientValidation.password();
        if (isValid) {
            ipcRenderer.send('update-client', data);
        } else {
            ipcRenderer.send('show-ballon', {
                title: 'Error',
                content: 'Password is Required'
            });
        }
    },
    meal: (e) => {
        var selectedClient = e.data;
        utilities.setCurrentClient(selectedClient);
        ipcRenderer.send('navigate', 'meal');
    },
    images: (e) => {
        var selectedClient = e.data;
        utilities.setCurrentClient(selectedClient);
        ipcRenderer.send('navigate', 'image');
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
        ipcRenderer.send('profile-image-save', client);
    },
    delete: (e) => {
        var selectedClient = e.data;
        ipcRenderer.send('delete-client', selectedClient);
    }
};

var clientValidation = {
    password: () => {
        let cbAdmin = document.getElementById('cbIsAdmin');
        let isAdmin = (cbAdmin.value === 'true');
        if (!isAdmin)
            return true;

        let password = document.getElementById('txtPassword');
        let confirm = document.getElementById('txtConfirm');
        //password and confirm is required and must match
        let length = password.value.length + confirm.value.length;
        return (length > 0 && password.value === confirm.value)
    }
}

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
ipcRenderer.removeAllListeners('client-delete-reply');
ipcRenderer.on('client-delete-reply', (event, arg) => {
    if (arg.isError) {
        var messageOptions = {
            body: 'Client has been deleted',
            title: 'Warning'
        };
        utilities.notify(messageOptions);
    } else {
        //remove all rows from table
        let tbl = $('#tblClient tbody');
        tbl.find('tr').remove();
        ipcRenderer.send('all-client', {});
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
        row.find('.clientImage').click(arg.client, clientClick.images);
        row.find('.clientDelete').click(arg.client, clientClick.delete);
        row.hide().appendTo(tbl).fadeIn(1000);
    }
});
//image save
ipcRenderer.removeAllListeners('image-save-reply');
ipcRenderer.on('image-save-reply', (event, arg) => {
    if (arg.isError) {
        utilities.notify(arg.message);
    } else {
        $('#txtProfileImgUrl').val(arg);
    }
});

