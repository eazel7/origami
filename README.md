# Plataforma Origami para el desarrollo rápido de aplicaciones

[![Join the chat at https://gitter.im/eazel7/origami](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/eazel7/origami?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Características

- Aplicaciones independientes por url (/{{aplicacion}})
- Base de datos en MongoDB, API REST
- Motor y editor web de Workflows
- Sincronización de datos Offliine
- Mantenimiento de paquetes de UI (scripts, estilos, y soporte offline)

## Setup

Una vez configurada la base de datos (y actualizado el archivo `manager/config.json`), ejecutar `setup.sh`. Este script enlazará las bibliotecas entre sí (_api-mongo_, _app_, _auth-local_, _manager_, _random-names_) e instalará las dependencias.

### En OpenShift

Esta repositorio está preparado para desplegarse directamente en OpenShift.

```bash
rhc app create origami --from-code https://github.com/eazel7/origami.git nodejs-0.10 mongodb-2.4
```

> reemplaze el primer parámetro `origami` por el nombre de su aplicación

o indique `https://github.com/eazel7/origami.git` como repositorio de orígen para el código vía la UI, agregando los cartuchos `nodejs-0.10` y `mongodb-2.4`

## Ejecución

Ejecutar `run.sh`

## Configuración inicial

1. Configurar el primer usuario (que será el administrador del servidor)
2. Importar los paquetes en _basic-packs_
3. Crear una aplicación
