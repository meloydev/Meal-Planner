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
    console.log('ready');
    ipcRenderer.send('setting', 'Require Login'); 
})

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
     console.log('Settings callback -- Location dashboard.js -- setting: '+arg.label);
    if (arg.value) { 
        ipcRenderer.send('navigate', 'login');
    } else {
        ipcRenderer.send('navigate', 'dashboard');
    }
});


