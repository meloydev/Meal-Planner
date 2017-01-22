
$(document).ready(function () {
    var c = $('#btnSubmit');
    c.click(() => {
        var name = $('#txtUserName').val();
        var pass = $('#txtPassWord').val();
        ipcRenderer.send('login', { email: name, passWord: pass });
    });
});
