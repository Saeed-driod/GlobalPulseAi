"""
Database Seeder - GlobalPulse AI
Note: Automatic fake/dummy article seeding has been permanently disabled.
This file remains as an empty safe utility.
"""
try:
    from .database import SessionLocal, engine, Base
    from .models import Article
except (ImportError, ValueError):
    from database import SessionLocal, engine, Base
    from models import Article

SAMPLE_ARTICLES = []

def seed_database():
    """No-op: Dummy seeding is disabled to maintain clean production state."""
    pass

if __name__ == "__main__":
    print("Dummy seeding is disabled. Articles are only created via the live RSS AI automation pipeline.")
