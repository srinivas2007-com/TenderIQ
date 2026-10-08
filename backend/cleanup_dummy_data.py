import sqlite3
import os
import glob

DB_PATH = os.path.join(os.path.dirname(__file__), "bidready.db")
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")

TABLES_TO_CLEAR = [
    "tender_clarifications",
    "tender_resource_requirements",
    "tender_profit_scenarios",
    "tender_cost_estimates",
    "tender_deadlines",
    "tender_risks",
    "tender_documents",
    "tender_requirements",
    "tender_analysis",
    "tender_outcomes",
    "bid_tasks",
    "team_members",
    "tenders",
    "company_documents",
    "companies",
    "users"
]

def clear_all_data():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("PRAGMA foreign_keys = OFF;")

    print("\n--- Clearing all existing test/sample database records ---")
    for table in TABLES_TO_CLEAR:
        try:
            cur.execute(f'DELETE FROM "{table}";')
            print(f"  [CLEARED] Table '{table}'")
        except sqlite3.OperationalError as e:
            print(f"  [SKIP] Table '{table}' ({e})")

    conn.commit()
    cur.execute("VACUUM;")
    cur.execute("PRAGMA foreign_keys = ON;")
    conn.close()

    print("\n--- Cleaning uploaded files in uploads directory ---")
    for subdir in ["tenders", "company_docs"]:
        target_dir = os.path.join(UPLOADS_DIR, subdir)
        if os.path.exists(target_dir):
            files = glob.glob(os.path.join(target_dir, "*"))
            deleted_count = 0
            for f in files:
                if os.path.isfile(f):
                    try:
                        os.remove(f)
                        deleted_count += 1
                    except Exception as err:
                        print(f"  Could not remove {f}: {err}")
            print(f"  [CLEARED] {deleted_count} files from uploads/{subdir}/")

    print("\n=======================================================")
    print("ALL TEST & SAMPLE DATA CLEARED 100%!")
    print("The application is now fresh and ready for user registration.")
    print("=======================================================")

if __name__ == "__main__":
    clear_all_data()
