"""
Code Analyzer - วิเคราะห์ TypeScript/JavaScript Code และแยก API Functions
ใช้งาน: python code_analyzer.py
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Tuple

class CodeAnalyzer:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.api_routes = {}
        self.functions = []
        self.schemas = []
        
    def scan_api_routes(self):
        """สแกน API routes จาก app/api directory"""
        api_dir = self.project_root / "app" / "api"
        
        if not api_dir.exists():
            print(f"❌ ไม่พบไดเรกทอรี: {api_dir}")
            return
        
        print(f"📂 สแกน API routes จาก: {api_dir}")
        
        for route_file in api_dir.rglob("route.ts"):
            relative_path = route_file.relative_to(api_dir)
            self.extract_route_info(route_file, relative_path)
    
    def extract_route_info(self, file_path: Path, relative_path: Path):
        """แยกข้อมูล API endpoint จากไฟล์ route.ts"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # สกัด endpoint path
            endpoint = str(relative_path).replace("\\", "/").replace("/route.ts", "").replace("[id]", "{id}")
            
            # สกัด HTTP methods
            methods = self.extract_http_methods(content)
            
            # สกัด Zod schemas
            schemas = self.extract_zod_schemas(content)
            
            # สกัด function descriptions
            functions = self.extract_function_definitions(content)
            
            self.api_routes[endpoint] = {
                "file": str(file_path),
                "methods": methods,
                "schemas": schemas,
                "functions": functions
            }
            
            print(f"✅ พบ API: /api/{endpoint} - Methods: {', '.join(methods)}")
            
        except Exception as e:
            print(f"❌ Error processing {file_path}: {e}")
    
    def extract_http_methods(self, content: str) -> List[str]:
        """แยก HTTP methods (GET, POST, PUT, DELETE, PATCH)"""
        methods = []
        for method in ["GET", "POST", "PUT", "DELETE", "PATCH"]:
            pattern = rf'export\s+async\s+function\s+{method}\s*\('
            if re.search(pattern, content):
                methods.append(method)
        return sorted(methods)
    
    def extract_zod_schemas(self, content: str) -> List[Dict]:
        """แยก Zod validation schemas"""
        schemas = []
        pattern = r'const\s+(\w+Schema)\s*=\s*z\.object\s*\(\s*\{([^}]+)\}'
        
        matches = re.finditer(pattern, content, re.DOTALL)
        for match in matches:
            schema_name = match.group(1)
            schema_body = match.group(2)
            
            fields = []
            field_pattern = r'(\w+)\s*:\s*z\.(\w+)\s*\([^)]*\)'
            for field_match in re.finditer(field_pattern, schema_body):
                field_name = field_match.group(1)
                field_type = field_match.group(2)
                fields.append({"name": field_name, "type": field_type})
            
            schemas.append({
                "name": schema_name,
                "fields": fields
            })
        
        return schemas
    
    def extract_function_definitions(self, content: str) -> List[Dict]:
        """แยก function definitions"""
        functions = []
        
        pattern = r'async\s+function\s+(\w+)\s*\([^)]*\)(?:\s*:\s*[^{]+)?\s*\{'
        matches = re.finditer(pattern, content)
        
        for match in matches:
            func_name = match.group(1)
            if func_name not in ["GET", "POST", "PUT", "DELETE", "PATCH"]:
                functions.append({"name": func_name})
        
        return functions
    
    def scan_lib_files(self):
        """สแกน lib directory สำหรับ utilities และ APIs"""
        lib_dir = self.project_root / "lib"
        
        if not lib_dir.exists():
            return
        
        print(f"\n📂 สแกน lib files จาก: {lib_dir}")
        
        for ts_file in lib_dir.glob("*.ts*"):
            if ts_file.name.startswith("."):
                continue
            
            self.extract_lib_file_info(ts_file)
    
    def extract_lib_file_info(self, file_path: Path):
        """แยกข้อมูล API clients และ utilities จากไฟล์ lib"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            pattern = r'export\s+const\s+(\w+)\s*=\s*\{([^}]+)\}'
            matches = re.finditer(pattern, content, re.DOTALL)
            
            for match in matches:
                obj_name = match.group(1)
                obj_body = match.group(2)
                
                methods = re.findall(r'(\w+)\s*:\s*\([^)]*\)\s*=>', obj_body)
                
                print(f"✅ พบ API Client: {obj_name} - Methods: {', '.join(methods)}")
                
        except Exception as e:
            print(f"❌ Error processing {file_path}: {e}")
    
    def generate_report(self, output_file: str = None):
        """สร้างรายงานการวิเคราะห์"""
        report = {
            "project": str(self.project_root),
            "api_routes": self.api_routes,
            "total_endpoints": len(self.api_routes),
            "summary": self.get_summary()
        }
        
        report_json = json.dumps(report, indent=2, ensure_ascii=False)
        
        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(report_json)
            print(f"\n✅ รายงานบันทึกไว้ที่: {output_file}")
        else:
            print("\n" + "="*60)
            print("📊 รายงานการวิเคราะห์ Code")
            print("="*60)
            print(report_json)
        
        return report
    
    def get_summary(self) -> Dict:
        """รวมข้อมูล endpoints ตามประเภท"""
        summary = {
            "total_endpoints": len(self.api_routes),
            "endpoints_by_method": {},
            "endpoints_list": []
        }
        
        for endpoint, info in self.api_routes.items():
            summary["endpoints_list"].append({
                "endpoint": f"/api/{endpoint}",
                "methods": info["methods"]
            })
            
            for method in info["methods"]:
                if method not in summary["endpoints_by_method"]:
                    summary["endpoints_by_method"][method] = 0
                summary["endpoints_by_method"][method] += 1
        
        return summary

def main():
    project_root = "e:\\SAM\\ITAM\\asset_mb"
    
    analyzer = CodeAnalyzer(project_root)
    analyzer.scan_api_routes()
    analyzer.scan_lib_files()
    
    output_file = os.path.join(project_root, "testing_scripts", "code_analysis_report.json")
    report = analyzer.generate_report(output_file)
    
    print("\n📈 สถิติ:")
    print(f"  - จำนวน Endpoints ทั้งหมด: {report['summary']['total_endpoints']}")
    print(f"  - ดิสทริบิวชัน Methods: {report['summary']['endpoints_by_method']}")

if __name__ == "__main__":
    main()
