import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    invoices = relationship("Invoice", back_populates="owner")

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(50), primary_key=True, index=True) # UUID or generated ID
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String(255))
    total_amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    processed_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Store the entire exact JSON output for rendering back to the UI
    full_json_data = Column(Text)

    owner = relationship("User", back_populates="invoices")
