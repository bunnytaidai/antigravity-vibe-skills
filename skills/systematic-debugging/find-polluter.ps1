<#
.SYNOPSIS
    Kịch bản Cô lập & Truy tìm Bài Kiểm Thử Gây Ô Nhiễm Trạng Thái (Test Polluter Bisection Script — version.4.4.0.0)
    Tối ưu hóa cho Windows 10/11 PowerShell trên máy trạm Intel Xeon E5-2678 v3 (24 luồng) / 64GB RAM.

.DESCRIPTION
    Chạy lần lượt từng tệp kiểm thử (pytest hoặc npm test) và kiểm tra ngay sau mỗi bài test
    xem tệp/thư mục rác (ví dụ: '.git', 'temp.db', '.cache_lock') có bị tạo ra ngoài ý muốn hay không.

.PARAMETER PollutionPath
    Đường dẫn tệp hoặc thư mục rác cần theo dõi (ví dụ: ".git" hoặc "test_pollution.tmp").

.PARAMETER TestPattern
    Mẫu tên tệp kiểm thử cần quét (ví dụ: "test_*.py" hoặc "*.test.ts").

.PARAMETER Runner
    Công cụ chạy test: "pytest" (mặc định cho Python) hoặc "npm" (cho Node.js/TypeScript).

.EXAMPLE
    .\find-polluter.ps1 -PollutionPath ".git" -TestPattern "test_*.py" -Runner "pytest"
#>

param(
    [Parameter(Mandatory = $true, HelpMessage = "Đường dẫn tệp/thư mục bị tạo nhầm cần kiểm tra")]
    [string]$PollutionPath,

    [Parameter(Mandatory = $true, HelpMessage = "Mẫu tìm kiếm tệp test (ví dụ: test_*.py)")]
    [string]$TestPattern,

    [Parameter(Mandatory = $false)]
    [ValidateSet("pytest", "npm")]
    [string]$Runner = "pytest"
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "🔍 Đang truy tìm bài test tạo ra tệp/thư mục rác: $PollutionPath" -ForegroundColor Cyan
Write-Host "📂 Mẫu tệp kiểm thử: $TestPattern | Bộ chạy: $Runner" -ForegroundColor Gray
Write-Host ""

# Lấy danh sách tất cả các tệp test khớp với mẫu
$TestFiles = Get-ChildItem -Path . -Recurse -File -Filter $TestPattern | Sort-Object FullName
$Total = $TestFiles.Count

Write-Host "Tìm thấy tổng cộng $Total tệp kiểm thử." -ForegroundColor Yellow
Write-Host ""

$Count = 0
foreach ($File in $TestFiles) {
    $Count++

    # Kiểm tra nếu tệp rác đã tồn tại từ trước khi chạy bài test này
    if (Test-Path -Path $PollutionPath) {
        Write-Host "⚠️ Cảnh báo: '$PollutionPath' đã tồn tại trước bài test [$Count/$Total] ($($File.Name))" -ForegroundColor Yellow
        continue
    }

    Write-Host "[$Count/$Total] Đang kiểm tra cô lập: $($File.FullName)" -ForegroundColor White

    # Chạy bài test cô lập
    if ($Runner -eq "pytest") {
        & python -m pytest "$($File.FullName)" -q *> $null
    } else {
        & npm test "$($File.FullName)" *> $null
    }

    # Kiểm tra xem tệp/thư mục rác có xuất hiện ngay sau bài test này không
    if (Test-Path -Path $PollutionPath) {
        Write-Host ""
        Write-Host "🎯 ĐÃ BẮT ĐƯỢC THỦ PHẠM GÂY Ô NHIỄM (FOUND POLLUTER)!" -ForegroundColor Red
        Write-Host "   👉 Tệp kiểm thử gây lỗi : $($File.FullName)" -ForegroundColor Green
        Write-Host "   👉 Tệp/Thư mục rác tạo ra: $PollutionPath" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Thông tin chi tiết đối tượng rác:" -ForegroundColor Cyan
        Get-Item -Path $PollutionPath | Format-List FullName, CreationTime, LastWriteTime, Length
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Hoàn tất kiểm tra $Total tệp test — Không phát hiện bài test nào gây ô nhiễm!" -ForegroundColor Green
exit 0
