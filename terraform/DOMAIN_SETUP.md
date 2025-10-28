# Configuración de Dominio y HTTPS

## Pasos para configurar juezbatalla.online

### 1. En GoDaddy (Panel de Control del Dominio)

1. Ve a la configuración DNS de `juezbatalla.online`
2. Agrega/Modifica estos registros:

```
Tipo: A
Nombre: @
Valor: [IP_DEL_DROPLET]
TTL: 3600

Tipo: A
Nombre: www
Valor: [IP_DEL_DROPLET]
TTL: 3600
```

Donde `[IP_DEL_DROPLET]` es la IP pública del servidor de DigitalOcean.

### 2. Desplegar con Terraform

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

Espera unos minutos a que termine de desplegar.

### 3. Instalar Certificado SSL

Una vez que el servidor esté corriendo y los DNS hayan propagado (15-30 min):

```bash
# Conectar al servidor
ssh root@juezbatalla.online

# Instalar certificado SSL
certbot --nginx -d juezbatalla.online -d www.juezbatalla.online
```

### 4. Verificar

Visita: https://juezbatalla.online

---

## Notas

- **Propagación DNS**: Los cambios de DNS pueden tardar 15-30 minutos
- **HTTPS**: Let's Encrypt instala certificados SSL gratis
- **Renovación automática**: Certbot renueva el certificado automáticamente

