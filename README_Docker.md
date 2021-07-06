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


## Hacer build de la imagen para llevar a productivo
```
docker-compose -f docker-build.yml build  powerengine
```

#### Testing image
```
docker run  -i -t linkaform/powerviews:latest
```

## Running on prodcutive

### Add secrets to docker service


```
docker secret create [docker_name] [filename or stdinput]
docker secret create config.json config.json
```

### Add secret to service

```
docker service update lkf_powerengine --secret-add config.json
docker service update lkf_powerviews --secret-add config.json
```
