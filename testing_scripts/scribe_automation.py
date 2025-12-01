"""
Scribe Automation - ควบคุม Browser เพื่อทำ Workflow โดยให้ Scribe Extension บันทึก Screenshots
ใช้งาน: python scribe_automation.py

ต้องติดตั้ง: pip install selenium webdriver-manager
และติดตั้ง Scribe Extension ใน Chrome
"""

import time
import json
import logging
import os
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# ตั้งค่า Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ScribeAutomation:
    """ควบคุม Browser เพื่อทำ Workflow สำหรับ Scribe Recording"""
    
    def __init__(self, base_url: str = "http://localhost:3093", headless: bool = False):
        self.base_url = base_url
        self.headless = headless
        self.driver = None
        self.wait = None
        self.test_results = []
        self.screenshots_count = 0
        
        # ข้อมูลการทดสอบ
        self.test_user = {
            "email": "EMP-101",
            "password": "user123"
        }
        
        self.test_asset = {
            "name": f"TEST-ASSET-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "serial": f"SN-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "assetType": "COMPUTER",
            "status": "ACTIVE"
        }
    
    def setup_driver(self):
        """ตั้งค่า Selenium WebDriver พร้อม Scribe Extension"""
        logger.info("🚀 เตรียมใช้งาน Chrome WebDriver...")
        
        chrome_options = Options()
        
        # ไม่ใช้ headless เพื่อให้ Scribe Extension ทำงาน
        if self.headless:
            chrome_options.add_argument("--headless")
        
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--start-maximized")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
       #chrome_options.add_extension('/path/to/scribe-extension.crx')
        # เพิ่ม Scribe Extension (ถ้ามี)
        
        
        # Fix Windows path handling - get the correct chromedriver executable
        try:
            driver_path = ChromeDriverManager().install()
            logger.info(f"ChromeDriver path from manager: {driver_path}")
            
            # Ensure it's the actual chromedriver.exe, not a file inside the directory
            if not driver_path.endswith('chromedriver.exe'):
                driver_path = Path(driver_path).parent / 'chromedriver.exe'
            
            driver_path = str(driver_path)
            logger.info(f"Final ChromeDriver path: {driver_path}")
            
            # Create service object for newer Selenium versions
            service = Service(driver_path)
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.wait = WebDriverWait(self.driver, 15)
            
            logger.info("✅ WebDriver พร้อมใช้งาน")
            logger.info(f"⚠️ เปิด Scribe Extension บน Browser เพื่อเริ่มบันทึก")
        except Exception as e:
            logger.error(f"❌ Failed to initialize WebDriver: {e}")
            raise
    
    def teardown_driver(self):
        """ปิด WebDriver"""
        if self.driver:
            self.driver.quit()
            logger.info("🛑 WebDriver ปิดแล้ว")
    
    def pause_for_scribe(self, duration: float = 2):
        """หยุดรอสักครู่เพื่อให้ Scribe บันทึก screenshots"""
        time.sleep(duration)
    
    def navigate_to(self, url: str):
        """นำทางไปยัง URL"""
        full_url = f"{self.base_url}{url}"
        logger.info(f"📍 นำทางไปยัง: {full_url}")
        self.driver.get(full_url)
        self.pause_for_scribe(1)
    
    def click_element(self, selector: str, by: By = By.CSS_SELECTOR, description: str = ""):
        """คลิกที่ element"""
        try:
            element = self.wait.until(EC.element_to_be_clickable((by, selector)))
            desc = description or selector
            logger.info(f"🖱️  คลิก: {desc}")
            element.click()
            self.pause_for_scribe(0.5)
            return True
        except Exception as e:
            logger.error(f"❌ ไม่สามารถคลิก {desc}: {e}")
            return False
    
    def fill_input(self, selector: str, value: str, by: By = By.CSS_SELECTOR, description: str = ""):
        """กรอกข้อมูลในช่อง input"""
        try:
            element = self.wait.until(EC.presence_of_element_located((by, selector)))
            desc = description or selector
            logger.info(f"⌨️  กรอก: {desc} = {value}")
            element.clear()
            element.send_keys(value)
            self.pause_for_scribe(0.5)
            return True
        except Exception as e:
            logger.error(f"❌ ไม่สามารถกรอก {desc}: {e}")
            return False
    
    def wait_for_element(self, selector: str, by: By = By.CSS_SELECTOR, timeout: int = 15):
        """รอให้ element ปรากฏ"""
        try:
            self.wait.until(EC.presence_of_element_located((by, selector)))
            return True
        except Exception as e:
            logger.error(f"❌ Element ไม่ปรากฏ: {selector}")
            return False
    
    def get_page_title(self) -> str:
        """ได้รับชื่อหน้า"""
        return self.driver.title
    
    def scroll_to_element(self, selector: str, by: By = By.CSS_SELECTOR):
        """เลื่อนหน้าไปยัง element"""
        try:
            element = self.driver.find_element(by, selector)
            self.driver.execute_script("arguments[0].scrollIntoView(true);", element)
            self.pause_for_scribe(0.5)
            return True
        except Exception as e:
            logger.error(f"❌ ไม่สามารถเลื่อนไปยัง {selector}: {e}")
            return False
    
    # ===== WORKFLOW: Login =====
    def workflow_login(self):
        """Workflow: เข้าสู่ระบบ"""
        logger.info("\n" + "="*60)
        logger.info("📝 WORKFLOW: LOGIN")
        logger.info("="*60)
        
        try:
            # Step 1: นำทางไปหน้า Login
            self.navigate_to("/login")
            self.pause_for_scribe(2)
            
            # Step 2: กรอก Employee ID (ใช้ id selector แทน type)
            self.fill_input(
                '#employee_id',
                self.test_user["email"],
                by=By.CSS_SELECTOR,
                description="Employee ID"
            )
            
            # Step 3: กรอกรหัสผ่าน
            self.fill_input(
                '#password',
                self.test_user["password"],
                by=By.CSS_SELECTOR,
                description="Password"
            )
            
            # Step 4: คลิกปุ่ม Login
            self.click_element(
                'button[type="submit"]',
                by=By.CSS_SELECTOR,
                description="Login Button"
            )
            
            # รอให้ redirect ไปหน้า Dashboard
            time.sleep(3)
            self.pause_for_scribe(2)
            
            logger.info("✅ Login สำเร็จ")
            self.test_results.append({
                "workflow": "Login",
                "status": "SUCCESS",
                "timestamp": datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"❌ Login ล้มเหลว: {e}")
            self.test_results.append({
                "workflow": "Login",
                "status": "FAILED",
                "error": str(e)
            })
    
    # ===== WORKFLOW: View Dashboard =====
    def workflow_view_dashboard(self):
        """Workflow: ดูหน้า Dashboard"""
        logger.info("\n" + "="*60)
        logger.info("📊 WORKFLOW: VIEW DASHBOARD")
        logger.info("="*60)
        
        try:
            self.navigate_to("/dashboard")
            self.pause_for_scribe(2)
            
            # รอให้ Dashboard โหลด
            self.wait_for_element('[class*="dashboard"]')
            
            # เลื่อนดูข้อมูลต่างๆ
            self.scroll_to_element('body', description="View Full Dashboard")
            time.sleep(1)
            
            logger.info("✅ Dashboard แสดงผลสำเร็จ")
            self.test_results.append({
                "workflow": "View Dashboard",
                "status": "SUCCESS"
            })
            
        except Exception as e:
            logger.error(f"❌ Dashboard ล้มเหลว: {e}")
    
    # ===== WORKFLOW: Manage Assets =====
    def workflow_manage_assets(self):
        """Workflow: จัดการ Assets"""
        logger.info("\n" + "="*60)
        logger.info("📦 WORKFLOW: MANAGE ASSETS")
        logger.info("="*60)
        
        try:
            # Step 1: ไปหน้า Assets
            self.navigate_to("/assets")
            self.pause_for_scribe(2)
            
            # Step 2: คลิก Add Asset
            self.click_element(
                'button:has-text("Add"), button:contains("เพิ่ม")',
                by=By.XPATH,
                description="Add Asset Button"
            )
            time.sleep(1)
            
            # Step 3: กรอกข้อมูล Asset
            self.fill_input(
                'input[placeholder*="name"], input[placeholder*="Name"]',
                self.test_asset["name"],
                by=By.XPATH,
                description="Asset Name"
            )
            
            # Step 4: เลือก Asset Type
            self.click_element(
                'select, [role="combobox"]',
                description="Asset Type Dropdown"
            )
            time.sleep(0.5)
            
            # Step 5: Save
            self.click_element(
                'button[type="submit"], button:contains("Save")',
                by=By.XPATH,
                description="Save Button"
            )
            
            time.sleep(2)
            self.pause_for_scribe(2)
            
            logger.info("✅ Asset Management สำเร็จ")
            self.test_results.append({
                "workflow": "Manage Assets",
                "status": "SUCCESS"
            })
            
        except Exception as e:
            logger.error(f"❌ Asset Management ล้มเหลว: {e}")
    
    # ===== WORKFLOW: View Users =====
    def workflow_view_users(self):
        """Workflow: ดูรายชื่อผู้ใช้"""
        logger.info("\n" + "="*60)
        logger.info("👥 WORKFLOW: VIEW USERS")
        logger.info("="*60)
        
        try:
            self.navigate_to("/users")
            self.pause_for_scribe(2)
            
            # รอให้ตารางโหลด
            self.wait_for_element('table, [role="grid"]', by=By.XPATH)
            
            # เลื่อนดูรายชื่อ
            self.scroll_to_element('body')
            
            logger.info("✅ User List แสดงผลสำเร็จ")
            self.test_results.append({
                "workflow": "View Users",
                "status": "SUCCESS"
            })
            
        except Exception as e:
            logger.error(f"❌ View Users ล้มเหลว: {e}")
    
    # ===== WORKFLOW: Manage Software =====
    def workflow_manage_software(self):
        """Workflow: จัดการ Software"""
        logger.info("\n" + "="*60)
        logger.info("💿 WORKFLOW: MANAGE SOFTWARE")
        logger.info("="*60)
        
        try:
            self.navigate_to("/software")
            self.pause_for_scribe(2)
            
            # คลิก Add Software
            self.click_element(
                'button:contains("Add"), button:contains("เพิ่ม")',
                by=By.XPATH,
                description="Add Software Button"
            )
            
            time.sleep(1)
            self.pause_for_scribe(1)
            
            logger.info("✅ Software Management สำเร็จ")
            self.test_results.append({
                "workflow": "Manage Software",
                "status": "SUCCESS"
            })
            
        except Exception as e:
            logger.error(f"❌ Software Management ล้มเหลว: {e}")
    
    # ===== WORKFLOW: Inventory Management =====
    def workflow_inventory_management(self):
        """Workflow: จัดการ Inventory"""
        logger.info("\n" + "="*60)
        logger.info("📋 WORKFLOW: INVENTORY MANAGEMENT")
        logger.info("="*60)
        
        try:
            self.navigate_to("/inventory")
            self.pause_for_scribe(2)
            
            # เลื่อนดูข้อมูล
            self.scroll_to_element('body')
            time.sleep(1)
            
            logger.info("✅ Inventory Management สำเร็จ")
            self.test_results.append({
                "workflow": "Inventory Management",
                "status": "SUCCESS"
            })
            
        except Exception as e:
            logger.error(f"❌ Inventory Management ล้มเหลว: {e}")
    
    # ===== WORKFLOW: View Reports =====
    def workflow_view_reports(self):
        """Workflow: ดูรายงาน"""
        logger.info("\n" + "="*60)
        logger.info("📈 WORKFLOW: VIEW REPORTS")
        logger.info("="*60)
        
        try:
            self.navigate_to("/reports")
            self.pause_for_scribe(2)
            
            # รอให้ report โหลด
            self.wait_for_element('canvas, [role="img"]', by=By.XPATH)
            
            # เลื่อนดูรายงาน
            self.scroll_to_element('body')
            
            logger.info("✅ Reports แสดงผลสำเร็จ")
            self.test_results.append({
                "workflow": "View Reports",
                "status": "SUCCESS"
            })
            
        except Exception as e:
            logger.error(f"❌ View Reports ล้มเหลว: {e}")
    
    # ===== WORKFLOW: Borrowing Management =====
    def workflow_borrowing_management(self):
        """Workflow: จัดการการยืม"""
        logger.info("\n" + "="*60)
        logger.info("📤 WORKFLOW: BORROWING MANAGEMENT")
        logger.info("="*60)
        
        try:
            self.navigate_to("/borrowing")
            self.pause_for_scribe(2)
            
            # คลิก Add Borrowing
            self.click_element(
                'button:contains("Add"), button:contains("เพิ่ม")',
                by=By.XPATH,
                description="Add Borrowing Button"
            )
            
            time.sleep(1)
            self.pause_for_scribe(1)
            
            logger.info("✅ Borrowing Management สำเร็จ")
            self.test_results.append({
                "workflow": "Borrowing Management",
                "status": "SUCCESS"
            })
            
        except Exception as e:
            logger.error(f"❌ Borrowing Management ล้มเหลว: {e}")
    
    def run_all_workflows(self):
        """รันทุก Workflow"""
        logger.info("\n🎬 เริ่มต้นการทดสอบทั้งหมด...")
        logger.info("⚠️  ตรวจสอบให้แน่ใจว่า Scribe Extension กำลังบันทึก")
        
        self.setup_driver()
        
        try:
            # ระบุ Workflow ที่ต้องการทดสอบ
            workflows = [
                self.workflow_login,
                self.workflow_view_dashboard,
                self.workflow_view_users,
                self.workflow_manage_assets,
                self.workflow_manage_software,
                self.workflow_inventory_management,
                self.workflow_view_reports,
                self.workflow_borrowing_management,
            ]
            
            for workflow in workflows:
                try:
                    workflow()
                    self.pause_for_scribe(2)
                except Exception as e:
                    logger.error(f"❌ Error ในการรัน workflow: {e}")
                    continue
            
            logger.info("\n" + "="*60)
            logger.info("🏁 เสร็จสิ้นการทดสอบทั้งหมด")
            logger.info("="*60)
            
        finally:
            self.teardown_driver()
            self.save_results()
    
    def save_results(self):
        """บันทึกผลการทดสอบ"""
        output_file = Path(__file__).parent / "scribe_test_results.json"
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "base_url": self.base_url,
            "total_workflows": len(self.test_results),
            "passed": sum(1 for r in self.test_results if r.get("status") == "SUCCESS"),
            "failed": sum(1 for r in self.test_results if r.get("status") == "FAILED"),
            "results": self.test_results
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        logger.info(f"✅ ผลการทดสอบบันทึกไว้ที่: {output_file}")
        logger.info(f"\n📊 สรุปผล:")
        logger.info(f"  - ทั้งหมด: {report['total_workflows']}")
        logger.info(f"  - สำเร็จ: {report['passed']}")
        logger.info(f"  - ล้มเหลว: {report['failed']}")

def main():
    """Main function"""
    automation = ScribeAutomation(
        base_url="http://localhost:3093",
        headless=False  # ต้องไม่ใช้ headless เพื่อให้ Scribe ทำงาน
    )
    
    print("\n" + "="*60)
    print("🎥 SCRIBE AUTOMATION TEST")
    print("="*60)
    print("\n📋 คำแนะนำ:")
    print("1. เปิด Chrome Browser")
    print("2. ติดตั้ง Scribe Extension จาก Chrome Web Store")
    print("3. คลิก 'Record' บน Scribe Extension")
    print("4. รัน script นี้")
    print("5. การ click และ input จะถูกบันทึก")
    print("\n" + "="*60 + "\n")
    
    automation.run_all_workflows()

if __name__ == "__main__":
    main()
