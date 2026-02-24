param(
    [string]$BindingsPath = ".\src\tsk_sys.rs",
    [string]$OutputPath = ".\TSK_SYS_FUNCTIONS.md"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BindingsPath)) {
    throw "Bindings file not found: $BindingsPath"
}

$lines = Get-Content -Path $BindingsPath
$functions = @()
$pendingDoc = @()

function Get-DocText([string]$line) {
    $match = [regex]::Match($line, '^\s*#\[doc\s*=\s*"(.*)"\]\s*$')
    if (-not $match.Success) {
        return $null
    }

    $text = $match.Groups[1].Value
    $text = $text -replace '\\n', ' '
    $text = $text -replace '\\t', ' '
    $text = $text -replace '\\\\', '\\'
    $text = $text -replace '\\"', '"'
    return $text.Trim()
}

function Infer-Description([string]$name) {
    if ($name -match '^tsk_error_') { return 'Gets or clears thread-local Sleuth Kit error state.' }
    if ($name -match '^tsk_img_open') { return 'Opens a disk image and returns an image handle.' }
    if ($name -eq 'tsk_img_close') { return 'Closes a previously opened disk image handle.' }
    if ($name -match '^tsk_img_read') { return 'Reads bytes from a disk image at a byte offset.' }
    if ($name -match '^tsk_img_') { return 'Performs image-layer operations (type conversion, access, or metadata).' }
    if ($name -match '^tsk_vs_open') { return 'Opens volume-system metadata from an image or pool.' }
    if ($name -eq 'tsk_vs_close') { return 'Closes an opened volume-system handle.' }
    if ($name -match '^tsk_vs_part_') { return 'Accesses partition or volume entries within a volume system.' }
    if ($name -match '^tsk_vs_') { return 'Performs volume-system operations and metadata access.' }
    if ($name -match '^tsk_fs_open') { return 'Opens a filesystem from an image, pool, or offset.' }
    if ($name -eq 'tsk_fs_close') { return 'Closes a filesystem handle.' }
    if ($name -match '^tsk_fs_dir_') { return 'Opens, traverses, and queries filesystem directories.' }
    if ($name -match '^tsk_fs_file_') { return 'Opens, reads, and queries filesystem file objects.' }
    if ($name -match '^tsk_fs_attr_') { return 'Accesses filesystem attribute streams and metadata.' }
    if ($name -match '^tsk_fs_meta_') { return 'Retrieves or formats file metadata / inode information.' }
    if ($name -match '^tsk_fs_name_') { return 'Converts or formats filesystem entry name and type values.' }
    if ($name -match '^tsk_fs_') { return 'Performs filesystem operations and information queries.' }
    if ($name -match '^tsk_pool_') { return 'Opens and inspects storage pool structures.' }
    if ($name -match '^tsk_hdb_') { return 'Works with hash databases (lookup/index operations).' }
    if ($name -match '^tsk_auto_') { return 'Runs automated analysis helpers in Sleuth Kit.' }
    return 'Sleuth Kit exported API function.'
}

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]

    if ($line -match '^\s*#\[doc\s*=') {
        $doc = Get-DocText $line
        if ($doc) {
            $pendingDoc += $doc
        }
        continue
    }

    $fnMatch = [regex]::Match($line, '^\s*pub\s+fn\s+([A-Za-z0-9_]+)\s*\(')
    if ($fnMatch.Success) {
        $name = $fnMatch.Groups[1].Value

        $signature = $line.Trim()
        $j = $i
        while (($signature -notmatch ';\s*$') -and ($j + 1 -lt $lines.Count)) {
            $j++
            $signature += " " + $lines[$j].Trim()
        }
        $signature = ($signature -replace '\s+', ' ').Trim()

        $description = ($pendingDoc -join " ").Trim()
        if (-not $description) {
            $description = Infer-Description $name
        }

        $functions += [pscustomobject]@{
            Name = $name
            Signature = $signature
            Description = $description
        }

        $pendingDoc = @()
        $i = $j
        continue
    }

    if ($line.Trim() -ne "") {
        $pendingDoc = @()
    }
}

$functions = $functions | Sort-Object Name -Unique

$content = @()
$content += "# tsk_sys.rs Function Reference"
$content += ""
$content += "This document lists every bindgen-generated function (`pub fn`) found in `src/tsk_sys.rs`."
$content += ""
$content += "Total functions: $($functions.Count)"
$content += ""

$currentGroup = $null
foreach ($fn in $functions) {
    $group = "other"
    if ($fn.Name -match '^tsk_([a-z0-9]+)_') {
        $group = $matches[1]
    }

    if ($group -ne $currentGroup) {
        if ($null -ne $currentGroup) {
            $content += ""
        }
        $content += "## $group"
        $content += ""
        $currentGroup = $group
    }

    $content += "### $($fn.Name)"
    $content += ""
    $content += "- Signature: ``$($fn.Signature)``"
    $content += "- What it does: $($fn.Description)"
    $content += ""
}

Set-Content -Path $OutputPath -Value $content -Encoding utf8

Write-Output "Generated $OutputPath"
Write-Output "Functions documented: $($functions.Count)"
