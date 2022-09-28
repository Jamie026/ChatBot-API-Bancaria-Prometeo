/*Usamos dotenv para mantener en secreto tanto la API_KEY como el TOKEN_BOT, no podran ver sus valores*/
require("dotenv").config(); 

/*Importamos las funciones encargadas de interactuar con la API de prometeo*/
const { providersList, logOut, logIn, accounts, accountMovements, creditCards, creditCardMovements } = require("./api");

/*Inicializamos las variables que usaremos para configurar el Bot*/
const { Telegraf, Scenes, session } = require("telegraf");
const bot = new Telegraf(process.env.TOKEN_TELEGRAM_API); 
const Wizard = Scenes.WizardScene;

/*Inicializamos la variable que almacenara la clave de sesión del usuario encriptada, en ningun momento 
se guarda en una variable el valor real, tampoco de guardan las credenciales del usuario*/
let user_key = null;
const Cryptr = require("cryptr");
const cryptr = new Cryptr("SesionKey");

/*Inicializamos las variables que nos ayudaran a generar los reportes que solicite el 
usuario en formato PDF*/
const styles = require("./pdf/styles");
const fonts = require("./pdf/fonts");
const PdfClass = require("./pdf/main");

/*Escenas: Como su nombre lo indica, una escena lleva a cabo un conjunto de pasos según una situación.
Dichas escenas seran asignadas al Bot para que pueda ejecutarlas en el momento correcto. En el constructor primero
debemos definir el ID de la escena, esta la usaremos cuando queramos invocarla, y luego debemos definir 
todos los pasos que ejecuta la escena. En el ultimo paso debemos indicar que saldra de la escena*/

/*1. Escena que se ejecutara cuando ingrese el comando /login. Pedira primero los datos necesarios y 
luego hara el llamado al endpoint de logueo. En caso de que esta escena se ejecute por completo sin 
problema al final se recibira una clave de sesión, la cual se encriptara para ser usada en otros comandos*/
const loginScenary = new Wizard("login",
    (ctx) => {
        /*Una sesion permite que una variable exita a lo largo de una escena. 
        Cuando la escena termine dicha variable sera eliminada*/        
        ctx.scene.session.user = {}; 
        ctx.reply("Ingrese su nombre de usuario:");
        /*Next() nos permite ir a la siguiente etapa de la escena*/
        return ctx.wizard.next(); 
    },
    (ctx) => {
        ctx.scene.session.user.name = ctx.message.text;
        ctx.reply("Cúal es su clave personal?");
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.scene.session.user.password = ctx.message.text;
        ctx.reply("Cúal es el código de su proveedor?");
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.scene.session.user.provider = ctx.message.text;
        let log = await logIn(ctx.scene.session.user);
        if (log.status == "logged_in") {
            ctx.reply(`Bienvenido ${ctx.scene.session.user.name}, su clave de sesión ya ha sido creada y encriptada. Recuerde que esta clave cambia cada vez que se loguea y al salirse ya no sera válida.`);
            /*Encriptamos la clave de sesión recibida*/
            user_key = cryptr.encrypt(log.key); 
        } else
            ctx.reply("Ha ocurrido un error. Verique los datos ingresados e intente de nuevo más tarde.");
        /*Leave() nos permite salir de la escena*/
        await ctx.scene.leave(); 
    }
);

/*2. Escena que se ejecutara cuando ingrese el comando /accountMovements. Funciona de la misma manera 
que la de login. La unica diferencia es que al final los datos que se consiguen tras llamar al endpoint
los imprime en un PDF y descarga el archivo para que el usuario pueda verlo cuando quiera sin problema.
Esto se hizo ya que Telegram tiene un limite de caracteres por mensaje, y en caso de que se enviasen 
varios mensajes cortados como una posible solución no podemos asegurar que se envien en el orden 
correcto(Ya se intento). Es por eso que la mejor solucion fue imprimir todo el texto resultante en un PDF, 
ya que ahi ya no tendremos limite de caracteres y también podemos asignarle el estilo y fuente que 
queramos. En este caso solo se incluyeron 2 estilos y 1 fuente en la carpeta "pdf"*/ 
const AC_MO_Scenary = new Wizard("AC_MO",
    (ctx) => {
        ctx.scene.session.movements = {};
        ctx.reply("Ingrese el número de la cuenta:");
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.scene.session.movements.account = ctx.message.text;
        ctx.reply("Cúal es la moneda de la cuenta?");
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.scene.session.movements.currency = ctx.message.text;
        ctx.reply("Ingrese una fecha de inicio con el formato dd/mm/yyyy:");
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.scene.session.movements.start = ctx.message.text;
        ctx.reply("Ingrese una fecha de fin con el formato dd/mm/yyyy:");
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.scene.session.movements.end = ctx.message.text;
        ctx.reply("Generando reporte con los movimientos realizados en la cuenta indicada en el rango de fecha establecido...");
        try {
            let res = await accountMovements(ctx.scene.session.movements, cryptr.decrypt(user_key));
            let message = "";
            /*Prepara el mensaje que sera impreso en el archivo PDF*/
            res.movements.forEach((item, index) => message += `${index + 1}. ID: ${item.id}.\n Fecha: ${item.date}.\n Débito: ${item.debit}.\n Detalle: ${item.detail}.\n Referencia: ${item.reference}.\n\n`);
            sendPDF("Lista de movimientos de cuenta\n", "MovimientosCuenta", message, "./MovimientosCuenta.pdf", ctx);
        } catch (error) {
            ctx.reply("No fue posible generar el reporte. Asegurese que este logueado, verique los datos ingresados e intente de nuevo utilizando el comando /accountMovements");
        }
        finally {
            await ctx.scene.leave();
        }
    }
);

/*3. Escena que se ejecutara cuando ingrese el comando /creditCardMovements, funciona de la misma 
manera que la escena anterior*/
const CC_MO_Scenary = new Wizard("CC_MO",
    (ctx) => {
        ctx.scene.session.movements = {};
        ctx.reply("Ingrese el número de la tarjeta de crédito:");
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.scene.session.movements.card = ctx.message.text;
        ctx.reply("Cúal es la moneda de la tarjeta?");
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.scene.session.movements.currency = ctx.message.text;
        ctx.reply("Ingrese una fecha de inicio con el formato dd/mm/yyyy:");
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.scene.session.movements.start = ctx.message.text;
        ctx.reply("Ingrese una fecha de fin con el formato dd/mm/yyyy:");
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.scene.session.movements.end = ctx.message.text;
        ctx.reply("Generando reporte con los movimientos realizados en la tarjeta indicada en el rango de fecha establecido...");
        try {
            let res = await creditCardMovements(ctx.scene.session.movements, cryptr.decrypt(user_key));
            let message = "";
            res.movements.forEach((item, index) => message += `${index + 1}. ID: ${item.id}.\n Fecha: ${item.date}.\n Débito: ${item.debit}.\n Detalle: ${item.detail}.\n Referencia: ${item.reference}.\n Crédito: ${item.credit}.\n\n`);
            sendPDF("Lista de movimientos de tarjeta\n", "MovimientosTarjeta", message, "./MovimientosTarjeta.pdf", ctx);
        } catch (error) {
            ctx.reply("No fue posible generar el reporte. Asegurese que este logueado, verique los datos ingresados e intente de nuevo utilizando el comando /creditCardMovement");
        }
        finally {
            await ctx.scene.leave();
        }
    }
);

/*Tras construir todos nuestros escenarios los guardamos en un Stage.*/
const stage = new Scenes.Stage([loginScenary, AC_MO_Scenary, CC_MO_Scenary]);

/*Realizamos las configuraciones necesarias para que las escenas puedan funcionar sin problema*/
bot.use(session());
bot.use(stage.middleware());

/*Definimos los comandos básicos*/
bot.start((ctx) =>ctx.reply("Bienvenido, soy Gura. Para comenzar porfavor ingresa el comando /help, ahi recibiras ayuda sobre todos los comandos disponibles y como usarlos respectivamente."));
bot.help((ctx) =>ctx.reply("Soy un Chatbot creado con la finalidad de ayudarte a interacturas con la API bancaria de Prometeo. A continuación te hare mención de los comandos disponibles: \n\n /login (Te permitira iniciar sesión con una institucion financiera) \n\n /providersList (Te generara un reporte con los datos de todos los proveedores disponibles en Prometeo) \n\n /accounts (Te generara un reporte con los datos de todas las cuentas del usuario. Para utilizar este comando debes estar logueado, de otra forma dara error) \n\n /accountMovements (Te generara un reporte con todos los movimientos de una cuenta en un rango de fechas. Para utilizar este comando debes estar logueado, de otra forma dara error) \n\n /creditCards (Te generara un reporte con los datos de todas las tarjetas de crédito del usuario. Para utilizar este comando debes estar logueado, de otra forma dara error) \n\n /creditCardMovements (Te generara un reporte con todos los movimientos de una tarjeta de crédito para un rango de fechas. Para utilizar este comando debes estar logueado, de otra forma dara error) \n\n /logout (Te permitira salirte de tu usuario. Para utilizar este comando debes estar logueado, de otra forma dara error) \n\n Nota: Tras loguearte se generara una clave de sesión, esta sera encriptada y no tendra acceso directo a ella. Cuando inicie una nueva sesión la clave sera actualizada y cuando salga de la sesión sera destruida. \n\n Con todo eso dicho divierte usando las funcionalides que puedo ofrecerte."));

/*Comandos API Bancaria de Prometeo*/

/*Autorización*/

bot.command("login", Scenes.Stage.enter("login")); 
/*Utilizamos enter() para indicar que este comando hara que el usuario active el escenario indicado*/
bot.command("logout", async (ctx) => {
    try {
        let log = await logOut(cryptr.decrypt(user_key));
        if (log.status == "logged_out") {
            ctx.reply("Hasta luego. Recuerde que su clave de sesión ya no sera válida y no podra hacer funcionar algunos comandos.");
            user_key = null; 
            /*Cuando el usuario salga de su sesión destruimos la clave de sesión*/
        }
        else 
            new Error("error al cerrar sesión");
    } catch (error) {
        ctx.reply("No fue posible salirse. Asegurese que este logueado e intente de nuevo utilizando el comando /logout");
    }
});

/*Datos transaccionales*/

bot.command("accounts", async (ctx) => {
    ctx.reply("Generando el reporte con las cuentas disponibles en este usuario...");
    try {
        let res = await accounts(cryptr.decrypt(user_key));
        let message = "";
        res.accounts.forEach((item, index) => message += `${index + 1}. ID: ${item.id}.\n Nombre: ${item.name}.\n Número: ${item.number}.\n Divisa: ${item.currency}.\n Balance: ${item.balance}.\n\n`);
        sendPDF("Lista de cuentas\n", "Cuentas", message, "./Cuentas.pdf", ctx);
    } catch (error) {
        ctx.reply("No fue posible generar el reporte. Asegurese que este logueado, verique los datos ingresados e intente de nuevo utilizando el comando /accounts");   
    }
});
bot.command("accountMovements", Scenes.Stage.enter("AC_MO"));
bot.command("creditCards", async (ctx) => {
    ctx.reply("Generando el reporte con los datos de las tarjetas de crédito disponibles en este usuario...");
    try {
        let res = await creditCards(cryptr.decrypt(user_key));
        let message = "";
        res.credit_cards.forEach((item, index) => message += `${index + 1}. ID: ${item.id}.\n Nombre: ${item.name}.\n Número: ${item.number}.\n Fecha de Vencimiento: ${item.due_date}.\n Fecha de cierre: ${item.close_date}.\n Balance Local: ${item.balance_local}.\n  Balance Dolares: ${item.balance_dollar}.\n\n`);
        sendPDF("Lista de tarjetas de crédito\n", "TarjetasCrédito", message, "./TarjetasCrédito.pdf", ctx)
    } catch (error) {
        ctx.reply("No fue posible generar el reporte. Asegurese que este logueado, verique los datos ingresados e intente de nuevo utilizando el comando /creditCards");   
    }
});
bot.command("creditCardMovements", Scenes.Stage.enter("CC_MO"))

/*Meta*/

bot.command("providersList", async (ctx) => {
    ctx.reply("Generando el reporte con los datos de todos los proveedores disponibles...");
    let res = await providersList();
    let message = "";
    res.providers.forEach((item, index) => message += `${index + 1}. Código: ${item.code}.\n Nombre: ${item.name}.\n País: ${item.country}.\n\n`);
    sendPDF("Lista de proveedores", "Proveedores", message, "./Proveedores.pdf", ctx);
});

bot.launch(); 
/*Activamos el Bot*/

/*Esta función sera invocada cada vez que se quiera que el Bot envie un archivo PDF como respuesta.
Indicamos el título que tendra el contenido del archivo, el nombre del archivo en si,
el mensaje que se imprimira, la ruta donde se guardara antes de enviarlo, y el contexto del mensaje
que solicito el archivo*/ 
async function sendPDF(title, name, message, source, ctx) {
    /*Llamamos al constructor de nuestra clase PDF. Como parametros recibe el contenido que se 
    imprimira en el documento en forma de un arreglo de objetos, y los estilos que aplicara*/
    let PDF = new PdfClass([
        { text: title, style: "header" },
        { text: message, style: "normal" },
    ], styles); 
    /*Llamamos al método encargado de crear el PDF en si. A este le pasamos el nombre que tendra 
    el PDF y las fuentes*/
    await PDF.createPDF(fonts, name);
    /*Tras finalizar la creación del PDF (ya que esta usando "await"), procedemos a enviarle al 
    usuario su reporte. Como parametro le decimos la ruta del archivo PDF que enviara.*/
    await ctx.replyWithDocument({ source: source });
    ctx.reply("Reporte generado exitosamente.");
    /*Tras finalizar el envio llamado al método encargado de eliminar un PDF, esta recibira como 
    parametro la ruta del archivo PDF que eliminara*/
    PDF.deletePDF(source);
}