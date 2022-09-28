const PdfPrinter = require("pdfmake");
const fs = require("fs");

//Creamos una clase con la cual podemos generar un archivo PDF con diferentes estilos y fuentes, o tambien eleminar.

module.exports = class PDF {
    
    constructor(content, style){
      this.content = content;
      this.style = style;
    }

    createPDF(fonts, name){
        const printer = new PdfPrinter(fonts);
        let pdfDoc = printer.createPdfKitDocument({
            content: this.content,
            styles: this.style
        });
        pdfDoc.pipe(fs.createWriteStream(name + ".pdf"));
        pdfDoc.end();
    }

    deletePDF(source){
        fs.unlinkSync(source);
    }

}