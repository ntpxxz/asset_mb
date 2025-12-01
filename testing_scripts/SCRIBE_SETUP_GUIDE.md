# 🎥 Scribe Automation Testing Guide - แก้ไข 2025

## ขั้นตอนการตั้งค่าและใช้งาน

### 📋 ข้อกำหนดเบื้องต้น
- **Python 3.8+** ติดตั้งแล้ว
- **Chrome Browser** เวอร์ชันล่าสุด
- **Scribe Extension** ติดตั้งใน Chrome

---

## 🔧 ขั้นตอนการติดตั้ง

### 1️⃣ ติดตั้ง Scribe Extension

**วิธี:**
1. เปิด Chrome Browser
2. ไปที่ **Chrome Web Store**: https://chromewebstore.google.com/
3. ค้นหา "Scribe"
4. เลือก **Scribe - AI-powered Documentation**
5. คลิก **"Add to Chrome"**
6. ยืนยันโดยคลิก **"Add extension"**

### 2️⃣ ติดตั้ง Python Dependencies

```bash
cd e:\SAM\ITAM\asset_mb\testing_scripts

# ติดตั้ง Selenium และ WebDriver Manager
pip install -r requirements.txt
```

### 3️⃣ เตรียม Application

```bash
cd e:\SAM\ITAM\asset_mb

# เริ่ม development server
npm run dev

# Server จะทำงานที่ http://localhost:3091
```

---

## 🎬 การใช้งาน Scribe Automation

### ขั้นตอนที่ 1: เตรียม Scribe Extension

1. **เปิด Chrome DevTools** (F12)
2. **คลิกไปที่ Scribe Extension** ในมุมบนขวา
3. **คลิก "Record"** เพื่อเริ่มการบันทึก
4. **Scribe จะเริ่มบันทึก screenshots** ของการกระทำทั้งหมด

### ขั้นตอนที่ 2: รัน Automation Script

```bash
cd e:\SAM\ITAM\asset_mb\testing_scripts

# รัน Scribe Automation
python scribe_automation.py
```

### ขั้นตอนที่ 3: ติดตามการทดสอบ

Script จะทำการทดสอบตามลำดับนี้:

| ลำดับ | Workflow | คำอธิบาย |
|------|----------|---------|
| 1 | 📝 LOGIN | เข้าสู่ระบบด้วยบัญชีทดสอบ |
| 2 | 📊 VIEW DASHBOARD | ดูหน้า Dashboard |
| 3 | 👥 VIEW USERS | ดูรายชื่อผู้ใช้ |
| 4 | 📦 MANAGE ASSETS | จัดการ Assets |
| 5 | 💿 MANAGE SOFTWARE | จัดการ Software |
| 6 | 📋 INVENTORY MANAGEMENT | จัดการ Inventory |
| 7 | 📈 VIEW REPORTS | ดูรายงาน |
| 8 | 📤 BORROWING MANAGEMENT | จัดการการยืม |

### ขั้นตอนที่ 4: ปิด Scribe Recording

เมื่อ Script ทำงานเสร็จ:
1. **คลิก "Stop"** บน Scribe Extension
2. **Scribe จะสร้างเอกสาร** โดยอัตโนมัติ
3. **เอกสารจะแสดงขั้นตอนทั้งหมด** พร้อม screenshots

---

## ⚠️ ปัญหา: Scribe Extension ไม่ทำงาน - วิธีแก้

หากคุณพบว่า **Scribe Extension ไม่บันทึก** ให้ทำตามขั้นตอนต่อไปนี้:

### 🔧 ขั้นตอนการแก้ไข

#### 1️⃣ ติดตั้ง Scribe Extension ให้ถูกต้อง

```
เปิด Chrome:
1. ไปที่ chrome://extensions/
2. ค้นหา "Scribe" ในช่องค้นหา
3. ถ้ายังไม่มี ให้คลิก "Open Chrome Web Store"
4. ติดตั้ง "Scribe - AI-powered Documentation"
5. หลังติดตั้ง ให้คลิก "Details" ของ Scribe
6. เปิดใช้งาน "Allow in Chrome"
7. เปิดใช้งาน "Allow access to file URLs"
```

#### 2️⃣ สร้าง User Data Directory สำหรับ Chrome

```bash
# สร้างโฟลเดอร์ที่จะเก็บ profile ของ Chrome
mkdir %USERPROFILE%\Chrome-Scribe-Profile

# หรือใช้ PowerShell:
New-Item -ItemType Directory -Path "$env:USERPROFILE\Chrome-Scribe-Profile" -Force
```

#### 3️⃣ ตั้งค่า Environment Variable

**สำหรับ Windows CMD:**
```batch
set CHROME_USER_DATA_DIR=%USERPROFILE%\Chrome-Scribe-Profile
```

**สำหรับ Windows PowerShell:**
```powershell
$env:CHROME_USER_DATA_DIR = "$env:USERPROFILE\Chrome-Scribe-Profile"
```

---

## 📊 ผลการทดสอบ

หลังจากรัน Script เสร็จสิ้น:

```json
{
  "timestamp": "2025-11-28T15:30:00",
  "base_url": "http://localhost:3091",
  "total_workflows": 8,
  "passed": 8,
  "failed": 0,
  "results": [
    {
      "workflow": "Login",
      "status": "SUCCESS",
      "timestamp": "2025-11-28T15:30:15"
    },
    ...
  ]
}
```

ไฟล์ผลการทดสอบจะบันทึกไว้ที่:
```
e:\SAM\ITAM\asset_mb\testing_scripts\scribe_test_results.json
```

---

## 🔐 บัญชีทดสอบ

สำหรับการทดสอบให้ใช้บัญชีต่อไปนี้:

```
Email/Employee ID: EMP-101
Password: user123
```

> ⚠️ **หมายเหตุ**: ต้องสร้างบัญชีนี้ในฐานข้อมูลก่อน หรือแก้ไข credentials ในไฟล์ `scribe_automation.py`

---

## 🛠️ การแก้ปัญหา

### ❌ ปัญหา: "Scribe Extension ไม่ปรากฏในการบันทึก"

**วิธีแก้:**
1. ไปที่ `chrome://extensions/`
2. ค้นหา Scribe และให้สิทธิ์ทั้งหมด
3. ลองใช้ Chrome Incognito Mode และลองใหม่
4. ลองติดตั้ง Scribe ใหม่

### ❌ ปัญหา: "ไม่พบ Element เมื่อรัน Script"

**วิธีแก้:**
1. ตรวจสอบ CSS Selectors ในไฟล์ HTML
2. แก้ไข selectors ในไฟล์ `scribe_automation.py`
3. เพิ่มเวลารอ (delay) ในเมธอด `pause_for_scribe(duration)`

### ❌ ปัญหา: "Script ไม่สามารถเชื่อมต่อ Application"

**วิธีแก้:**
1. ตรวจสอบว่า dev server ทำงาน: `npm run dev`
2. ตรวจสอบ port ให้ถูกต้อง (3091 หรือ 3093)
3. ลองเปลี่ยน URL เป็น `http://127.0.0.1:3091`

### ❌ ปัญหา: "ChromeDriver Path Error"

**วิธีแก้:**
1. ลบ `.venv/Lib/site-packages/webdriver_manager` directory
2. รัน: `pip install --upgrade webdriver-manager`
3. รัน script ใหม่

---

## 📝 ตัวอย่างการสร้างขั้นตอนใหม่

เพื่อเพิ่ม workflow ใหม่ ให้เพิ่มเมธอด:

```python
def workflow_custom_action(self):
    """Workflow: ชื่อการทดสอบ"""
    logger.info("\n" + "="*60)
    logger.info("🎯 WORKFLOW: CUSTOM ACTION")
    logger.info("="*60)
    
    try:
        # Step 1: นำทาง
        self.navigate_to("/your-page")
        self.pause_for_scribe(2)
        
        # Step 2: ทำการกระทำ
        self.click_element(
            'button.your-selector',
            description="Your Button"
        )
        
        # Step 3: รอและบันทึก
        self.pause_for_scribe(2)
        
        logger.info("✅ Custom Action สำเร็จ")
        self.test_results.append({
            "workflow": "Custom Action",
            "status": "SUCCESS"
        })
        
    except Exception as e:
        logger.error(f"❌ Custom Action ล้มเหลว: {e}")
```

จากนั้นเพิ่มไปใน `run_all_workflows()`:

```python
workflows = [
    self.workflow_login,
    self.workflow_custom_action,  # ✨ เพิ่มใหม่
    ...
]
```

---

## 🚀 Quick Start Command

```bash
# 1. ติดตั้ง dependencies
pip install -r testing_scripts/requirements.txt

# 2. เริ่ม dev server
npm run dev

# 3. เปิด Scribe Recording ใน Chrome
# (คลิก Scribe Extension -> Record)

# 4. รัน Automation Script
python testing_scripts/scribe_automation.py

# 5. ปิด Scribe Recording เมื่อเสร็จ
# (คลิก Stop บน Scribe Extension)

# 6. ดูผลการทดสอบ
cat testing_scripts/scribe_test_results.json
```

---

## 📚 Resources

- [Scribe Official](https://scribehow.com/)
- [Chrome Web Store - Scribe](https://chromewebstore.google.com/detail/scribe/eomegdlopdcbkjilalkhgjemkpcfhaan)
- [Selenium Documentation](https://www.selenium.dev/documentation/)
- [WebDriver Manager](https://github.com/SergeyPirogov/webdriver-manager)

---

## ✅ Checklist ก่อนใช้งาน

- [ ] Chrome Browser ติดตั้งแล้ว
- [ ] Scribe Extension ติดตั้งแล้ว (chrome://extensions/)
- [ ] Scribe Extension ถูกเปิดใช้งาน (Enable toggle)
- [ ] Scribe Extension มีสิทธิ์ "Allow access to file URLs"
- [ ] Python 3.8+ ติดตั้งแล้ว
- [ ] Dependencies ติดตั้งแล้ว (`pip install -r requirements.txt`)
- [ ] Dev server ทำงาน (`npm run dev`)
- [ ] บัญชีทดสอบ EMP-101 มีอยู่ในระบบ
- [ ] Chrome User Data Directory สร้างแล้ว

---

**ขอให้ประสบความสำเร็จในการสร้างเอกสาร! 🎉**
