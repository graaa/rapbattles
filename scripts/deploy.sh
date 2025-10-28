#!/bin/bash
set -e

echo "🚀 RapBattle Voter - Quick Deployment Script"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform no está instalado${NC}"
    echo "Instala con: brew install terraform (macOS) o visita terraform.io/downloads"
    exit 1
fi

# Check if in terraform directory
if [ ! -f "main.tf" ]; then
    echo -e "${RED}❌ No estás en el directorio terraform${NC}"
    echo "Ejecuta: cd terraform"
    exit 1
fi

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    echo -e "${YELLOW}⚠️  terraform.tfvars no existe${NC}"
    echo ""
    echo "Creando desde template..."
    cp terraform.tfvars.example terraform.tfvars
    echo ""
    echo -e "${RED}⚠️  IMPORTANTE: Edita terraform/terraform.tfvars con tus valores:${NC}"
    echo "  - do_token: Tu token de DigitalOcean"
    echo "  - ssh_key_fingerprint: Tu SSH key fingerprint"
    echo "  - postgres_password: Genera con 'openssl rand -base64 24'"
    echo "  - signing_secret: Genera con 'openssl rand -hex 32'"
    echo "  - admin_key: Genera con 'openssl rand -hex 32'"
    echo ""
    echo "Luego ejecuta este script de nuevo."
    exit 1
fi

echo -e "${GREEN}✅ Inicializando Terraform...${NC}"
terraform init

echo ""
echo -e "${GREEN}✅ Plan de deployment...${NC}"
terraform plan

echo ""
echo -e "${YELLOW}¿Continuar con el deployment? (yes/no)${NC}"
read -r confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelado."
    exit 0
fi

echo ""
echo -e "${GREEN}✅ Aplicando cambios...${NC}"
terraform apply -auto-approve

echo ""
echo -e "${GREEN}✅ Deployment completado!${NC}"
echo ""
echo "============================================"
echo "📍 IP del droplet:"
terraform output droplet_ip

echo ""
echo "🌐 URLs:"
terraform output web_url
terraform output admin_url
terraform output api_url

echo ""
echo "============================================"
echo ""
echo -e "${YELLOW}⚠️  PASOS SIGUIENTES:${NC}"
echo ""
echo "1. Copia la IP que aparece arriba"
echo "2. Actualiza 'api_base_url' en terraform.tfvars:"
echo "   api_base_url = \"http://TU_IP:8000\""
echo "3. Ejecuta: terraform apply"
echo "4. Ve a: http://TU_IP:3000/admin"
echo ""
echo "📱 Para el demo:"
echo "   - Crea un evento"
echo "   - Crea una batalla"
echo "   - Genera el QR link"
echo "   - Comparte el link para votar"
echo ""
echo "🎉 ¡Listo para el podcast!"
