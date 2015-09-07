> Las instrucciones debajo descritas son para Ubuntu 15.04, que es el entorno en el que Origami fue desarrollado.

#### 1. Instalar Git, NPM, Node.JS y MongoDB

```bash
sudo apt-get install -yy npm nodejs nodejs-legacy mongodb git
```

#### 2. Descargar código fuente

```bash
git clone https://github.com/eazel7/origami
```

#### 3. Insalar dependencias

```bash
cd origami
./setup.sh
```

#### 4. Iniciar la aplicación

```bash
./run.sh
```