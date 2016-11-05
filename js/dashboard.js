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
    home:function () {
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

