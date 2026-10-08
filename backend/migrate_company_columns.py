import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "bidready.db")

def migrate():
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("PRAGMA table_info(companies)")
    cols = [row[1] for row in cursor.fetchall()]
    print(f"Existing columns in companies: {cols}")
    
    if "is_sample" not in cols:
        print("Adding is_sample column...")
        cursor.execute("ALTER TABLE companies ADD COLUMN is_sample BOOLEAN DEFAULT 0")
        
    if "major_projects" not in cols:
        print("Adding major_projects column...")
        cursor.execute("ALTER TABLE companies ADD COLUMN major_projects JSON DEFAULT '[]'")

    conn.commit()
    conn.close()
    print("[OK] Companies migration successful!")

if __name__ == "__main__":
    migrate()
