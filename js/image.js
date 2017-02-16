$(document).ready(() => {
    $('#btnAddImage').click(imageEvent.modal);
    $('.browse-back').off('click').click(imageEvent.back);
    imageEvent.load();
});

var imageEvent = {
    modal: function () {
        var loc = $(this).data('location');
        var title = $(this).data('title');
        ipcRenderer.send('modal-window', { body: loc, title: title });
    },
    dialog: () => {
        ipcRenderer.send('dialog-open', {});
    },
    submit: (e) => {
        e.preventDefault();
        let client = utilities.currentClient();
        if (client) {
            var data = {
                client: client,
                info: {
                    clientId: client.id
                }
            };
            var form = $("#formAddClientImage :input").serializeArray();
            for (var index = 0; index < form.length; index++) {
                var element = form[index];
                data.info[element.name] = element.value;
            }

            ipcRenderer.send('progress-image-save', data);
        }
    },
    load: () => {
        //check for a selected client to load saved meal
        let client = utilities.currentClient();
        if (client.id) {
            ipcRenderer.send('find-progress', { id: client.id });
        }
    },
    back: () => {
        ipcRenderer.send('navigate', 'client');
    }
}

// Listen for async-reply message from main process
ipcRenderer.removeAllListeners('dialog-open-reply');
ipcRenderer.on('dialog-open-reply', (event, arg) => {
    $('#txtImgUrl').val(`${arg.first};${arg.second};${arg.third}`);
});

ipcRenderer.removeAllListeners('progress-add-reply');
ipcRenderer.on('progress-add-reply', (event, arg) => {
    imageEvent.load();
});

ipcRenderer.removeAllListeners('find-progress-reply');
ipcRenderer.on('find-progress-reply', (event, arg) => {
    if (arg && arg.progress.length > 0) {
        $('.table-scroll').empty()
        ipcRenderer.send('generate-client-progress-row', arg.progress);
    }
});

ipcRenderer.removeAllListeners('find-progress-row');
ipcRenderer.on('find-progress-row', (event, arg) => {
    if (arg.isError) {
        utilities.notify(arg.message);
    } else {
        let tbl = $('.table-scroll');
        let row = $(arg.html);
        let placeHolders = row.find('.template-item');

        for (var index = 0; index < arg.images.length; index++) {
            let image = arg.images[index];
            let placeHolder = $(placeHolders[index]);
            if (image && image != 'null') {
                placeHolder.empty();
                let img = $('<img>');
                img.attr('src', image);
                img.appendTo(placeHolder);
            }
        }
        row.hide().appendTo(tbl).fadeIn(1000);
    }
});

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
    $('#btnAddImg').click(imageEvent.dialog);
    $('#btnSubmitImage').click(imageEvent.submit);
    //get seperate date values
    var today = new Date();
    var day = today.getDate();
    var year = today.getFullYear();
    var month = today.getMonth() + 1;
    //get the string value
    var sDay = day < 10 ? `0${day}` : day.toString();
    var sMon = month < 10 ? `0${month}` : month.toString();

    $('#txtimageDate').val(`${year}-${sMon}-${sDay}`);
});