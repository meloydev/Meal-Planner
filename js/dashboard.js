const electron = require('electron');
const {ipcRenderer} = electron;

$(document).ready(function () {
    //$('#btnClose').click(click.close);
    //$('#btnMeal').click(click.navigate);
    //$('#btnAddClient').click(click.navigate);
    $('[data-location]').click(click.navigate);
})

var click = {
    close: function () {
        ipcRenderer.send('close');
    }, 
    navigate:function () {
        var loc = $(this).data('location');
        ipcRenderer.send('navigate', loc);
    }
};

// Listen for async-reply message from main process
ipcRenderer.on('reply', (event, arg) => {  
    //$(arg).appendTo('#mainContent');
    var container = $('#mainContent');
    container.fadeOut(300, function () {
        container.empty();
         $(arg).appendTo(container);
         container.fadeIn(300);
    }); 
});

