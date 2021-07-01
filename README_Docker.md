# Pequeño ReadMe de como usar la app de PowerViews

### Pre Requisitos

Para poder correr esta aplicacion se neceita instalar docker y docker-compose

Para ver las instrucciones referise a

- docker
  https://docs.docker.com/install/#server
- docker-compose
  https://docs.docker.com/compose/install/

### Give your user docker capabilities
usermod -aG docker $USER

#### Crear Red para contenedores de Scripts

```
docker network create -d bridge --gateway 172.13.5.1 --subnet 172.13.5.0/16 linkaform
```
### Para correr Powerviews

Esto va a arrancar los dos contenedores (api y engine) y de igual forma vas a la base de datos

```
docker-compose up -d
```
