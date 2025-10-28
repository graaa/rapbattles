# 🚀 Guía de Deployment para RapBattle Voter

Esta guía te ayudará a deployar RapBattle Voter en DigitalOcean para el demo del podcast.

## 🎯 Objetivo

Tener la aplicación funcionando en producción antes del podcast, accesible desde cualquier dispositivo móvil para votar en batallas de rap en vivo.

## ✅ Checklist Pre-Deployment

- [ ] Docker Compose de producción creado
- [ ] Terraform configurado
- [ ] Variables de entorno preparadas
- [ ] Tests locales pasados
- [ ] Droplet en DigitalOcean
- [ ] Dominio configurado (opcional pero recomendado)

## 📋 Pasos Rápidos (20 minutos)

### 1. Preparar Secretos (2 min)

```bash
# Generar secretos seguros
cd terraform

# Copiar archivo de ejemplo
cp terraform.tfvars.example terraform.tfvars

# Generar valores seguros
echo "signing_secret=$(openssl rand -hex 32)"
echo "admin_key=$(openssl rand -hex 32)"
echo "postgres_password=$(openssl rand -base64 24)"
```

### 2. Configurar DigitalOcean (5 min)

1. **Crear cuenta** en [digitalocean.com](https://digitalocean.com)
2. **Generar API token**: Dashboard > API > Tokens > Generate New Token
   - Nombre: `terraform-deployment`
   - Scope: `Write`
3. **Agregar SSH Key**: Dashboard > Settings > Security > SSH Keys
   - Copia el fingerprint que aparece
4. **Elegir región**: `nyc3` (NYC) o `sfo3` (San Francisco)

### 3. Configurar Terraform (3 min)

Edita `terraform/terraform.tfvars`:

```hcl
do_token = "dop_v1_xxxxxxxxxxxxx"  # Tu token de DigitalOcean
region   = "nyc3"
droplet_size = "s-2vcpu-4gb"
ssh_key_fingerprint = "xx:xx:xx:xx..."  # Tu SSH key fingerprint
repository_url = "https://github.com/graaa/rapbattles.git"

postgres_password = "GENERA_CON_OPENSSL"
signing_secret    = "GENERA_CON_OPENSSL"
admin_key         = "GENERA_CON_OPENSSL"

api_base_url = "http://PLACEHOLDER:8000"  # Se actualiza después
```

### 4. Deploy (10 min)

```bash
cd terraform

# Inicializar
terraform init

# Preview
terraform plan

# Deploy
terraform apply
```

Cuando termine, copia la IP que muestra Terraform.

### 5. Actualizar y re-deploy (2 min)

Edita `terraform/terraform.tfvars` con la IP real:

```hcl
api_base_url = "http://TU_IP:8000"
```

```bash
terraform apply
```

### 6. Verificar (3 min)

```bash
# Ver logs
ssh root@TU_IP
cd /root/app
docker compose -f docker-compose.prod.yml logs -f

# En otra terminal, verificar
curl http://TU_IP:3000
curl http://TU_IP:8000/healthz
```

## 🌐 Configurar Dominio (Opcional)

Si tienes un dominio:

1. En DigitalOcean: Networking > Domains
2. Agrega tu dominio
3. Crea registro A: `@` → IP del droplet
4. Crea registro A: `www` → IP del droplet
5. Espera propagación (5-10 minutos)

Luego actualiza `NEXT_PUBLIC_API_BASE` para usar tu dominio.

## 🎮 Usar la Aplicación

### Crear evento de prueba

1. Ve a `http://TU_IP:3000/admin` (o con dominio)
2. Crea un evento: "Demo Podcast"
3. Crea una batalla: "MC A vs MC B"
4. Genera el link de votación
5. Abre en tu móvil y vota

### Link para votar

El sistema genera un link como:
```
http://TU_IP:3000/battle/BATTLE_ID?token=TOKEN
```

Este link lo escaneas con QR o envías a otros móviles.

## 🐛 Troubleshooting

### No se conecta al droplet

```bash
# Ver IP correcta
terraform output

# Probar conexión
ping TU_IP

# Ver si está arriba
curl http://TU_IP:3000
```

### Docker no está corriendo

```bash
ssh root@TU_IP

# Ver estado
docker ps

# Ver logs
cd /root/app
docker compose -f docker-compose.prod.yml logs
```

### App no responde

```bash
ssh root@TU_IP
cd /root/app

# Reiniciar todo
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build

# Ver logs
docker compose -f docker-compose.prod.yml logs -f
```

### API no responde

```bash
# Verificar que API está corriendo
curl http://TU_IP:8000/healthz

# Ver logs del API
ssh root@TU_IP
docker compose -f docker-compose.prod.yml logs api
```

## 📱 Demostración del Podcast

### Guión sugerido

1. **Setup (30 seg)**: "Voy a crear una batalla de rap en vivo"
   - Abrir admin panel
   - Crear evento "Live Rap Battle"
   - Crear batalla "Rapper A vs Rapper B"

2. **QR Code (30 seg)**: "Escaneen este código QR"
   - Click en "Show Link" del QR
   - Proyectarlo en pantalla

3. **Votación (1 min)**: "Voten por su favorito"
   - La audiencia escanea y vota
   - Ver resultados actualizando en tiempo real

4. **Cierre**: "El ganador es..."

### Tips para el demo

- ✅ Pre-crear el evento ANTES del podcast
- ✅ Tener el QR code listo para proyectar
- ✅ Tener tu móvil listo para votar también
- ✅ Revisar que funciona localmente primero
- ✅ Tener screenshot de respaldo

## 🎯 Post-Demo

### Limpiar recursos

```bash
cd terraform
terraform destroy
```

Esto elimina el droplet y ahorra costos.

### Mantener para producción

Si quieres dejar corriendo:
- Costo: ~$24/mes (2 vCPU, 4GB RAM)
- Considerar agregar SSL
- Configurar backups de base de datos
- Monitorear logs regularmente

## 💰 Costos Estimados

- **Demo corto** (4 horas): ~$0.02 (pago por hora)
- **Un mes**: ~$24
- **Backups opcionales**: +$2-5/mes

## 📞 Soporte

Si algo falla durante el demo:

1. **Plan B**: Tener screenshots de la app funcionando
2. **Plan C**: Explicar la arquitectura y cómo funciona
3. **Plan D**: Mostrar código y explicar la tecnología

## ✅ Checklist Final

- [ ] Terraform deployado exitosamente
- [ ] IP del droplet copiada y guardada
- [ ] App funciona en `http://IP:3000`
- [ ] Admin panel accesible en `http://IP:3000/admin`
- [ ] API funciona en `http://IP:8000`
- [ ] QR code generado y listo
- [ ] Probado en móvil propio
- [ ] Evento de demo pre-creado
- [ ] Link de prueba guardado
- [ ] Screenshots de respaldo tomados
- [ ] DNS configurado (si aplica)
- [ ] Demo ejecutado exitosamente

¡Éxito con el podcast! 🎤🔥