# Laboratorio de aprovisionamiento

Laboratorio enfocado en utilizar Terraform con buenas prácticas para aprovisionar, con Docker, un frontend (nginx), un backend (node) y una base de datos (PostgreSQL) en los ambientes dev y qa.

## Arquitectura

### Contenedores y puertos por ambiente

| Contenedor | Externo:Interno |
|---|---|
| web-dev-1 | 4001:80 |
| api-dev-1 | 4002:3000 |
| bd-dev | 4003:5432 |
| web-qa-1 / web-qa-2 | 5001:80 / 5011:80 |
| api-qa-1 / api-qa-2 | 5002:3000 / 5012:3000 |
| bd-qa | 5003:5432 |

### Redes

| Contenedor | red-frontend-\<ws\> | red-backend-\<ws\> |
|---|---|---|
| web (frontend) | sí | no |
| api (backend) | sí | sí |
| bd (base de datos) | no | sí |

El frontend nunca se comunica directamente con la base de datos: no comparten ninguna red, por lo que ni siquiera puede resolverse el nombre del contenedor de la base de datos desde el frontend. Toda comunicación con la base de datos pasa siempre por el backend.

## Réplicas por ambiente

| Componente | dev | qa | Justificación |
|---|---|---|---|
| Frontend (nginx) | 1 | 2 | dev prioriza rapidez y bajo consumo de recursos para programar y probar; qa usa 2 réplicas para parecerse más a producción y validar que el frontend funciona igual en varias instancias. |
| Backend (node) | 1 | 2 | dev usa una sola instancia, igual que el frontend; qa usa 2 réplicas para comprobar que la API es stateless y responde igual desde cualquier instancia antes de pasar a producción. |
| Base de datos (postgres) | 1 | 1 | Queda fuera del alcance de réplicas: es un componente con estado y replicar PostgreSQL requiere configuración adicional fuera del alcance del laboratorio. |

## Requisitos

- Docker Desktop
- Terraform
- Git

Descargar previamente las imágenes usadas por el laboratorio:

```powershell
docker pull nginx:alpine
docker pull node:20-alpine
docker pull postgres:16-alpine
```

## Estructura del proyecto

```
/ (raíz del repositorio)
├── README.md
├── .gitignore
├── app/
│   ├── frontend/
│   │   └── index.html
│   └── backend/
│       └── index.js
└── iac/
    ├── providers.tf
    ├── variables.tf
    ├── terraform.tfvars
    ├── network.tf
    ├── database.tf
    ├── backend.tf
    └── frontend.tf
```

Buenas prácticas aplicadas: un archivo `.tf` por recurso lógico, variables tipo mapa por ambiente (`variables.tf` + `terraform.tfvars`) y aislamiento de ambientes mediante workspaces de Terraform en lugar de carpetas separadas.

## Instrucciones desde que se descarga el proyecto

```powershell
git clone <url-del-repositorio>
cd <carpeta-del-repositorio>
cd iac
terraform init
```

Desplegar el ambiente dev:

```powershell
terraform workspace new dev
terraform plan
terraform apply
```

Desplegar el ambiente qa:

```powershell
terraform workspace new qa
terraform plan
terraform apply
```

Confirmar cada `apply` escribiendo `yes`. El proyecto trabaja únicamente con los workspaces `dev` y `qa`; no se utiliza el workspace `default`. Para volver a un ambiente ya creado:

```powershell
terraform workspace select dev
terraform workspace select qa
```

## Verificación

```powershell
docker ps --format "table {{.Names}}\t{{.Ports}}"
docker network ls --filter name=red-
```

Deben verse 8 contenedores en total: `web-dev-1`, `api-dev-1`, `bd-dev`, `web-qa-1`, `web-qa-2`, `api-qa-1`, `api-qa-2`, `bd-qa`.

```powershell
docker exec web-dev-1 wget -qO- http://api-dev-1:3000/
docker exec api-dev-1 wget -qO- http://localhost:3000/db
docker exec web-dev-1 wget -qO- -T 3 http://bd-dev:5432
```

Los dos primeros comandos deben responder correctamente. El tercero debe fallar: es la prueba de que el frontend no tiene acceso a la base de datos.

En el navegador: http://localhost:4001 (dev), http://localhost:5001 y http://localhost:5011 (qa). Cada página debe mostrar su ambiente, la instancia que respondió y el estado "conectado" de la base de datos.

## Destruir los ambientes

```powershell
terraform workspace select qa
terraform destroy

terraform workspace select dev
terraform destroy
```

## Nota de seguridad

`terraform.tfvars` se incluye en el repositorio únicamente para fines de este laboratorio. En un entorno real, `db_password` se inyectaría desde el pipeline de despliegue y no se versionaría en el repositorio.

## Convención de commits

Este repositorio usa Conventional Commits: `feat` para nueva funcionalidad, `fix` para correcciones, `docs` para documentación y `chore` para tareas de mantenimiento.
