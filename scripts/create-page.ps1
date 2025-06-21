param(
    [Parameter(Mandatory=$true)]
    [string]$PageName
)

# Convertir el nombre a PascalCase si no lo está
$PascalCaseName = (Get-Culture).TextInfo.ToTitleCase($PageName.ToLower()) -replace '\s+', ''

# Crear la carpeta pages si no existe
if (!(Test-Path "src/pages")) {
    New-Item -ItemType Directory -Path "src/pages" -Force
}

# Crear la carpeta específica para la página
$pageFolder = "src/pages/$PascalCaseName"
if (!(Test-Path $pageFolder)) {
    New-Item -ItemType Directory -Path $pageFolder -Force
}

# Crear el archivo TSX
$tsxContent = @"
import React from 'react';
import styles from './$PascalCaseName.module.scss';

const $PascalCaseName`: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>$PascalCaseName</h1>
      <p>Esta es la página $PascalCaseName</p>
    </div>
  );
};

export default $PascalCaseName;
"@

# Crear el archivo SCSS module
$scssContent = @"
// Variables
`$primary-color: #007bff;
`$secondary-color: #6c757d;
`$border-radius: 8px;

.container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  
  // Anidamiento - más limpio que CSS normal
  .title {
    color: `$primary-color;
    font-size: 2rem;
    margin-bottom: 1rem;
    
    &:hover {
      color: `$secondary-color;
    }
  }
  
  p {
    color: #333;
    line-height: 1.6;
  }
}
"@

# Escribir los archivos
$tsxContent | Out-File -FilePath "$pageFolder/$PascalCaseName.tsx" -Encoding UTF8
$scssContent | Out-File -FilePath "$pageFolder/$PascalCaseName.module.scss" -Encoding UTF8

Write-Host "✅ Página creada exitosamente!" -ForegroundColor Green
Write-Host "📁 $pageFolder/$PascalCaseName.tsx" -ForegroundColor Cyan
Write-Host "📁 $pageFolder/$PascalCaseName.module.scss" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 No olvides agregar la ruta en tu App.tsx:" -ForegroundColor Yellow
Write-Host "   import $PascalCaseName from './pages/$PascalCaseName/$PascalCaseName';" -ForegroundColor Gray
Write-Host "   <Route path='/$($PageName.ToLower())' element={<$PascalCaseName />} />" -ForegroundColor Gray 