//user-popup.js

$(document).ready(function () {
    userPopup.load();
    $('#btnSelectUser').off('click').click(userPopup.finish);
});

var userPopup = {
    load: function () {
        //get dates to start with, today and a month from now
        var now = new Date();
        var next = new Date();
        next.setMonth(now.getMonth() + 1);

        //utility method in main js file
        var start = utilities.returnUsableDate(now);
        var end = utilities.returnUsableDate(next)

        $('#txtUserPopStart').val(start);
        $('#txtUserPopEnd').val(end);
    },
    finish: function () {
        //get contol values
        var name = $('#txtUserPopName').val();
        var start = $('#txtUserPopStart').val();
        var end = $('#txtUserPopEnd').val();
        var x = utilities.returnReadableDate(start);
        var y = utilities.returnReadableDate(start);

        //labels to change on main page
        $('#lblPrintName').html(name);
        $('#lblPrintStart').html(x);
        $('#lblPrintEnd').html(y);
        //close window
        $('#modal-window').modal('hide');
    }
}