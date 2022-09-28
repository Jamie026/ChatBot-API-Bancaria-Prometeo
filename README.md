# ChatBot-API-Bancaria-Prometeo

## Descripción básica

El siguiente proyecto es un chatbot de telegram creado a partir de la API Telegraf. Su función principal es ayudar a los usuarios a interactuar 
con la API bancaria de Prometeo por medio de diversos comandos.

## Instrucciones

Para poder ejecutar este proyecto solamente es necesario tener instalado Docker. Se puede descargar de manera directa a partir del siguiente link:
https://www.docker.com/. A continuación de mostraran los pasos a seguir para ejecutar el proyecto:

1. Inicializar Docker ToolBox. Al descargar e instalar docker nos aparece un ejecutable llamado "Docker QuickStart Terminal". Con este podremos inicializarlo.
Debemos esperar que nos aparezca este mensaje:

![image](https://user-images.githubusercontent.com/81883195/192748564-356f0a60-c6e4-4f07-a322-4cd427b2612d.png)

2. Luego debemos abrir una terminal y posicionarnos en la carpeta del proyecto.
3. Debemos ejecutar el comando "docker build -t chatbot-prometeo ." Esto nos creara una imagen.
4. Con el comando docker images podremos visualizar si nuestra imagen ha sido creada con exito.
5. Por ultimo debemos ejecutar el comando "docker run -it -p 4000 chatbot-prometeo". Al final nos debe aparecer esto:

![image](https://user-images.githubusercontent.com/81883195/192753175-5d29b92c-60b9-4162-b655-4df715b6fea4.png)

Tras esos 5 pasos ya estaremos ejecutando el proyecto. Para probarlo como es debido mantenga abierta en todo momento la terminal que ejecuta el proyecto y
a continuación busque en telegram al usuario "Gura00Bot" o también puede acceder directamente a traves del siguiente link: "https://t.me/Gura00Bot".
Con el comando /start y /help el bot le dara toda la información necesaria para probar todos los comandos disponibles.
