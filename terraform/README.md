# Terraform Deployment para RapBattle Voter

Este directorio contiene los archivos Terraform para deployment en DigitalOcean.

## 📋 Prerequisitos

1. **Cuenta de DigitalOcean**: Crea una cuenta en [digitalocean.com](https://digitalocean.com)
2. **API Token**: Genera un token en DigitalOcean Dashboard > API > Tokens
3. **SSH Key**: Agrega tu SSH key en DigitalOcean Dashboard > Settings > Security > SSH Keys
4. **Terraform**: Instala Terraform en tu máquina

### Instalación de Terraform

```bash
# macOS
brew install terraform

# Linux
wget https://releases.hashicorp.com/terraform/latest/terraform_latest_linux_amd64.zip
unzip terraform_latest_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

## 🚀 Deployment

### 1. Configurar variables

Copia el archivo de ejemplo y edítalo:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edita `terraform.tfvars` con tus valores:

```hcl
do_token = "dop_v1_xxxxxxxxxxxxx"
region   = "nyc3"
droplet_size = "s-2vcpu-4gb"
ssh_key_fingerprint = "xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx"
repository_url = "https://github.com/graaa/rapbattles.git"

# IMPORTANTE: Cambia estos valores!
postgres_password = "TU_PASSWORD_SEGURA_AQUI"
signing_secret    = "TU_SECRETO_SEGURO_AQUI"
admin_key         = "TU_ADMIN_KEY_SEGURA_AQUI"

api_base_url = "http://[IP_DEL_DROPLET]:8000"  # Se actualizará después
```

### 2. Generar secretos seguros

```bash
# Para signing_secret
openssl rand -hex 32

# Para admin_key  
openssl rand -hex 32

# Para postgres_password
openssl rand -base64 24
```

### 3. Inicializar Terraform

```bash
cd terraform
terraform init
```

### 4. Preview de cambios

```bash
terraform plan
```

### 5. Aplicar cambios

```bash
terraform apply
```

Terraform te pedirá confirmación. Escribe `yes` para continuar.

### 6. Obtener la IP del droplet

Después del deployment, Terraform mostrará la IP:

```
Outputs:

droplet_ip = "123.456.789.012"
web_url = "http://123.456.789.012:3000"
admin_url = "http://123.456.789.012:3000/admin"
api_url = "http://123.456.789.012:8000"
```

### 7. Actualizar variables y re-aplicar

Actualiza el `api_base_url` en `terraform.tfvars` con la IP real:

```hcl
api_base_url = "http://123.456.789.012:8000"
```

Y re-aplica:

```bash
terraform apply
```

## 🌐 Configurar dominio (Opcional)

Si tienes un dominio, puedes configurarlo:

1. Ve a DigitalOcean Dashboard > Networking > Domains
2. Agrega tu dominio
3. Crea registros A apuntando a la IP del droplet
4. Configura un reverse proxy (nginx/traefik) si deseas SSL

## 🛠️ Comandos útiles

```bash
# Ver estado
terraform state list

# Destruir infraestructura
terraform destroy

# Ver logs del droplet
ssh root@<droplet_ip>
docker compose -f docker-compose.prod.yml logs -f

# Reiniciar aplicación
ssh root@<droplet_ip>
cd /root/app
docker compose -f docker-compose.prod.yml restart
```

## 📊 Monitoreo

### Ver logs en tiempo real

```bash
ssh root@<droplet_ip>
cd /root/app
docker compose -f docker-compose.prod.yml logs -f
```

### Ver logs específicos

```bash
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml logs -f postgres
```

### Ejecutar comandos en contenedores

```bash
# Conectar a PostgreSQL
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d rapbattles

# Conectar a Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli
```

## 🔐 Seguridad

1. **Firewall**: Terraform configura automáticamente un firewall en DigitalOcean
2. **Secrets**: Asegúrate de no commitear `terraform.tfvars` con valores reales
3. **SSH**: Solo accesos por SSH key
4. **Database**: Credenciales seguras generadas
5. **HTTPS**: Configurar reverse proxy con SSL para producción

## 💰 Costos estimados

- **Droplet s-2vcpu-4gb**: ~$24/mes
- **Con 1GB RAM**: ~$6/mes (mínimo, no recomendado)
- **Con 4GB RAM**: ~$24/mes (recomendado)

Ver precios actualizados en: https://www.digitalocean.com/pricing
