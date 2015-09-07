#### 1. Base de datos MongoDB

De forma predeterminada, Origami utiliza la base de datos `origami-dev` en `localhost:27017`, sin autenticación.
Para cambiar esta configuración, abra el archivo `manager/config-default.json` y actualícelo de forma acorde a su entorno.

```
{
  "ip": "0.0.0.0", // IP a la que responde pedidos
  "port": 9000, // puerto en el que escucha los pedidos
  "expressSecret": "thisIsAnObviousSecret", // clave para encriptar las cookies
  "auth": {
    // "origami-auth-local" es un nombre de plugin de autenticación
    // el objeto llega al plugin como su configuración
    "origami-auth-local": {
      "mongo": {
        // base de datos donde se guardarán los nombres de usuario locales
        "database": "origami-dev",
        // host de la base de datos
        "host": "127.0.0.1",
        // puerto
        "port": 27017,
        // usuario, dejar en blanco para no utilizar autenticación de MongoDB
        "username": "",
        "password": "",
        // nombre de la colección con los usuarios y contraseñas locales
        "collection": "local-users"
      }
    }
  },
  // protocolo con el que se escuchará, puede ser "http" o "spdy"
  // en el caso de elegir "spdy" la sección "keys" es requerida
  "protocol": "spdy",
  "keys": {
    // clave privada para SSL
    "key": "keys/localhost.pem",
    // certificado para SSL
    "cert": "keys/localhost.pem",
    // certificado de la entidad de certificación para SSL
    "ca": "keys/localhost.pem"
  },
  // URL con la que se anunciarán las aplicaciones
  "prefix": "https://localhost:9000/",
  "mongo": {
    // base de datos principal de la aplicación
    "database": "origami-dev",
    // host de la base de datos
    "host": "127.0.0.1",
    // puerto de la base de datos
    "port": 27017,
    // usuario, dejar en blanco para no utilizar autenticación de MongoDB
    "username": "",
    "password": ""
  },
  "mongoSessions": {
    // base de datos de las sesiones web
    "db": "origami-dev",
    // host de la base de datos
    "host": "127.0.0.1",
    // puerto de la base de datos
    "port": 27017,
    // usuario, dejar en blanco para no utilizar autenticación de MongoDB
    "username": "",
    "password": "",
    "auto_reconnect": true
  }
}
```

#### 2. Usuario administrador

El primer usuario que se cree en el sistema será usuario maestro. Esto es lo que la aplicación llama `master user` y tiene privilegios para realizar cualquier operación.

1. Navegue a la aplicación
2. Se presentará la pantalla de inicio de sesión
3. Complete el nombre de usuario y la contraseña
4. Haga click en _sign up_
5. Complete el correo electrónico
6. Haga click nuevamente en sign up

#### 3. Instalación de paquetes básicos de UI

Una vez iniciada la aplicación, en la carpeta `basic-packs` se encuentran varios archivos. Éstos son los paquetes básicos con los que se presenta Origami 1. Para una descripción de cada uno, consulte [paquetes básicos](paquetes-basicos.md).

1. Navegue a la aplicación
2. Inicie sesión
3. Navegue a Packages
4. Arrastre los archivos desde su navegador hasta la casilla _Import packages_

#### 3. Regeneración de certificados para SSL

Si deseara regenerar el certificado SSL por algún motivo, dentro de la carpeta principal se encuentra un script `generate-certificate.sh` que utiliza la utilidad `openssl`. Toma como parámetro el DNS para el cual se emitirá el certificado y por defecto utiliza `localhost`. Este certificado será auto-firmado, por lo cual no debe usarse en entornos productivos.
La salida será un archivo `localhost.pem` que contiene ambas claves, privada y pública.