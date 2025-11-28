# Asset CRUD Test Script

สคริปต์สำหรับทดสอบ CRUD operations ของ Asset API แบบอัตโนมัติ

## คุณสมบัติ

ทดสอบการทำงานของ API ทั้ง 4 operations:
- ✅ **CREATE**: สร้าง asset ใหม่พร้อม fields ทั้งหมด
- ✅ **READ**: อ่านข้อมูล asset ที่สร้าง
- ✅ **UPDATE**: อัปเดตข้อมูล asset
- ✅ **DELETE**: ลบ asset

## Fields ที่ทดสอบ

### ข้อมูลพื้นฐาน
- type, manufacturer, model, serialnumber
- purchasedate, purchaseprice, status

### Location & Organization (ใหม่)
- **building**: อาคารหรือโรงงาน
- **division**: ฝ่าย
- **section**: แผนก
- **area**: พื้นที่
- **pc_name**: ชื่อเครื่อง

### Operating System & Software (ใหม่)
- **operatingsystem**: ระบบปฏิบัติการ
- **os_version**: เวอร์ชัน Windows
- **os_key**: รหัสลิขสิทธิ์
- **ms_office_apps**: แอปพลิเคชัน MS Office
- **ms_office_version**: เวอร์ชัน MS Office
- **is_legally_purchased**: ซื้อถูกต้องตามกฎหมาย

### Technical Specs
- processor, memory, storage

## วิธีใช้งาน

### 1. ตรวจสอบว่า dev server ทำงานอยู่

```bash
npm run dev
```

Server ควรทำงานที่ `http://localhost:3000`

### 2. รันสคริปต์ทดสอบ

```bash
node scripts/test-asset-crud.mjs
```

### 3. ใช้ URL อื่น (ถ้าต้องการ)

```bash
API_BASE_URL=http://localhost:4000 node scripts/test-asset-crud.mjs
```

## ผลลัพธ์ที่คาดหวัง

```
🧪 Asset CRUD Test

═══ TEST 1: CREATE ═══
→ POST http://localhost:3000/api/assets
← 201 Created
✓ Created: AST-1234567890

═══ TEST 2: READ ═══
→ GET http://localhost:3000/api/assets/AST-1234567890
← 200 OK
✓ Read success
  pc_name: PC-TEST-001
  area: CALL_01

═══ TEST 3: UPDATE ═══
→ PUT http://localhost:3000/api/assets/AST-1234567890
← 200 OK
✓ Updated

═══ TEST 4: DELETE ═══
→ DELETE http://localhost:3000/api/assets/AST-1234567890
← 200 OK
✓ Deleted

✅ Test Complete
```

## การแก้ปัญหา

### ❌ fetch failed

**สาเหตุ**: Server ไม่ทำงานหรือ port ไม่ถูกต้อง

**แก้ไข**:
1. ตรวจสอบว่า `npm run dev` ทำงานอยู่
2. ตรวจสอบ port ที่ server ใช้
3. ลอง `curl http://localhost:3000/api/assets`

### ❌ 500 Internal Server Error

**สาเหตุ**: Database ยังไม่มีหรือ schema ไม่ตรง

**แก้ไข**:
1. ตรวจสอบการเชื่อมต่อ database
2. ตรวจสอบว่า table `assets` มี columns ใหม่ทั้งหมด

### ❌ Validation Error

**สาเหตุ**: Fields บังคับขาดหายไป

**แก้ไข**:
- ตรวจสอบว่า `type`, `manufacturer`, `model`, `serialnumber` ถูกส่งไปครบ

## การปรับแต่งข้อมูลทดสอบ

แก้ไขในไฟล์ `test-asset-crud.mjs`:

```javascript
const testData = {
  type: 'pc',           // เปลี่ยนเป็น 'laptop', 'desktop', etc.
  manufacturer: 'Dell', // เปลี่ยนยี่ห้อ
  model: 'XXX',        // เปลี่ยนรุ่น
  // ... เพิ่มหรือแก้ไข fields อื่นๆ
};
```

## หมายเหตุ

- สคริปต์จะสร้าง `serialnumber` แบบ unique ทุกครั้งที่รัน (ใช้ timestamp)
- Asset ที่สร้างจะถูกลบทิ้งหลังจากทดสอบเสร็จ
- หากต้องการเก็บ asset ไว้ ให้ comment บรรทัด DELETE ออก

## เพิ่มเติม

สคริปต์นี้เหมาะสำหรับ:
- ✅ ทดสอบหลังจากแก้ไข API
- ✅ Integration testing
- ✅ Smoke testing ตอน deploy
- ✅ ตรวจสอบว่า fields ใหม่ทำงานถูกต้อง
