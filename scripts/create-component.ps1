param(
    [Parameter(Mandatory=$true)]
    [string]$ComponentName
)

# Convertir el nombre a PascalCase si no lo está
$PascalCaseName = (Get-Culture).TextInfo.ToTitleCase($ComponentName.ToLower()) -replace '\s+', ''

# Crear la carpeta components si no existe
if (!(Test-Path "src/components")) {
    New-Item -ItemType Directory -Path "src/components" -Force
}

# Crear la carpeta específica para el componente
$componentFolder = "src/components/$PascalCaseName"
if (!(Test-Path $componentFolder)) {
    New-Item -ItemType Directory -Path $componentFolder -Force
}

# Crear el archivo TSX
$tsxContent = @"
import React from 'react';
import styles from './$PascalCaseName.module.scss';

interface $PascalCaseName`Props {
  // Define tus props aquí
  children?: React.ReactNode;
}

const $PascalCaseName`: React.FC<$PascalCaseName`Props> = ({ children }) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>$PascalCaseName</h2>
      {children}
    </div>
  );
};

export default $PascalCaseName;
"@

# Crear el archivo SCSS module
$scssContent = @"
// Variables
`$primary-color: #007bff;
`$border-color: #ddd;
`$border-radius: 8px;

.container {
  padding: 1rem;
  border: 1px solid `$border-color;
  border-radius: `$border-radius;
  margin: 1rem 0;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }
  
  .title {
    color: `$primary-color;
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    
    &:hover {
      color: darken(`$primary-color, 10%);
    }
  }
}
"@

# Crear archivo de índice para exportación fácil
$indexContent = @"
export { default } from './$PascalCaseName';
"@

# Escribir los archivos
$tsxContent | Out-File -FilePath "$componentFolder/$PascalCaseName.tsx" -Encoding UTF8
$scssContent | Out-File -FilePath "$componentFolder/$PascalCaseName.module.scss" -Encoding UTF8
$indexContent | Out-File -FilePath "$componentFolder/index.ts" -Encoding UTF8

Write-Host "✅ Componente creado exitosamente!" -ForegroundColor Green
Write-Host "📁 $componentFolder/$PascalCaseName.tsx" -ForegroundColor Cyan
Write-Host "📁 $componentFolder/$PascalCaseName.module.scss" -ForegroundColor Cyan
Write-Host "📁 $componentFolder/index.ts" -ForegroundColor Cyan
Write-Host ""
Write-Host "INFO: Para usar el componente:" -ForegroundColor Yellow
Write-Host ('   import {0} from "./components/{0}";' -f $PascalCaseName) -ForegroundColor Gray
# No imprimimos el ejemplo de uso con <> para evitar errores de PowerShell
# Write-Host ("   Ejemplo de uso:") -ForegroundColor Gray
# Write-Host ("      <" + $PascalCaseName + ">Contenido aquí</" + $PascalCaseName + ">") -ForegroundColor Gray 