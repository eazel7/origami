# Plataforma Origami para el desarrollo rápido de aplicaciones

## Características

- Aplicaciones independientes por url (/{{aplicacion}})
- Base de datos en MongoDB, API REST
- Motor y editor web de Workflows
- Sincronización de datos Offliine
- Mantenimiento de paquetes de UI (scripts, estilos, y soporte offline)

## Setup

Una vez configurada la base de datos (y actualizado el archivo `manager/config.json`), ejecutar `setup.sh`. Este script enlazará las bibliotecas entre sí (_api-mongo_, _app_, _auth-local_, _manager_, _random-names_) e instalará las dependencias.


## Ejecución

Ejecutar `run.sh`

## Configuración inicial

1. Configurar el primer usuario (que será el administrador del servidor)
2. Importar los paquetes en _basic-packs_
3. Crear una aplicación

