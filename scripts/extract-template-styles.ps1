$base = Resolve-Path (Join-Path $PSScriptRoot "..")
$outDir = Join-Path $base "frontend\src\templates\styles"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$pairs = @(
  @("backend\templates\classic.html", "classic.css"),
  @("backend\templates\modern.html", "modern.css"),
  @("backend\templates\creative.html", "creative.css"),
  @("backend\templates\professional.html", "professional.css")
)
foreach ($p in $pairs) {
  $src = Join-Path $base $p[0]
  $dst = Join-Path $outDir $p[1]
  $raw = Get-Content -LiteralPath $src -Raw -Encoding UTF8
  if ($raw -notmatch '(?s)<style>(.*?)</style>') { throw "No <style> in $src" }
  $css = $Matches[1].Trim()
  [System.IO.File]::WriteAllText($dst, $css, [System.Text.UTF8Encoding]::new($false))
  Write-Host "Wrote $dst ($($css.Length) bytes)"
}
