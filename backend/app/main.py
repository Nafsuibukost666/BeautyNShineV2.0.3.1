"""ERP Core — FastAPI application factory.

Creates and configures the FastAPI app with CORS, database tables,
and all API routers.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base

# Import all models so tables get created
import app.models.document_registry  # noqa
import app.models.master_data  # noqa
import app.models.posting  # noqa
import app.models.finance  # noqa
import app.models.audit  # noqa
import app.models.inventory  # noqa
import app.models.pos_integration  # noqa
import app.models.purchase  # noqa
import app.models.sales  # noqa
import app.models.treatment  # noqa
import app.models.booking  # noqa

# Import routers
from app.api import auth, document_registry as doc_api, master_data as master_api, posting as posting_api, finance as finance_api, reporting as reporting_api, audit as audit_api, inventory as inventory_api, pos_integration as pos_api, pos_expo as pos_expo_api, services as services_api, customers as customers_api, suppliers as suppliers_api, purchase_orders as purchase_orders_api, sales_orders as sales_orders_api, treatment as treatment_api, booking as booking_api, expenses as expenses_api


def create_app() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME, docs_url="/erp/docs")

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Create tables
    Base.metadata.create_all(bind=engine)

    # Routers
    app.include_router(auth.router)
    app.include_router(doc_api.router)
    app.include_router(master_api.router)
    app.include_router(posting_api.router)
    app.include_router(finance_api.router)
    app.include_router(reporting_api.router)
    app.include_router(audit_api.router)
    app.include_router(inventory_api.router)
    app.include_router(pos_api.router)
    app.include_router(pos_expo_api.router)
    app.include_router(services_api.router)
    app.include_router(customers_api.router)
    app.include_router(suppliers_api.router)
    app.include_router(purchase_orders_api.router)
    app.include_router(sales_orders_api.router)
    app.include_router(treatment_api.router)
    app.include_router(booking_api.router)
    app.include_router(expenses_api.router)

    # Health check
    @app.get("/erp/health")
    def health():
        return {"status": "ok", "app": settings.APP_NAME}

    return app


app = create_app()
