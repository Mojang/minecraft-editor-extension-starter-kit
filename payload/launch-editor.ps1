Start-Process shell:AppsFolder\$(Get-AppxPackage -name "Microsoft.MinecraftWindowsBeta" | Select-Object -ExpandProperty PackageFamilyName)!App -ArgumentList "Editor=true"