#!/usr/bin/env bash
# Kịch bản phân đôi (Bisection script) để tìm chính xác bài test nào đã tạo ra file/trạng thái rác ngoài ý muốn
# Cách dùng (Usage): ./find-polluter.sh <tệp_hoặc_thư_mục_cần_kiểm_tra> <mẫu_file_test>
# Ví dụ (Example):   ./find-polluter.sh '.git' 'src/**/*.test.ts'
# Lưu ý trên Windows 10/11: Ưu tiên dùng tệp ./find-polluter.ps1 trong cùng thư mục để chạy trực tiếp bằng PowerShell.

set -e

if [ $# -ne 2 ]; then
  echo "Cách dùng: $0 <file_to_check> <test_pattern>"
  echo "Ví dụ:     $0 '.git' 'src/**/*.test.ts'"
  exit 1
fi

POLLUTION_CHECK="$1"
TEST_PATTERN="$2"

echo "🔍 Đang tìm kiếm bài test tạo ra: $POLLUTION_CHECK"
echo "Mẫu file test: $TEST_PATTERN"
echo ""

# Lấy danh sách các file test khớp với mẫu
TEST_PATTERN="${TEST_PATTERN#./}"
TEST_FILES=$(find . \( -path "./$TEST_PATTERN" -o -path "./${TEST_PATTERN//\*\*\//}" \) | sort -u)
if [ -z "$TEST_FILES" ]; then
  TOTAL=0
else
  TOTAL=$(printf '%s\n' "$TEST_FILES" | wc -l | tr -d ' ')
fi

echo "Tìm thấy $TOTAL tệp kiểm thử"
echo ""

COUNT=0
for TEST_FILE in $TEST_FILES; do
  COUNT=$((COUNT + 1))

  # Bỏ qua nếu file rác đã tồn tại từ trước
  if [ -e "$POLLUTION_CHECK" ]; then
    echo "⚠️  Đối tượng '$POLLUTION_CHECK' đã tồn tại trước bài test $COUNT/$TOTAL"
    echo "   Bỏ qua: $TEST_FILE"
    continue
  fi

  echo "[$COUNT/$TOTAL] Đang chạy thử: $TEST_FILE"

  # Chạy bài test
  npm test "$TEST_FILE" > /dev/null 2>&1 || true

  # Kiểm tra xem đối tượng rác có xuất hiện sau khi chạy bài test này không
  if [ -e "$POLLUTION_CHECK" ]; then
    echo ""
    echo "🎯 ĐÃ TÌM THẤY THỦ PHẠM (FOUND POLLUTER)!"
    echo "   Bài test gây lỗi: $TEST_FILE"
    echo "   Đã tạo ra:        $POLLUTION_CHECK"
    echo ""
    echo "Chi tiết đối tượng rác:"
    ls -la "$POLLUTION_CHECK"
    echo ""
    echo "Lệnh kiểm tra sâu:"
    echo "  npm test $TEST_FILE    # Chạy riêng bài test này"
    echo "  cat $TEST_FILE         # Xem mã nguồn bài test"
    exit 1
  fi
done

echo ""
echo "✅ Không tìm thấy bài test gây ô nhiễm - toàn bộ bài test đều sạch!"
exit 0
