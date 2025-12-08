import pandas as pd

# 1. อ่านไฟล์ CSV
df = pd.read_csv('assets (7).csv')

# 2. รายชื่อคอลัมน์ที่ตรงกับ Database เท่านั้น (ตัดตัวเกินออก)
schema_cols = [
    'id', 'asset_tag', 'type', 'manufacturer', 'model', 'serialnumber',
    'purchasedate', 'purchaseprice', 'supplier', 'warrantyexpiry',
    'assigneduser', 'location', 'department', 'building', 'division',
    'section', 'area', 'pc_name', 'status', 'condition',
    'operatingsystem', 'os_version', 'os_key', 'ms_office_apps',
    'ms_office_version', 'is_legally_purchased', 'processor', 'memory',
    'storage', 'hostname', 'ipaddress', 'macaddress', 'patchstatus',
    'lastpatch_check', 'isloanable', 'description', 'notes',
    'created_at', 'updated_at'
]

# 3. ฟังก์ชันจัดการข้อมูล (Escape String & Handle NULL)
def escape_val(val):
    if pd.isna(val) or val == '' or str(val).lower() == 'nan':
        return 'NULL'
    if isinstance(val, bool):
        return str(val).lower()
    # จัดการเครื่องหมาย ' ในข้อความ (เช่น User's PC)
    return f"'{str(val).replace("'", "''")}'"

# 4. สร้างคำสั่ง INSERT
sql_lines = ["BEGIN;"]
for _, row in df.iterrows():
    # ดึงค่าเฉพาะคอลัมน์ที่มีใน Schema
    vals = []
    for col in schema_cols:
        if col in df.columns:
            vals.append(escape_val(row[col]))
        else:
            vals.append('NULL')
            
    columns_str = ", ".join(schema_cols)
    values_str = ", ".join(vals)
    # ใช้ ON CONFLICT DO NOTHING เพื่อกัน Error ถ้ามี ID ซ้ำ
    stmt = f"INSERT INTO assets ({columns_str}) VALUES ({values_str}) ON CONFLICT (id) DO NOTHING;"
    sql_lines.append(stmt)

sql_lines.append("COMMIT;")

# 5. บันทึกไฟล์
with open('restore_assets_final.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print("✅ สร้างไฟล์ SQL สำเร็จ: restore_assets_final.sql")