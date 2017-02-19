//dashboard.js 
const electron = require('electron');
const {ipcRenderer} = electron;

$(document).ready(function () {
    $('#btnClose').click(dashClick.close);
    $('[data-location]').click(dashClick.navigate);
    //window functions
    $('.fa-wrench').click(dashClick.tool);
    $('.fa-window-minimize').click(dashClick.minimize);
    $('.fa-window-maximize').click(dashClick.maximize);
    $('.fa-window-close-o').click(dashClick.close);
    $('#btnHome').click(dashClick.home);
    //this gets initial partial to display 
    ipcRenderer.send('find-setting', 'Require Login');
    ipcRenderer.send('css-rule', null);
    $('.user-name i').click(utilities.clearCurrentClient);
    $('.browse-back').click(dashClick.back);
})
var utilities = {
    notify: function (messageOptions) {
        // Let's check if the browser supports notifications
        if (!("Notification" in window)) {
            alert(messageOptions.body);
        }
        // Let's check whether notification permissions have already been granted
        else if (Notification.permission === "granted") {
            // If it's okay let's create a notification
            var notification = new Notification(messageOptions.title, messageOptions);
        }
        // Otherwise, we need to ask the user for permission
        else if (Notification.permission !== 'denied') {
            Notification.requestPermission(function (permission) {
                // If the user accepts, let's create a notification
                if (permission === "granted") {
                    new Notification(messageOptions.title, messageOptions);
                }
            });
        }
    },
    //returns something like 1/28/1977
    returnReadableDate: function (date) {
        var startDate = new Date(date);
        var day = ("0" + startDate.getDate()).slice(-2);
        var month = ("0" + (startDate.getMonth() + 1)).slice(-2);
        var nextMonth = ("0" + (startDate.getMonth() + 2)).slice(-2);
        //more readable format
        return (month) + '/' + (day) + '/' + startDate.getFullYear();
    },
    //this is used by input[type=date]
    returnUsableDate: function (date) {
        var startDate = new Date(date);
        var day = ("0" + startDate.getDate()).slice(-2);
        var month = ("0" + (startDate.getMonth() + 1)).slice(-2);
        return startDate.getFullYear() + "-" + (month) + "-" + (day);
    },
    currentClient: () => {
        var client = JSON.parse(localStorage.getItem('SELECTED-CLIENT'));
        if (client) {
            return client;
        } else {
            return {
                id: null,
                firstName: null,
                lastName: null
            };
        }
    },
    labelValue: (elementId) => {
        let el = document.getElementById(elementId);
        let value = el.innerText;
        if (value != 'undefined') {
            return value;
        } else { return 'Error!' }
    },
    setCurrentClient: (e) => {
        localStorage.setItem('SELECTED-CLIENT', JSON.stringify(e));
        var client = $(".user-name");
        client.find('span').html(`${e.firstName} ${e.lastName}`);
        client.show();
    },
    clearCurrentClient: (e) => {
        localStorage.removeItem('SELECTED-CLIENT');
        var client = $(".user-name");
        client.find('span').html('');
        client.hide();
        dashClick.home();
    }
}
var dashClick = {
    navigate: function () {
        var loc = $(this).data('location');
        $('.dashboard-links-container').fadeOut('slow', function () {
            ipcRenderer.send('navigate', loc);
        });
    },
    tool: function () {
        ipcRenderer.send('tool');
    },
    close: function () {
        ipcRenderer.send('close');
    },
    minimize: function () {
        ipcRenderer.send('min');
    },
    maximize: function () {
        ipcRenderer.send('max');
    },
    home: function () {
        ipcRenderer.send('navigate', 'dashboard');
        $('.dashboard-links-container').delay(600).fadeIn('slow');
    }
};

ipcRenderer.removeAllListeners('reply');
ipcRenderer.removeAllListeners('return-setting');
ipcRenderer.removeAllListeners('return-css');

// Listen for async-reply message from main process 
ipcRenderer.on('reply', (event, arg) => {
    var container = $('#mainContent');
    container.fadeOut(300, function () {
        container.empty();
        $(arg).appendTo(container);
        container.fadeIn(300);
    });
});

//this is waiting for a settings value to be returned 
//depending on value determines correct start page
ipcRenderer.on('startpage-return-setting', (event, arg) => {
    //this listener is only needed once.
    ipcRenderer.removeAllListeners('startpage-return-setting');
    switch (arg.value) {
        case null:
            ipcRenderer.send('navigate', 'setup');
            break;
        case true:
            ipcRenderer.send('navigate', 'login');
            break;
        case false:
            ipcRenderer.send('navigate', 'dashboard');
            break;
        default:
            ipcRenderer.send('navigate', 'setup');
            break;
    }
});
//any DB stored values for CSS properties are set here
ipcRenderer.on('return-css', (event, arg) => {
    arg.forEach(function (element) {
        document.documentElement.style.setProperty(element.value.property, element.value.value);
    });
});


