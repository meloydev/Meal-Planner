$(document).ready(function () {
    ipcRenderer.send('setup-start', {});
    $('.admin-yes').click(setupClick.admin);
    $('.admin-no').click(setupClick.noAdmin);
    $('.background-select div').off('click').click(setupClick.color);
    $('.ok-button').off('click').click(setupClick.done);
});

var setupClick = {
    admin: (e) => {
        ipcRenderer.send('modal-window', { body: 'clientAdd', title: 'Admin' });
        var data = {
            label: 'Require Login',
            updatedValue: true
        };
        ipcRenderer.send('update-setting', data);
    },
    noAdmin: (e) => {
        var container = $('.admin-setup').fadeOut('slow', (e, v) => {
            $(this).remove();
            $('.background-setup').fadeIn('slow');
        });
        var data = {
            label: 'Require Login',
            updatedValue: false
        };
        ipcRenderer.send('update-setting', data);
    },
    color: (e) => {
        //prevent form submitting  
        var newBackground = $(e.currentTarget).css('backgroundColor');
        var newValue = {
            label: 'css rule',
            updatedValue: {
                property: '--primary-color',
                value: newBackground
            }
        }
        ipcRenderer.send('update-setting', newValue);
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
    done: (e) => {
        ipcRenderer.send('navigate', 'dashboard');
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

ipcRenderer.removeAllListeners('setup-start-reply');
ipcRenderer.on('setup-start-reply', (event, arg) => {
    if (arg) {
        alert(arg.message);
    } else {
        alert('fail');
    }
});

ipcRenderer.removeAllListeners('return-setting');
ipcRenderer.on('return-setting', (event, arg) => {
    document.documentElement.style.setProperty('--primary-color', arg);
});

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

    $('#btnSubmitClient').off('click').click(setupClick.newClientItem);
    $('#cbIsAdmin').val('true').attr('disabled', 'disabled');
});

ipcRenderer.removeAllListeners('client-add-reply');
ipcRenderer.on('client-add-reply', (event, arg) => {
    if (arg.isError) {

    } else {
        var container = $('.admin-setup').fadeOut('slow', (e, v) => {
            $('#modal-window').modal('hide');
            $(this).remove();
            $('.background-setup').fadeIn('slow');
        });
    }
});
