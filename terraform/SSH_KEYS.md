# 🔑 SSH Keys en DigitalOcean con Terraform

## ✅ Respuesta Corta

**NO, el nombre no importa.** Solo importa el **fingerprint**.

## 🔍 Cómo funciona

### Lo que importa: Fingerprint
```hcl
ssh_key_fingerprint = "11:5d:0f:cd:06:90:7d:7a:73:a9:74:e8:87:62:74:f6"
                     ↑ Este es el IMPORTANTE
```

El fingerprint es el identificador único de tu SSH key. Es como el hash de la key.

### Lo que NO importa: Nombre
```
✅ Tu key se puede llamar:
   - "terraform"
   - "mi-laptop"  
   - "Gabriel's Mac"
   - "default"
   - Cualquier nombre que quieras

DigitalOcean solo mira el fingerprint, no el nombre.
```

## 📋 Cómo obtener tu fingerprint

### Opción 1: Desde DigitalOcean Dashboard
1. Ve a **Settings** > **Security** > **SSH Keys**
2. Ve tu key listada
3. Copia el **Fingerprint** (formato: `xx:xx:xx:xx...`)

### Opción 2: Desde tu computadora
```bash
# Ver todas tus keys
ssh-add -l

# Ver fingerprint de una key específica
ssh-keygen -lf ~/.ssh/id_rsa.pub
```

Output será algo como:
```
2048 SHA256:xxxxx... rsa-key-20241101 (RSA)
   o
   MD5 fingerprint: 11:5d:0f:cd:06:90:7d:7a:73:a9:74:e8:87:62:74:f6
```

### Opción 3: Si no tienes key
```bash
# Generar nueva SSH key
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Ver fingerprint
ssh-keygen -lf ~/.ssh/id_rsa.pub
```

Luego agregarla a DigitalOcean en Dashboard > Settings > Security > SSH Keys > Add SSH Key

## ⚠️ Importante

El fingerprint en `terraform.tfvars` DEBE coincidir exactamente con el fingerprint de la key que agregaste a DigitalOcean.

Si no coincide, Terraform fallará diciendo:
```
Error: SSH key not found
```

## 🔄 Qué cambiar en `terraform.tfvars`

```hcl
# Reemplazar "your-ssh-key-fingerprint" con TU fingerprint real
ssh_key_fingerprint = "TU_FINGERPRINT_AQUI"
```

El fingerprint que tienes ahora es:
```hcl
ssh_key_fingerprint = "11:5d:0f:cd:06:90:7d:7a:73:a9:74:e8:87:62:74:f6"
```

Si es tu fingerprint correcto, ya está listo. Si no, cópialo desde DigitalOcean Dashboard.

## ✅ Checklist

- [ ] SSH key agregada en DigitalOcean Dashboard
- [ ] Fingerprint copiado (formato: `xx:xx:xx:xx:xx...`)
- [ ] Fingerprint puesto en `terraform.tfvars`
- [ ] Puedes conectarte con `ssh root@IP` después del deployment

## 🚀 Después del Deploy

Podrás conectarte con:
```bash
ssh root@TU_DROPLET_IP
```

Sin password, porque usa tu SSH key.

## 📝 Nota final

El nombre del SSH key es **solo para organización tuya** en el dashboard. Terraform y DigitalOcean solo usan el fingerprint.
