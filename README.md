# LKHcards 🗂️✨
**Ứng dụng học ngoại ngữ bằng Flashcard thông minh lấy cảm hứng từ Quizlet**  
*Giao diện Tiếng Việt • Chuẩn tông màu Pastel Pink (#FDDEE6) • Thuật toán lặp lại ngắt quãng SM-2*

---

## 🚀 1. Hướng dẫn cài đặt & Khởi chạy

### Cách 1: Khởi chạy nhanh bằng File Batch (Khuyên dùng trên Windows)
- Nhấp đúp chuột vào file **`LKHcards.bat`** trong thư mục dự án.
- Ứng dụng sẽ tự động kiểm tra và mở trình duyệt tại địa chỉ `http://localhost:5173`.

### Cách 2: Sử dụng dòng lệnh Terminal
```bash
# 1. Cài đặt các gói phụ thuộc (nếu chưa cài)
npm install

# 2. Khởi chạy máy chủ phát triển (Local Development Server)
npm run dev

# 3. Chạy toàn bộ Unit Tests (31 tests)
npm test

# 4. Kiểm tra TypeScript và Build bản phát hành (Production Build)
npm run build

# 5. Xem trước bản build
npm run preview
```

---

## 📁 2. Cấu trúc thư mục dự án

Dự án tuân thủ nghiêm ngặt cấu trúc modular và sạch sẽ:

```text
LKHcards/
├── public/                 # Tài nguyên tĩnh, favicon SVG
├── scripts/                # Kịch bản sinh dữ liệu học thuật
├── src/
│   ├── components/         # Các thành phần giao diện tái sử dụng
│   │   ├── common/         # Button, Badge, Modal, v.v.
│   │   ├── deck/           # DeckCard, PreviewCard (3D flip), CardRowEditor, CardListItem, ImportDataModal
│   │   └── layout/         # AppLayout, Navbar (cố định), Sidebar, BottomNav (mobile)
│   ├── pages/              # Các trang chính
│   │   ├── HomePage.tsx        # Trang chủ: Khối Tiếp tục học, Cần ôn hôm nay, Lưới bộ thẻ
│   │   ├── DeckDetailPage.tsx  # Chi tiết bộ thẻ: Lưới 6 chế độ học, Xem nhanh thẻ 3D, Nhập từ vựng
│   │   ├── DeckEditorPage.tsx  # Tạo/Sửa bộ thẻ: Nhập dữ liệu hàng loạt, nhập nhanh bằng Tab/Enter
│   │   ├── DecksPage.tsx       # Thư viện: Lọc theo ngôn ngữ
│   │   ├── FlashcardsPage.tsx  # Chế độ học thẻ ghi nhớ toàn màn hình với phím tắt
│   │   ├── LearnPage.tsx       # Chế độ học SM-2 lặp lại ngắt quãng
│   │   ├── TestPage.tsx        # Chế độ kiểm tra: Đảo chiều câu hỏi (Thuận/Nghịch/Trộn 2 chiều)
│   │   ├── MatchPage.tsx       # Chế độ ghép thẻ tính giờ 0.1s
│   │   ├── TypeInPage.tsx      # Chế độ gõ từ nhớ chính tả (hỗ trợ đảo chiều 2 chiều)
│   │   ├── PracticePage.tsx    # Chế độ luyện tập: Điền từ vào câu & Hội thoại thực tế
│   │   ├── StatsPage.tsx       # Thống kê tiến độ học tập
│   │   ├── SettingsPage.tsx    # Cài đặt giao diện Dark mode, bảng màu Pastel Rose, test phát âm TTS
│   │   └── NotFoundPage.tsx    # Trang 404
│   ├── store/              # Quản lý trạng thái toàn cục qua Zustand (deckStore, themeStore)
│   ├── db/                 # Tầng lưu trữ IndexedDB qua Dexie & Repository Pattern
│   │   ├── database.ts         # Khởi tạo Dexie database schema
│   │   ├── dexieRepository.ts  # Hiện thực hóa IAppRepository trên IndexedDB
│   │   ├── seedData.ts         # Dữ liệu mẫu chuẩn Boya 1 tiếng Trung
│   │   ├── topikSeedData.ts    # Dữ liệu bộ thẻ TopikII 60 Đồng nghĩa tiếng Hàn
│   │   ├── boyaExercises.ts    # 80 câu điền từ & 20 đoạn hội thoại thực tế
│   │   └── index.ts            # Xuất khẩu repository instance thống nhất
│   ├── lib/                # Thư viện tiện ích và thuật toán cốt lõi
│   │   ├── importParser.ts     # Bộ phân tích dữ liệu nhập hàng loạt (Tab, Dấu hai chấm, Phẩy, Tùy chỉnh)
│   │   ├── testGenerator.ts    # Bộ sinh câu hỏi kiểm tra đảo chiều 2 chiều thông minh
│   │   ├── tts.ts              # Bộ phát âm chuẩn Web Speech API (hỗ trợ zh-CN, ko-KR, en-US, v.v.)
│   │   ├── sm2.ts              # Thuật toán lặp lại ngắt quãng SuperMemo 2 (SM-2)
│   │   ├── stringMatch.ts      # Thuật toán so khớp chuỗi Levenshtein chính tả mờ
│   │   └── utils.ts            # Ghép class Tailwind cn(), định dạng thời gian tiếng Việt
│   ├── types/              # Định nghĩa kiểu dữ liệu TypeScript
│   └── test/               # 31 Unit tests với Vitest
├── index.html              # HTML template gốc
├── LKHcards.bat            # Script khởi chạy nhanh trên Windows
├── package.json            # Cấu hình dự án và dependencies
├── tsconfig.json           # Cấu hình TypeScript
└── vite.config.ts          # Cấu hình Vite bundler
```

---

## 🎨 3. Thiết kế giao diện Pastel Pink (#FDDEE6)

Ứng dụng ứng dụng bảng màu pastel hoa anh đào tinh tế:
- **Màu chủ đạo (#FDDEE6)**: Được áp dụng trực tiếp cho Nút bấm chính (Primary Button), Hero Banner, Logo LKHcards, Tag Pro, và Tab điều hướng đang kích hoạt.
- **Tương phản chuẩn WCAG**: Văn bản trên nền pastel sử dụng sắc độ rượu vang quý phái (`#741634`), mang lại trải nghiệm đọc sách êm dịu, không bị mỏi mắt.
- **Hỗ trợ toàn diện Dark Mode**: Tự động chuyển đổi mượt mà giữa chế độ Sáng và Tối (Velvet Dark Mode).

---

## 🧠 4. Thuật toán SM-2 (SuperMemo 2 Spaced Repetition)

LKHcards áp dụng thuật toán lặp lại ngắt quãng tiêu chuẩn SM-2:
- Hệ số dễ ban đầu: $EF = 2.5$ (không bao giờ thấp hơn $1.3$).
- Khi người học đánh giá thẻ:
  - **Again (1)**: Thất bại, đưa số lần lặp về $0$, khoảng thời gian ôn tập trở lại $1$ ngày, tăng số lần trượt `lapses`.
  - **Hard (3)**, **Good (4)**, **Easy (5)**: Tăng số lần lặp, tính khoảng cách ôn tập tiếp theo:
    $$I(1) = 1 \text{ ngày}, \quad I(2) = 6 \text{ ngày}, \quad I(n) = I(n-1) \times EF$$
  - Điều chỉnh hệ số $EF$:
    $$EF' = EF + (0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02))$$

---

## 📋 5. Trạng thái kiểm thử

- **31/31 Unit Tests** chạy thành công 100% với Vitest.
- **Tối ưu hóa Code-splitting**: Toàn bộ các trang được nạp lười (`React.lazy` & `Suspense`), giúp ứng dụng khởi động tức thì dưới 1 giây.
- **Dữ liệu an toàn Offline**: Lưu trữ cục bộ vĩnh viễn trên trình duyệt thông qua IndexedDB (Dexie.js), không lo mất bài học khi mất mạng.
