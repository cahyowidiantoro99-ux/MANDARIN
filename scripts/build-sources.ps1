$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$taskPython = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
if (-not (Test-Path -LiteralPath $taskPython)) { $taskPython = 'python' }
& $taskPython -X utf8 scripts/inspect_materials.py
if ($LASTEXITCODE -ne 0) { throw 'Pemeriksaan/pemulihan sumber gagal.' }
& $taskPython -X utf8 scripts/build_source_content.py
if ($LASTEXITCODE -ne 0) { throw 'Ekstraksi sumber gagal.' }
if (Test-Path -LiteralPath 'data/hsk3-official-syllabus-reference.pdf') { & $taskPython -X utf8 scripts/verify_hsk3_syllabus.py }
& node --env-file=.env scripts/install-source-release.mjs --reset-legacy
if ($LASTEXITCODE -ne 0) { throw 'Pemasangan release gagal.' }
