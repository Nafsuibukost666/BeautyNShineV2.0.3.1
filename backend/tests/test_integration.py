"""
BBO-10: Integration Testing & QA — ERP Core API

Runs against the live backend on localhost:5000.
Uses real PostgreSQL database for production-like QA.

Usage:
    pytest tests/test_integration.py -v --tb=short
"""

import pytest
import requests

BASE = "http://localhost:5000"
API = f"{BASE}/erp/api/v1"


def get_token():
    resp = requests.post(f"{API}/auth/login", json={
        "username": "admin", "password": "admin123"
    }, timeout=5)
    assert resp.status_code == 200
    return resp.json()["token"]


TOKEN = get_token()
HEADERS = {"Authorization": f"Bearer {TOKEN}"}


def get_data(response):
    """Extract the inner 'data' field from wrapped responses.

    All ERP API responses follow: {"success": true, "data": <inner>}
    """
    return response.json()["data"]


# =============================================================================
# TESTS
# =============================================================================


class TestHealth:
    def test_health_check(self):
        resp = requests.get(f"{BASE}/erp/health", timeout=5)
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


class TestAuth:
    def test_login_success(self):
        resp = requests.post(f"{API}/auth/login", json={
            "username": "admin", "password": "admin123"
        }, timeout=5)
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert data["user"]["username"] == "admin"

    def test_login_fail(self):
        resp = requests.post(f"{API}/auth/login", json={
            "username": "admin", "password": "wrongpass"
        }, timeout=5)
        assert resp.status_code == 401

    def test_me(self):
        resp = requests.get(f"{API}/auth/me", headers=HEADERS, timeout=5)
        assert resp.status_code == 200
        assert resp.json()["user"]["username"] == "admin"


class TestServices:
    def test_list_services(self):
        resp = requests.get(f"{API}/services", headers=HEADERS, timeout=5)
        assert resp.status_code == 200
        data = get_data(resp)
        assert len(data) > 0
        svc = data[0]
        assert "id" in svc
        assert "name" in svc
        assert "price" in svc

    def test_search_services_found(self):
        resp = requests.get(f"{API}/services?search=lash", headers=HEADERS, timeout=5)
        assert resp.status_code == 200
        assert len(get_data(resp)) > 0

    def test_search_services_not_found(self):
        resp = requests.get(f"{API}/services?search=zzzzzznonexistent999", headers=HEADERS, timeout=5)
        assert resp.status_code == 200
        assert len(get_data(resp)) == 0

    def test_get_service(self):
        resp = requests.get(f"{API}/services", headers=HEADERS, timeout=5)
        services = get_data(resp)
        assert len(services) > 0
        sid = services[0]["id"]
        resp = requests.get(f"{API}/services/{sid}", headers=HEADERS, timeout=5)
        assert resp.status_code == 200
        assert get_data(resp)["id"] == sid

    def test_service_not_found(self):
        resp = requests.get(f"{API}/services/99999", headers=HEADERS, timeout=5)
        assert resp.status_code == 404


class TestCustomers:
    def test_list_customers(self):
        resp = requests.get(f"{API}/customers", headers=HEADERS, timeout=5)
        assert resp.status_code == 200
        assert len(get_data(resp)) > 0

    def test_get_customer(self):
        resp = requests.get(f"{API}/customers", headers=HEADERS, timeout=5)
        customers = get_data(resp)
        assert len(customers) > 0
        cid = customers[0]["id"]
        resp = requests.get(f"{API}/customers/{cid}", headers=HEADERS, timeout=5)
        assert resp.status_code == 200
        assert get_data(resp)["id"] == cid

    def test_customer_not_found(self):
        resp = requests.get(f"{API}/customers/999999", headers=HEADERS, timeout=5)
        assert resp.status_code == 404


class TestSuppliers:
    def test_list_suppliers(self):
        resp = requests.get(f"{API}/suppliers", headers=HEADERS, timeout=5)
        assert resp.status_code == 200
        assert len(get_data(resp)) > 0

    def test_get_supplier(self):
        resp = requests.get(f"{API}/suppliers", headers=HEADERS, timeout=5)
        suppliers = get_data(resp)
        assert len(suppliers) > 0
        sid = suppliers[0]["id"]
        resp = requests.get(f"{API}/suppliers/{sid}", headers=HEADERS, timeout=5)
        assert resp.status_code == 200

    def test_supplier_not_found(self):
        resp = requests.get(f"{API}/suppliers/99999", headers=HEADERS, timeout=5)
        assert resp.status_code == 404


class TestPurchaseOrders:
    def test_list_purchase_orders(self):
        resp = requests.get(f"{API}/purchase-orders", headers=HEADERS, timeout=5)
        assert resp.status_code == 200
        assert isinstance(get_data(resp), list)

    def test_create_purchase_order(self):
        resp = requests.get(f"{API}/master/products", headers=HEADERS, timeout=5)
        products = get_data(resp)["items"]
        assert len(products) > 0

        product = products[0]
        payload = {
            "branch_id": 1, "supplier_id": 1,
            "order_date": "2026-05-20", "expected_date": "2026-06-15",
            "notes": "QA Test PO",
            "items": [
                {"product_id": product["id"], "product_name": product["name"],
                 "quantity": 5, "unit_price": 50000}
            ],
                }
        resp = requests.post(f"{API}/purchase-orders", json=payload, headers=HEADERS, timeout=5)
        assert resp.status_code == 201, f"PO create failed: {resp.text}"
        po = get_data(resp)
        assert po["status"] == "DRAFT"
        po_id = po["id"]

        # Order the PO (correct endpoint: /{id}/order)
        resp = requests.post(f"{API}/purchase-orders/{po_id}/order", headers=HEADERS, timeout=5)
        assert resp.status_code == 200, f"PO order failed: {resp.text}"
        assert get_data(resp)["status"] == "ORDERED"

    def test_receive_purchase_order(self):
        resp = requests.get(f"{API}/purchase-orders", headers=HEADERS, timeout=5)
        orders = get_data(resp)
        ordered = [o for o in orders if o.get("status") == "ORDERED"]
        if not ordered:
            pytest.skip("No ORDERED purchase orders")
        po_id = ordered[0]["id"]
        # Get PO items for the receive body
        resp = requests.get(f"{API}/purchase-orders/{po_id}", headers=HEADERS, timeout=5)
        po_detail = get_data(resp)
        items = po_detail.get("items", [])
        receive_items = [{"item_id": item["id"], "quantity": item["quantity"]} for item in items]

        payload = {"receive_date": "2026-05-20", "items": receive_items}
        resp = requests.post(f"{API}/purchase-orders/{po_id}/receive", json=payload, headers=HEADERS, timeout=5)
        assert resp.status_code == 200, f"PO receive failed: {resp.text}"
        assert get_data(resp)["status"] in ("PARTIAL_RECEIVED", "RECEIVED")

    def test_cancel_purchase_order(self):
        resp = requests.get(f"{API}/purchase-orders", headers=HEADERS, timeout=5)
        orders = get_data(resp)
        draft = [o for o in orders if o.get("status") == "DRAFT"]
        if not draft:
            pytest.skip("No DRAFT purchase orders")
        po_id = draft[0]["id"]
        resp = requests.post(f"{API}/purchase-orders/{po_id}/cancel", headers=HEADERS, timeout=5)
        assert resp.status_code == 200, f"PO cancel failed: {resp.text}"
        assert get_data(resp)["status"] in ("CANCEL", "CANCELLED")


class TestSalesOrders:
    def test_list_sales_orders(self):
        resp = requests.get(f"{API}/sales-orders", headers=HEADERS, timeout=5)
        assert resp.status_code == 200
        assert isinstance(get_data(resp), list)

    def test_create_and_post_sales_order(self):
        resp = requests.get(f"{API}/master/products", headers=HEADERS, timeout=5)
        products = get_data(resp)["items"]
        assert len(products) > 0

        payload = {
            "customer_id": 1, "branch_id": 1,
            "sales_date": "2026-05-20", "notes": "QA Test SO",
            "items": [
                {"product_id": products[0]["id"], "product_name": products[0]["name"],
                 "quantity": 1, "unit_price": 75000}
            ],
        }
        resp = requests.post(f"{API}/sales-orders", json=payload, headers=HEADERS, timeout=5)
        assert resp.status_code == 201, f"SO create failed: {resp.text}"
        so = get_data(resp)
        assert so["status"] == "DRAFT"
        so_id = so["id"]

        # Post it
        resp = requests.post(f"{API}/sales-orders/{so_id}/post", headers=HEADERS, timeout=5)
        assert resp.status_code == 200, f"SO post failed: {resp.text}"
        assert get_data(resp)["status"] == "POSTED"

    def test_cancel_draft_sales_order(self):
        # Create a fresh DRAFT SO and cancel it
        resp = requests.get(f"{API}/master/products", headers=HEADERS, timeout=5)
        products = get_data(resp)["items"]
        assert len(products) > 0

        payload = {
            "customer_id": 1, "branch_id": 1,
            "sales_date": "2026-05-20",
            "items": [{"product_id": products[0]["id"], "product_name": products[0]["name"],
                       "quantity": 1, "unit_price": 50000}],
        }
        resp = requests.post(f"{API}/sales-orders", json=payload, headers=HEADERS, timeout=5)
        assert resp.status_code == 201
        so_id = get_data(resp)["id"]

        resp = requests.post(f"{API}/sales-orders/{so_id}/cancel", headers=HEADERS, timeout=5)
        assert resp.status_code == 200, f"SO cancel failed: {resp.text}"
        assert get_data(resp)["status"] in ("CANCEL", "CANCELLED")


class TestInventory:
    def test_stock_movements_list(self):
        resp = requests.get(f"{API}/inventory/movements", headers=HEADERS, timeout=5)
        assert resp.status_code == 200
        data = get_data(resp)
        assert "items" in data
        assert isinstance(data["items"], list)

    def test_stock_cards_list(self):
        resp = requests.get(f"{API}/inventory/stock-cards", headers=HEADERS, timeout=5)
        assert resp.status_code == 200
        assert isinstance(get_data(resp), list)


class TestMasterData:
    def test_products(self):
        resp = requests.get(f"{API}/master/products", headers=HEADERS, timeout=5)
        assert resp.status_code == 200
        products = get_data(resp)
        if isinstance(products, dict):
            assert len(products.get("items", [])) > 0
        else:
            assert len(products) > 0

    def test_categories(self):
        resp = requests.get(f"{API}/master/categories", headers=HEADERS, timeout=5)
        assert resp.status_code == 200

    def test_accounts(self):
        resp = requests.get(f"{API}/master/accounts", headers=HEADERS, timeout=5)
        assert resp.status_code == 200

    def test_branches(self):
        resp = requests.get(f"{API}/master/branches", headers=HEADERS, timeout=5)
        assert resp.status_code == 200

    def test_staff(self):
        resp = requests.get(f"{API}/master/staff", headers=HEADERS, timeout=5)
        assert resp.status_code == 200


class TestPOSIntegration:
    def test_pos_transactions_list(self):
        resp = requests.get(f"{API}/pos/transactions", headers=HEADERS, timeout=5)
        assert resp.status_code == 200
        data = get_data(resp)
        if isinstance(data, dict):
            assert len(data.get("items", [])) > 0
        else:
            assert len(data) > 0

    def test_pos_settlements_list(self):
        resp = requests.get(f"{API}/pos/settlements", headers=HEADERS, timeout=5)
        assert resp.status_code == 200
        data = get_data(resp)
        assert "items" in data
        assert isinstance(data["items"], list)


class TestReports:
    def test_dashboard_summary(self):
        resp = requests.get(
            f"{API}/reports/dashboard-summary?start_date=2026-01-01&end_date=2026-12-31",
            headers=HEADERS, timeout=5
        )
        assert resp.status_code == 200
        data = get_data(resp)
        assert isinstance(data, dict)
        assert "kpis" in data

    def test_sales_report(self):
        resp = requests.get(
            f"{API}/reports/sales?start_date=2026-01-01&end_date=2026-12-31&group_by=DAILY",
            headers=HEADERS, timeout=5
        )
        assert resp.status_code == 200

    def test_income_statement(self):
        resp = requests.get(
            f"{API}/reports/income-statement?start_date=2026-01-01&end_date=2026-12-31",
            headers=HEADERS, timeout=5
        )
        assert resp.status_code == 200


class TestPostingEngine:
    def test_list_journals(self):
        resp = requests.get(f"{API}/journals", headers=HEADERS, timeout=5)
        assert resp.status_code == 200
        data = get_data(resp)
        assert "items" in data
        assert isinstance(data["items"], list)

    def test_list_transactions(self):
        resp = requests.get(f"{API}/transactions", headers=HEADERS, timeout=5)
        assert resp.status_code == 200
        data = get_data(resp)
        assert "items" in data
        assert isinstance(data["items"], list)


class TestDocumentRegistry:
    def test_list_documents(self):
        resp = requests.get(f"{API}/documents", headers=HEADERS, timeout=5)
        assert resp.status_code == 200
        data = get_data(resp)
        assert isinstance(data, dict)
        assert len(data.get("items", [])) > 0


class TestFrontend:
    BASE_FE = "http://localhost:8080"

    def test_erp_frontend_html(self):
        resp = requests.get(f"{self.BASE_FE}/erp/", timeout=5)
        assert resp.status_code == 200
        assert "text/html" in resp.headers.get("content-type", "")

    def test_pos_frontend_html(self):
        resp = requests.get(f"{self.BASE_FE}/pos/", timeout=5)
        assert resp.status_code == 200
        assert "text/html" in resp.headers.get("content-type", "")
