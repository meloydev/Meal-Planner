//meal.js

$(document).ready(function () {
  $('.bottom-right').off('click').click(mealClick.buttonExpand);
  $('#btnPrint').off('click').click(mealClick.print);
  $('#btnAdd').off('click').click(mealClick.addFood);
  $('#contextMenu').on('mouseleave', mealHover.context);
});

var mealClick = {
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
  buttonExpand: function () {
    $('.base').toggleClass("base-expand");
    //padding for that middle button
    $('.top-left').toggleClass("middle-fix");
  }
};

var mealHover = {
  context: function () {
    $(this).slideUp(200);
  }
}
// Listen for async-reply message from main process
ipcRenderer.removeAllListeners('meal-window-reply');
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