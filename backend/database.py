from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Note: We are using SQLite internally so the server runs seamlessly without complex local DB setup.
# Because SQLAlchemy abstracts the dialect, this is exactly the same code as if you used MySQL.
# To switch to an actual MySQL server, replace the line below with:
# SQLALCHEMY_DATABASE_URL = "mysql+pymysql://user:password@localhost/invoice_db"

SQLALCHEMY_DATABASE_URL = "sqlite:///./invoice_saas.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
