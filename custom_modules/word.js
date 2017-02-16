const fs = require('fs');
const Docxtemplater = require('docxtemplater');
const JSZip = require('jszip');

exports.saveMealAsDocx = (clientData, templateLocation, saveLocation) => {
    console.log(clientData);
    return new Promise((res, rej) => {
        //Load the docx file as a binary 
        var content = fs.readFileSync(templateLocation, "binary");

        var zip = new JSZip(content);
        var doc = new Docxtemplater().loadZip(zip)

        //set the templateVariables 
        doc.setData({
            name: `${clientData.client.firstName} ${clientData.client.lastName}`,
            email: clientData.client.email,
            phone: clientData.client.phone,
            macro: `${clientData.mealPlan.macros.carb}/${clientData.mealPlan.macros.fat}/${clientData.mealPlan.macros.protein}`,
            meals: clientData.mealPlan.tables,
            calories: clientData.mealPlan.totals.calories,
            fat: clientData.mealPlan.totals.fat,
            carb: clientData.mealPlan.totals.carb,
            protein: clientData.mealPlan.totals.protein
        });

        doc.render();

        var buf = doc.getZip()
            .generate({ type: "nodebuffer" });

        fs.writeFileSync(saveLocation, buf);
        //return the newly create files location for
        //the main process to open
        res(saveLocation);
    });
}

