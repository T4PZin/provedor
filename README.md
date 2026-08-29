# FRAGHOST

Painel (Electron + React) para gerenciar um servidor **CS2** com sistema de
inventários e skins por jogador (plugin CounterStrikeSharp `InventoryChanger`).

## Estrutura

- `server/` — servidor CS2 e plugin C# (`plugins/InventoryChanger`) em .NET 10.
- `panel/` — aplicativo desktop (Electron + Vite + React + TypeScript).
- `tools/` — gerador de catálogo de skins (`gen-catalog.js`, `update-catalog.js`) e testes.
- `verdent-design/` — assets de design.

## Pré-requisitos

- Windows 10/11
- [.NET 10 SDK](https://dotnet.microsoft.com/download) (o plugin usa `net10.0`)
- Node.js 20+
- Servidor CS2 dedicado com CounterStrikeSharp instalado

## Plugin (C#)

```powershell
cd server/plugins/InventoryChanger
dotnet build -c Release
```

Os testes do plugin usam xUnit:

```powershell
dotnet test server/plugins/InventoryChanger.Tests/InventoryChanger.Tests.csproj
```

## Painel (Electron)

```powershell
cd panel
npm install
npm run dev          # desenvolvimento
npm run build:win    # build do instalador (requer permissao de symlink / Admin)
npm run release      # build + publicacao no GitHub (requer $env:GH_TOKEN)
```

### Variáveis de ambiente

- `GH_TOKEN` — token de acesso do GitHub com escopo `repo` (ou `public_repo`),
  usado apenas para publicar releases via `electron-builder`. Nunca commitar o token.

### Testes do painel

```powershell
cd panel
npm run typecheck    # tsc + vitest (parse do serverManager e tipos)
```

Os testes de catálogo ficam em `tools/test/`:

```powershell
cd tools
node --test
```

## Funcionalidades

- **Dashboard**: status do servidor, jogadores online, iniciar/parar.
- **Console**: streaming de logs do servidor e envio de comandos.
- **Inventário**: catálogo de skins (com preview de imagem) e jogadores vistos anteriormente.
- **Configurações**: pasta do servidor, porta e GSLT, com validação.
- **i18n**: português e inglês, com seletor no topo.
- **Auto-update**: atualização automática via GitHub Releases (`electron-updater`).
- **Concorrência de loadouts**: edições do painel e picks em jogo são mescladas
  no `loadouts.json` (ver `LoadoutStore.cs`).

## Catálogo de skins

O catálogo `server/plugins/InventoryChanger/data/skins.json` é gerado a partir do
CounterStrikeSharp e do cs2-WeaponPaints:

```powershell
cd panel
npm run update-catalog
```

## Publicação

O projeto publica releases em `github.com/T4PZin/provedor`. O `electron-builder.yml`
usa `publish: [{ provider: github }]`, então basta definir `GH_TOKEN` e rodar
`npm run release`.

### Assinatura de código (opcional, recomendada)

Sem certificado o instalador não é assinado e o Windows exibe o aviso do SmartScreen. Para assinar:

- **Modo simples:** defina as variáveis de ambiente `CSC_LINK` (caminho ou URL do `.pfx`) e
  `CSC_KEY_PASSWORD` antes do build. O `electron-builder` assina sozinho.
- **Azure Trusted Signing** (gratuito para open source): instale
  `electron-builder-azure-sign-tool`, configure as credenciais do cofre de chaves no
  bloco `win.azureSignTool` do `electron-builder.yml` e defina as respectivas secrets.

Em ambos os casos, para assinar também na CI, adicione `CSC_LINK`, `CSC_KEY_PASSWORD`
(ou as secrets do Azure) como *secrets* do repositório e referencie-as no workflow.
