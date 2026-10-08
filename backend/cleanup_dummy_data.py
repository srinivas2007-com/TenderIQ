import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "bidready.db")

def cleanup():
    if not os.path.exists(db_path):
        print("Database not found.")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Delete sample/dummy companies
    cur.execute("DELETE FROM companies WHERE is_sample = 1 OR name IN ('TechNova Solutions', 'Apex Digital Technologies Pvt Ltd', 'Innovent Systems India Pvt Ltd')")
    print(f"Deleted sample companies. Remaining companies: {cur.execute('SELECT COUNT(*) FROM companies').fetchone()[0]}")

    conn.commit()
    conn.close()
    print("[OK] Dummy data cleanup complete! The database will now strictly operate on user-provided data.")

if __name__ == "__main__":
    cleanup()
