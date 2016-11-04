$(document).ready(function () {
  $('.bottom-right').click(function () {
    $('.base').toggleClass("base-expand");
    //padding for that middle button
    $('.top-left').toggleClass("middle-fix");
  });
  $('#btnPrint').click(click.print);
  $('#btnAdd').click(click.addFood);
});

var click = {
  print: function () {
    debugger;
    window.print();
  },
  addFood: function () {
    var loc = $(this).data('location');
    ipcRenderer.send('meal-window', loc);
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