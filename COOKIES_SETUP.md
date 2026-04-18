# Hướng dẫn tạo cookies.txt để fix lỗi "Login required"

## Bước 1: Cài extension trình duyệt

### Chrome/Edge:
- Cài [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)

### Firefox:
- Cài [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)

## Bước 2: Export cookies

1. Đăng nhập vào YouTube (youtube.com)
2. Click vào extension icon
3. Chọn "Export" hoặc "Current Site"
4. Lưu file với tên `cookies.txt`

## Bước 3: Đặt file vào project

Đặt file `cookies.txt` vào thư mục gốc của vidgrab:
```
/Volumes/EXTERNAL/01_DEV_PROJECTS/MyApps/VideoDownloads/vidgrab/cookies.txt
```

## Bước 4: Restart server

```bash
npm run dev
```

---

**Lưu ý bảo mật:**
- File cookies.txt chứa session của bạn - KHÔNG commit lên git!
- File đã được thêm vào .gitignore
