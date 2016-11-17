const electron = require('electron');
const {ipcRenderer} = electron;

$(document).ready(function () {
    $('#btnClose').click(click.close);
    $('[data-location]').click(click.navigate);
    //window functions
    $('.fa-wrench').click(click.tool);
    $('.fa-window-minimize').click(click.minimize);
    $('.fa-window-maximize').click(click.maximize);
    $('.fa-window-close-o').click(click.close);
    $('#btnHome').click(click.home);
    //this gets initial partial to display 
    ipcRenderer.send('setting', 'Require Login');
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
    }
}
var click = {
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
//from the main process, might have to change this up
//to deal with multiple settings returned??
ipcRenderer.on('setting', (event, arg) => {
    console.log('Settings callback -- Location dashboard.js -- setting: ' + arg.label);
    if (arg.value) {
        ipcRenderer.send('navigate', 'login');
    } else {
        ipcRenderer.send('navigate', 'dashboard');
    }
});


