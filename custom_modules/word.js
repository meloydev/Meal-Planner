const fs = require('fs');
const Docxtemplater = require('docxtemplater');
const JSZip = require('jszip');

exports.saveMealAsDocx = (clientData, templateLocation, saveLocation) => {

    //Load the docx file as a binary
    var content = fs
        .readFileSync(templateLocation, "binary");

    var zip = new JSZip(content);
    var doc = new Docxtemplater().loadZip(zip)

    //set the templateVariables
    doc.setData(clientData.mealPlan);

    //apply them (replace all occurences of {first_name} by Hipp, ...)
    doc.render();

    var buf = doc.getZip()
        .generate({ type: "nodebuffer" });

    fs.writeFileSync(saveLocation, buf);
}