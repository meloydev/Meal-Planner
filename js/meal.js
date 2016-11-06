$(document).ready(function () {
  $('.bottom-right').off('click').click(click.buttonExpand);
  $('#btnPrint').off('click').click(click.print);
  $('#btnAdd').off('click').click(click.addFood); 
});

var click = {
  print: function () {
    $('.base').toggleClass("base-expand");
    $('.top-left').toggleClass("middle-fix");
    window.print();
  },
  addFood: function () { 
    $('.base').toggleClass("base-expand");
    $('.top-left').toggleClass("middle-fix");
    var loc = $(this).data('location');
    ipcRenderer.send('meal-window', loc);
  },
  buttonExpand:function () {
      $('.base').toggleClass("base-expand");
    //padding for that middle button
    $('.top-left').toggleClass("middle-fix");
  }
};

// Listen for async-reply message from main process
ipcRenderer.on('meal-window-reply', (event, arg) => {
  //modal window on parent page
  var popUp = $('#modal-window');
  //what is passed back
  var contents = $(arg);
  //meat of the modal
  var popupBody = popUp.find('.modal-dialog').find('.modal-body');
  //clean it out
  popupBody.empty();
  //add the body to the modal
  contents.appendTo(popupBody);
  //show modal
  popUp.modal();
});