# 💰 Opciones de Droplet en DigitalOcean

## 🖼️ Sobre las Imágenes

### `docker-20-04` (Recomendado ✅)
**¿Qué es?** Snapshot de Ubuntu 20.04 con Docker y Docker Compose pre-instalados.

**Ventajas:**
- ✅ Docker ya instalado (ahorra ~15 min)
- ✅ Docker Compose ya configurado
- ✅ Menos scripts en `user_data`
- ✅ Deployment más rápido

**Desventajas:**
- ⚠️ Versión de Docker fija (puede ser antigua)

### `ubuntu-20-04` (Alternativa)
**¿Qué es?** Ubuntu 20.04 base, sin Docker.

**Ventajas:**
- ✅ Control total sobre versiones
- ✅ Más flexible

**Desventajas:**
- ❌ Hay que instalar Docker manualmente (user_data más largo)
- ❌ Más lento el deployment inicial

### Otras opciones:
- `ubuntu-22-04` - Ubuntu más reciente
- `ubuntu-18-04` - Ubuntu LTS
- `debian-11-x64` - Debian

## 💵 Tamaños de Droplet

### Opción 1: `s-1vcpu-1gb` - $6/mes
```
RAM: 1GB
CPU: 1 vCPU
Disco: 25GB SSD
Bandwidth: 1TB

Recomendado para: Testing, demos cortos
Pros: Más barato
Contras: Puede ser lento con la app + PostgreSQL + Redis corriendo
```

### Opción 2: `s-2vcpu-4gb` - $24/mes ✅ (Actual)
```
RAM: 4GB
CPU: 2 vCPU
Disco: 80GB SSD
Bandwidth: 4TB

Recomendado para: Producción, demos, audiencia pequeña-mediana
Pros: Buen balance precio/performance
Contras: Un poco más caro
```

### Opción 3: `s-4vcpu-8gb` - $48/mes
```
RAM: 8GB
CPU: 4 vCPU
Disco: 160GB SSD
Bandwidth: 5TB

Recomendado para: Producción con alto tráfico
Pros: Muy rápido
Contras: Caro
```

## 📊 ¿Cuál elegir para el Podcast?

### Para el Demo (Recomendación)
**`s-1vcpu-1gb` ($6/mes)**

Por qué:
- Solo necesitas 4 horas
- Poco tráfico (solo el podcast)
- Sale ~$0.01 por el evento
- Funcionará bien para 20-50 votantes

### Para Producción
**`s-2vcpu-4gb` ($24/mes)**

Por qué:
- Si quieres dejarlo corriendo
- Mejor performance
- Puede manejar más tráfico
- Más confiable

## 💡 Recomendación Final

**Para mañana (podcast):**
```hcl
droplet_size = "s-1vcpu-1gb"  # $6/mes, suficiente para el demo
```

Después del podcast, puedes:
1. **Borrar todo** (terraform destroy) - No pagas nada
2. **Upgrade a s-2vcpu-4gb** si vas a usarlo más
3. **Dejarlo con s-1vcpu-1gb** si es solo para pruebas

## 🔧 Cómo cambiar el tamaño

Edita `terraform/terraform.tfvars`:

```hcl
# Para el demo (más barato)
droplet_size = "s-1vcpu-1gb"

# Para producción (más estable)
droplet_size = "s-2vcpu-4gb"
```

Luego:
```bash
cd terraform
terraform plan
terraform apply
```

## 📈 Comparación de performance

| Tamaño | Ram | CPU | App Boot | Puede manejar votantes |
|--------|-----|-----|----------|----------------------|
| s-1vcpu-1gb | 1GB | 1 | ~45s | 20-100 |
| s-2vcpu-4gb | 4GB | 2 | ~30s | 100-1000 |
| s-4vcpu-8gb | 8GB | 4 | ~20s | 1000+ |

## 🎯 Mi recomendación para mañana:

```hcl
droplet_size = "s-1vcpu-1gb"  # Suficiente y barato
```

Por qué:
- Solo lo necesitas por 4 horas (~$0.01)
- Funciona perfectamente para el demo
- Puedes upgrade después si quieres
