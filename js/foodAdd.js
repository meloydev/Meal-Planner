$(document).ready(function () {
    $("#btnAddFood").click(actions.addItem);
});

var actions = {
    addItem: function () {
        var item = $('#ddlFood').find(':selected');
        var meal = $('#ddlMealNumber').val();
        var multiplier = $('#txtMulti').val();
        //add item to specific grid 
        grid.addRow(item.data(), meal, multiplier);
    }
};

var grid = {
    addRow: function (a, b, c) {
        //get table body to append a new row
        var table= $('#tbl' + b + ' > tbody:last-child');
        //create row from dropdown selection
        var row = grid.generateRow(a);
        //fade in for effect
        row.hide().appendTo(table).fadeIn(1000);
 
        //get totals
        var allCal = $('.cal');
        var allFat = $('.fat');
        var allCarb = $('.carb');
        var allProtein = $('.pro');
        //update totals
        grid.updateTotal(allProtein, 'lblProtein');
        grid.updateTotal(allFat, 'lblFat');
        grid.updateTotal(allCarb, 'lblCarb');
        grid.updateTotal(allCal, 'lblCal'); 
    },
    generateRow: function (data) {
        var row = $tr = $('<tr>').append(
            $('<td>').text(data.name),
            $('<td>').text(data.category),
            $('<td class="cal">').text(data.calories),
            $('<td class="fat">').text(data.fat),
            $('<td class="carb">').text(data.carbs),
            $('<td class="pro">').text(data.protein)
        );
        return row;
    },
    updateTotal: function (ar, ele) {
        var tot = 0;
        for (var index = 0; index < ar.length; index++) {
            var element = ar[index];
            var val = parseFloat(element.innerHTML);
            tot += val;
        }
        var roundedTotal = Math.round(tot * 100) / 100;
        $('#' + ele).html(roundedTotal);
    }
};