from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import timedelta
import json
import os
from pydantic import BaseModel, Field
from typing import List, Optional, Any

from . import models, database, auth

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Invoice Analyzer SaaS backend")

# Allow frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Schemas ---
class UserCreate(BaseModel):
    email: str = Field(..., pattern=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    password: str = Field(..., max_length=72)

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    email: str
    class Config:
        orm_mode = True

class InvoiceCreate(BaseModel):
    id: str
    filename: str
    total_amount: float
    tax_amount: float
    data: dict # The full JSON payload

# --- Auth Routes ---
@app.post("/api/auth/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, password_hash=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/api/auth/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    # OAuth2 specifies 'username' form field, but we mapped it to email in the frontend
    if len(form_data.password) > 72:
        raise HTTPException(status_code=400, detail="Password cannot exceed 72 characters")
        
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# --- Invoice Routes ---
@app.post("/api/invoices")
def save_invoice(invoice: InvoiceCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Check if duplicate
    existing = db.query(models.Invoice).filter(models.Invoice.id == invoice.id).first()
    if existing:
        return {"msg": "Invoice already saved"}
    
    db_invoice = models.Invoice(
        id=invoice.id,
        user_id=current_user.id,
        filename=invoice.filename,
        total_amount=invoice.total_amount,
        tax_amount=invoice.tax_amount,
        full_json_data=json.dumps(invoice.data)
    )
    db.add(db_invoice)
    db.commit()
    return {"msg": "Stored successfully", "id": db_invoice.id}

@app.get("/api/invoices")
def get_invoices(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    invoices = db.query(models.Invoice).filter(models.Invoice.user_id == current_user.id).order_by(models.Invoice.processed_at.desc()).all()
    # Format back to what the frontend expects
    res = []
    for inv in invoices:
        res.append({
            "id": inv.id,
            "filename": inv.filename,
            "processedAt": inv.processed_at.isoformat(),
            "data": json.loads(inv.full_json_data)
        })
    return res

@app.delete("/api/invoices/{invoice_id}")
def delete_invoice(invoice_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id, models.Invoice.user_id == current_user.id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    db.delete(invoice)
    db.commit()
    return {"msg": "Deleted successfully"}

@app.get("/api/analytics")
def get_analytics(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    invoices = db.query(models.Invoice).filter(models.Invoice.user_id == current_user.id).all()
    
    # We will compute basic aggregates here
    total_spent = sum(inv.total_amount for inv in invoices)
    total_tax = sum(inv.tax_amount for inv in invoices)
    
    # Group by month string (YYYY-MM)
    monthly_data = {}
    for inv in invoices:
        month_str = inv.processed_at.strftime("%Y-%m")
        if month_str not in monthly_data:
            monthly_data[month_str] = 0
        monthly_data[month_str] += inv.total_amount
        
    return {
        "total_spent": total_spent,
        "total_tax": total_tax,
        "monthly_data": monthly_data
    }

# --- Static Files ---
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
app.mount("/src", StaticFiles(directory=os.path.join(base_dir, "src")), name="src")

@app.get("/{path:path}")
async def serve_static(path: str):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target = os.path.join(base_dir, path)
    if not path or path == "":
        return FileResponse(os.path.join(base_dir, "index.html"))
    if os.path.exists(target) and os.path.isfile(target):
        return FileResponse(target)
    # Default to index.html for SPA routing if needed
    return FileResponse(os.path.join(base_dir, "index.html"))

