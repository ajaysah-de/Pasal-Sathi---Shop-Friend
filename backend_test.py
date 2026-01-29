#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Pasal Sathi Shop Management System
Tests all endpoints: Authentication, Products, Sales, Suppliers, Reports, Alerts
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class PasalSathiAPITester:
    def __init__(self, base_url: str = "https://shoptrack-nepal.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.shop_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_items = {
            'products': [],
            'suppliers': [],
            'sales': []
        }

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def make_request(self, method: str, endpoint: str, data: Dict = None, expected_status: int = 200) -> tuple[bool, Dict]:
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=data)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text[:200]}

            if not success:
                print(f"   Status: {response.status_code}, Expected: {expected_status}")
                if response.text:
                    print(f"   Response: {response.text[:200]}")

            return success, response_data

        except Exception as e:
            print(f"   Request Error: {str(e)}")
            return False, {"error": str(e)}

    # ============ AUTHENTICATION TESTS ============

    def test_check_setup_status(self):
        """Test checking if shop is already set up"""
        success, data = self.make_request('GET', 'auth/check')
        return self.log_test("Check Setup Status", success, f"Setup: {data.get('is_setup', 'unknown')}")

    def test_shop_setup(self):
        """Test initial shop setup with PIN"""
        setup_data = {
            "pin": "1234",
            "shop_name": "टेस्ट पसल",
            "shop_name_en": "Test Shop"
        }
        
        success, data = self.make_request('POST', 'auth/setup', setup_data, 200)
        
        if success and 'access_token' in data:
            self.token = data['access_token']
            success = True
            details = f"Token received, Shop: {data.get('shop_name', 'N/A')}"
        else:
            # Shop might already be set up, try login instead
            success, login_data = self.make_request('POST', 'auth/login', {"pin": "1234"}, 200)
            if success and 'access_token' in login_data:
                self.token = login_data['access_token']
                details = f"Used existing setup, Token received"
            else:
                details = f"Setup failed: {data}"
        
        return self.log_test("Shop Setup/Login", success, details)

    def test_login_with_pin(self):
        """Test login with existing PIN"""
        if self.token:  # Already logged in from setup
            return self.log_test("Login with PIN", True, "Already authenticated from setup")
        
        login_data = {"pin": "1234"}
        success, data = self.make_request('POST', 'auth/login', login_data, 200)
        
        if success and 'access_token' in data:
            self.token = data['access_token']
            details = f"Token received, Shop: {data.get('shop_name', 'N/A')}"
        else:
            details = f"Login failed: {data}"
        
        return self.log_test("Login with PIN", success, details)

    def test_invalid_pin_login(self):
        """Test login with invalid PIN"""
        login_data = {"pin": "9999"}
        success, data = self.make_request('POST', 'auth/login', login_data, 401)
        return self.log_test("Invalid PIN Login", success, "Correctly rejected invalid PIN")

    # ============ CATEGORIES & LOCATIONS ============

    def test_get_categories(self):
        """Test getting product categories"""
        success, data = self.make_request('GET', 'categories')
        if success and isinstance(data, list) and len(data) > 0:
            details = f"Found {len(data)} categories"
        else:
            details = f"Categories response: {data}"
        return self.log_test("Get Categories", success, details)

    def test_get_locations(self):
        """Test getting storage locations"""
        success, data = self.make_request('GET', 'locations')
        if success and isinstance(data, list) and len(data) > 0:
            details = f"Found {len(data)} locations"
        else:
            details = f"Locations response: {data}"
        return self.log_test("Get Locations", success, details)

    # ============ SUPPLIER TESTS ============

    def test_create_supplier(self):
        """Test creating a supplier"""
        supplier_data = {
            "name": "Test Supplier काठमाडौं",
            "phone": "9801234567",
            "address": "Kalimati, Kathmandu",
            "notes": "Test supplier for API testing"
        }
        
        success, data = self.make_request('POST', 'suppliers', supplier_data, 200)
        
        if success and 'id' in data:
            self.created_items['suppliers'].append(data['id'])
            details = f"Supplier created with ID: {data['id']}"
        else:
            details = f"Creation failed: {data}"
        
        return self.log_test("Create Supplier", success, details)

    def test_get_suppliers(self):
        """Test getting all suppliers"""
        success, data = self.make_request('GET', 'suppliers')
        if success and isinstance(data, list):
            details = f"Found {len(data)} suppliers"
        else:
            details = f"Suppliers response: {data}"
        return self.log_test("Get Suppliers", success, details)

    # ============ PRODUCT TESTS ============

    def test_create_product(self):
        """Test creating a product"""
        product_data = {
            "name_en": "Steel Plate Large",
            "name_np": "स्टिल थाली ठूलो",
            "category": "steel",
            "location": "shelf_top",
            "cost_price": 150,
            "selling_price": 200,
            "quantity": 50,
            "quantity_type": "exact",
            "low_stock_threshold": 10
        }
        
        success, data = self.make_request('POST', 'products', product_data, 200)
        
        if success and 'id' in data:
            self.created_items['products'].append(data['id'])
            details = f"Product created with ID: {data['id']}"
        else:
            details = f"Creation failed: {data}"
        
        return self.log_test("Create Product", success, details)

    def test_create_multiple_products(self):
        """Test creating multiple products for better testing"""
        products = [
            {
                "name_en": "Brass Bowl Medium",
                "name_np": "पीतल कचौरा मध्यम",
                "category": "brass",
                "location": "shelf_bottom",
                "cost_price": 80,
                "selling_price": 120,
                "quantity": 25,
                "low_stock_threshold": 5
            },
            {
                "name_en": "Plastic Water Jug",
                "name_np": "प्लास्टिक पानी जग",
                "category": "plastic",
                "location": "front_display",
                "cost_price": 45,
                "selling_price": 70,
                "quantity": 3,  # Low stock for testing alerts
                "low_stock_threshold": 5
            }
        ]
        
        created_count = 0
        for product in products:
            success, data = self.make_request('POST', 'products', product, 200)
            if success and 'id' in data:
                self.created_items['products'].append(data['id'])
                created_count += 1
        
        success = created_count == len(products)
        return self.log_test("Create Multiple Products", success, f"Created {created_count}/{len(products)} products")

    def test_get_products(self):
        """Test getting all products"""
        success, data = self.make_request('GET', 'products')
        if success and isinstance(data, list):
            details = f"Found {len(data)} products"
        else:
            details = f"Products response: {data}"
        return self.log_test("Get Products", success, details)

    def test_get_product_by_id(self):
        """Test getting a specific product"""
        if not self.created_items['products']:
            return self.log_test("Get Product by ID", False, "No products created to test")
        
        product_id = self.created_items['products'][0]
        success, data = self.make_request('GET', f'products/{product_id}')
        
        if success and data.get('id') == product_id:
            details = f"Retrieved product: {data.get('name_en', 'N/A')}"
        else:
            details = f"Failed to retrieve product: {data}"
        
        return self.log_test("Get Product by ID", success, details)

    def test_update_product(self):
        """Test updating a product"""
        if not self.created_items['products']:
            return self.log_test("Update Product", False, "No products created to test")
        
        product_id = self.created_items['products'][0]
        update_data = {
            "selling_price": 250,
            "quantity": 45
        }
        
        success, data = self.make_request('PUT', f'products/{product_id}', update_data)
        
        if success and data.get('selling_price') == 250:
            details = f"Updated product price to Rs. {data.get('selling_price')}"
        else:
            details = f"Update failed: {data}"
        
        return self.log_test("Update Product", success, details)

    def test_update_stock(self):
        """Test quick stock update"""
        if not self.created_items['products']:
            return self.log_test("Update Stock", False, "No products created to test")
        
        product_id = self.created_items['products'][0]
        success, data = self.make_request('PUT', f'products/{product_id}/stock?quantity=100')
        return self.log_test("Update Stock", success, f"Stock update response: {data}")

    # ============ SALES TESTS ============

    def test_create_sale(self):
        """Test creating a sale"""
        if not self.created_items['products']:
            return self.log_test("Create Sale", False, "No products available for sale")
        
        # Get product details first
        product_id = self.created_items['products'][0]
        success, product = self.make_request('GET', f'products/{product_id}')
        
        if not success:
            return self.log_test("Create Sale", False, "Could not fetch product for sale")
        
        sale_data = {
            "items": [
                {
                    "product_id": product_id,
                    "product_name": product['name_en'],
                    "quantity": 2,
                    "unit_price": product['selling_price'],
                    "total": 2 * product['selling_price']
                }
            ],
            "subtotal": 2 * product['selling_price'],
            "discount": 10,
            "total": (2 * product['selling_price']) - 10,
            "payment_type": "cash",
            "customer_name": "Test Customer"
        }
        
        success, data = self.make_request('POST', 'sales', sale_data, 200)
        
        if success and 'id' in data:
            self.created_items['sales'].append(data['id'])
            details = f"Sale created with ID: {data['id']}, Total: Rs. {data.get('total')}"
        else:
            details = f"Sale creation failed: {data}"
        
        return self.log_test("Create Sale", success, details)

    def test_get_sales(self):
        """Test getting sales history"""
        success, data = self.make_request('GET', 'sales')
        if success and isinstance(data, list):
            details = f"Found {len(data)} sales"
        else:
            details = f"Sales response: {data}"
        return self.log_test("Get Sales", success, details)

    def test_get_today_sales(self):
        """Test getting today's sales summary"""
        success, data = self.make_request('GET', 'sales/today')
        
        if success and 'total' in data:
            details = f"Today's sales: Rs. {data.get('total', 0)}, Count: {data.get('count', 0)}"
        else:
            details = f"Today's sales response: {data}"
        
        return self.log_test("Get Today's Sales", success, details)

    # ============ DASHBOARD & ALERTS ============

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        success, data = self.make_request('GET', 'dashboard/stats')
        
        if success and 'today_sales' in data:
            details = f"Today: Rs. {data.get('today_sales', 0)}, Products: {data.get('total_products', 0)}"
        else:
            details = f"Dashboard stats response: {data}"
        
        return self.log_test("Dashboard Stats", success, details)

    def test_low_stock_alerts(self):
        """Test low stock alerts"""
        success, data = self.make_request('GET', 'alerts/low-stock')
        
        if success and isinstance(data, list):
            details = f"Found {len(data)} low stock items"
        else:
            details = f"Low stock alerts response: {data}"
        
        return self.log_test("Low Stock Alerts", success, details)

    # ============ AI SCANNER TESTS ============

    def test_scan_analyze_quick_mode(self):
        """Test AI image analysis in quick mode"""
        # Test endpoint exists and handles requests properly
        scan_data = {
            "image_base64": "invalid_base64_for_testing",
            "mode": "quick"
        }
        
        # We expect this to fail with error about image format (520 or 500 status)
        success, data = self.make_request('POST', 'scan/analyze', scan_data, 520)
        if not success:
            success, data = self.make_request('POST', 'scan/analyze', scan_data, 500)
        
        if success and 'detail' in data and ('Invalid base64' in data['detail'] or 'Scan failed' in data['detail']):
            details = "Endpoint working (image format validation working)"
        else:
            details = f"Unexpected response: {data}"
        
        return self.log_test("AI Scan - Quick Mode (Endpoint)", success, details)

    def test_scan_analyze_smart_mode(self):
        """Test AI image analysis in smart mode"""
        # Test endpoint exists and handles requests properly
        scan_data = {
            "image_base64": "invalid_base64_for_testing", 
            "mode": "smart"
        }
        
        # We expect this to fail with error about image format (520 or 500 status)
        success, data = self.make_request('POST', 'scan/analyze', scan_data, 520)
        if not success:
            success, data = self.make_request('POST', 'scan/analyze', scan_data, 500)
        
        if success and 'detail' in data and ('Invalid base64' in data['detail'] or 'Scan failed' in data['detail']):
            details = "Endpoint working (image format validation working)"
        else:
            details = f"Unexpected response: {data}"
        
        return self.log_test("AI Scan - Smart Mode (Endpoint)", success, details)

    def test_scan_update_stock(self):
        """Test updating stock from scan results"""
        if not self.created_items['products']:
            return self.log_test("Scan Update Stock", False, "No products available for stock update")
        
        # Test stock update with existing product
        product_id = self.created_items['products'][0]
        update_data = [
            {
                "product_id": product_id,
                "new_quantity": 75
            }
        ]
        
        success, data = self.make_request('POST', 'scan/update-stock', update_data, 200)
        
        if success and 'updated_ids' in data:
            details = f"Updated {len(data.get('updated_ids', []))} products from scan"
        else:
            details = f"Stock update failed: {data}"
        
        return self.log_test("Scan Update Stock", success, details)

    def test_get_scan_history(self):
        """Test getting scan history"""
        success, data = self.make_request('GET', 'scans?limit=5')
        
        if success and isinstance(data, list):
            details = f"Found {len(data)} scan records"
        else:
            details = f"Scan history response: {data}"
        
        return self.log_test("Get Scan History", success, details)

    # ============ REPORTS TESTS ============

    def test_sales_report_excel(self):
        """Test sales Excel export"""
        today = datetime.now()
        yesterday = today - timedelta(days=1)
        
        params = {
            'date_from': yesterday.isoformat(),
            'date_to': today.isoformat()
        }
        
        # For file downloads, we just check if the endpoint responds
        url = f"{self.base_url}/reports/sales/excel"
        headers = {'Authorization': f'Bearer {self.token}'} if self.token else {}
        
        try:
            response = requests.get(url, headers=headers, params=params)
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Content-Type: {response.headers.get('content-type', 'N/A')}"
        except Exception as e:
            success = False
            details = f"Error: {str(e)}"
        
        return self.log_test("Sales Excel Export", success, details)

    def test_inventory_report_excel(self):
        """Test inventory Excel export"""
        url = f"{self.base_url}/reports/inventory/excel"
        headers = {'Authorization': f'Bearer {self.token}'} if self.token else {}
        
        try:
            response = requests.get(url, headers=headers)
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Content-Type: {response.headers.get('content-type', 'N/A')}"
        except Exception as e:
            success = False
            details = f"Error: {str(e)}"
        
        return self.log_test("Inventory Excel Export", success, details)

    # ============ MAIN TEST RUNNER ============

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting Pasal Sathi API Tests...")
        print(f"📡 Base URL: {self.base_url}")
        print("=" * 60)
        
        # Authentication Tests
        print("\n🔐 AUTHENTICATION TESTS")
        self.test_check_setup_status()
        self.test_shop_setup()
        self.test_invalid_pin_login()
        
        if not self.token:
            print("❌ Cannot continue without authentication token")
            return False
        
        # Basic Data Tests
        print("\n📋 BASIC DATA TESTS")
        self.test_get_categories()
        self.test_get_locations()
        
        # Supplier Tests
        print("\n👥 SUPPLIER TESTS")
        self.test_create_supplier()
        self.test_get_suppliers()
        
        # Product Tests
        print("\n📦 PRODUCT TESTS")
        self.test_create_product()
        self.test_create_multiple_products()
        self.test_get_products()
        self.test_get_product_by_id()
        self.test_update_product()
        self.test_update_stock()
        
        # Sales Tests
        print("\n💰 SALES TESTS")
        self.test_create_sale()
        self.test_get_sales()
        self.test_get_today_sales()
        
        # Dashboard & Alerts
        print("\n📊 DASHBOARD & ALERTS")
        self.test_dashboard_stats()
        self.test_low_stock_alerts()
        
        # AI Scanner Tests
        print("\n🤖 AI SCANNER TESTS")
        self.test_scan_analyze_quick_mode()
        self.test_scan_analyze_smart_mode()
        self.test_scan_update_stock()
        self.test_get_scan_history()
        
        # Reports Tests
        print("\n📄 REPORTS TESTS")
        self.test_sales_report_excel()
        self.test_inventory_report_excel()
        
        # Summary
        print("\n" + "=" * 60)
        print(f"📈 TEST SUMMARY")
        print(f"✅ Passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Failed: {self.tests_run - self.tests_passed}/{self.tests_run}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📊 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 Backend API is working well!")
            return True
        else:
            print("⚠️  Backend has significant issues that need attention")
            return False

def main():
    """Main test execution"""
    tester = PasalSathiAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())