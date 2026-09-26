resource "docker_network" "red_frontend" {
  # Comunica el frontend con el backend
  name = "red-frontend-${terraform.workspace}"
}

resource "docker_network" "red_backend" {
  # Comunica el backend con la base de datos
  name = "red-backend-${terraform.workspace}"
}

output "red_frontend_name" {
  value = docker_network.red_frontend.name
}

output "red_backend_name" {
  value = docker_network.red_backend.name
}
