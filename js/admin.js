// admin.js

$(document).ready(function () {
    $('#formAdd').off('submit').on('submit', submit.newFoodItem);
    $('#ddlReqLogin').off('change').on('change', adminChange.reqLogin);
    //change background color
    var primaryColor = document.getElementById('colorPicker');
    primaryColor.onchange = adminChange.color;
    //get defaults
    ipcRenderer.send('find-setting', 'Require Login');
    ipcRenderer.send('find-setting', 'css rule');
});

var adminChange = {
    reqLogin: function () {
        var dflt = false;
        try {
            var val = this.selectedOptions[0].value;
            dflt = (val == 'true');
        } catch (e) {
            console.info('admin.js ' + e.message);
        }

        var data = {
            label: 'Require Login',
            updatedValue: dflt
        };
        ipcRenderer.send('update-setting', data);
    },
    color: (ev) => {
        document.documentElement.style.setProperty('--primary-color', ev.target.value);
        var newValue = {
            label: 'css rule',
            updatedValue: {
                property: '--primary-color',
                value: ev.target.value
            }
        }
        ipcRenderer.send('update-setting', newValue);
    }
}

var submit = {
    newFoodItem: function (e) {
        //prevent form submitting 
        e.preventDefault();
        var form = $("#formAdd :input").serializeArray();
        var data = {};
        for (var index = 0; index < form.length; index++) {
            var element = form[index];
            data[element.name] = element.value;
        }
        //send to server
        ipcRenderer.send('add-food', data);
    }
};
ipcRenderer.removeAllListeners('return-setting');
ipcRenderer.on('return-setting', (event, arg) => {
    if (arg && arg.label === 'Require Login') {
        $('#ddlReqLogin').val(arg.value.toString());
    }
    if (arg && arg.label === 'css rule') {
        let cssRules = arg.value;
        var primaryColor = document.getElementById('colorPicker');
        primaryColor.value = cssRules.value;
    }
});

