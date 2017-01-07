
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
        debugger;
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
    }
};
//Methods that pertain to the table on Clients page
var grid = {
    row: (val) => {
        //create row 
        let row = $('<tr>').append(
            grid.actions(val),
            $('<td>').text(val.firstName),
            $('<td>').text(val.lastName),
            $('<td>').text(val.email),
            $('<td>').text(val.phone),
            $('<td>').text(val.comment));
        row.attr('id', val.id);

        return row;
    },
    actions: (client) => {
        //make actions column
        let container = $('<div>').addClass('btn-group');
        let td = $('<td>');
        //create action buttons
        let select = $('<button>')
            .addClass('btn btn-xs btn-default')
            .text('Select')
            .click(client, clientClick.select);
        let edit = $('<button>')
            .addClass('btn btn-xs btn-info')
            .text('Edit')
            .click(client, clientClick.edit);
        let active = $('<button>')
            .addClass('btn btn-xs btn-danger')
            .text('Delete')
            .click(client, clientClick.delete);
        //add buttons to column
        container.append(select);
        container.append(edit);
        container.append(active);
        td.append(container);
        return td;
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
        //send edit command 
        $('#txtClientfName').val(client.firstName);
        $('#txtClientlName').val(client.lastName);
        $('#txtClientEmail').val(client.email);
        $('#txtClientPhone').val(client.phone);
        $('#txtUserPopComment').val(client.comment);
        //address
        $('#txtClientAddress').val(client.address);
        $('#txtClientlCity').val(client.city);
        $('#cbClientState').val(client.state);
        $('#txtClientPostal').val(client.postalCode);
        //image
        $('#txtProfileImgUrl').val(client.profileImage);
        //click event
        $('#btnSubmitClient').off('click').click(arg, clientClick.editClientItem);
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
        var messageOptions = {
            body: 'Client has been updated',
            title: 'Success!'
        };
        utilities.notify(messageOptions);

        var clientTable = $('#tblClient > tbody');
        var row = $('#' + arg.client.id);          //outdated row  
        row.fadeOut('fast', function () {
            var updatedRow = grid.row(arg.client); //new udpated row
            $(this).after(updatedRow).remove();    //remove old row, and replace with new!
        });
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

