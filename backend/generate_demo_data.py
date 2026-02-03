"""
EPISCAN Demo Data Generator
===========================

This script generates realistic demo data for showcasing the outbreak detection system.

It creates:
1. Baseline data (7-14 days ago) - Normal activity (2-3 reports/day)
2. Outbreak data (last 24 hours) - Anomalous spike (8+ reports)

This will trigger the AI detection system to generate HIGH severity alerts.

Usage:
    python generate_demo_data.py

Requirements:
    - Backend server must be running (http://localhost:8000)
    - At least one user registered in the system
"""

import os
import sys
from datetime import datetime, timedelta
from typing import List
import random

from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ============================================================================
# CONFIGURATION
# ============================================================================

LOCATIONS = ["Hostel A", "Hostel B", "Hostel C", "Day Scholar"]
SYMPTOMS = ["fever", "cough", "headache", "fatigue", "sore throat", "runny nose", "body ache"]

# Baseline period: 7-14 days ago
BASELINE_START_DAYS = 14
BASELINE_END_DAYS = 7
BASELINE_REPORTS_PER_DAY = 2  # Normal activity level

# Outbreak period: last 24 hours
OUTBREAK_REPORTS = 8  # Spike to trigger HIGH alert
OUTBREAK_LOCATION = "Hostel A"  # Where the outbreak occurs

# ============================================================================
# FUNCTIONS
# ============================================================================

def get_random_user_id() -> str:
    """Fetch a random user ID from the database"""
    try:
        response = supabase.table("profiles").select("user_id").limit(10).execute()

        if not response.data:
            print("❌ Error: No users found in database. Please register at least one user first.")
            sys.exit(1)

        # Return first user (or random if you want)
        return response.data[0]["user_id"]

    except Exception as e:
        print(f"❌ Error fetching user: {e}")
        sys.exit(1)


def insert_health_report(user_id: str, symptoms: List[str], temperature: float, location: str, date: datetime):
    """Insert a health report with a specific timestamp"""
    try:
        supabase.table("health_reports").insert({
            "user_id": user_id,
            "symptoms": symptoms,
            "temperature": temperature,
            "location": location,
            "created_at": date.isoformat()
        }).execute()
    except Exception as e:
        print(f"❌ Error inserting report: {e}")


def generate_baseline_data():
    """Generate normal baseline data (7-14 days ago)"""
    print("\n📊 Generating baseline data (7-14 days ago)...")

    user_id = get_random_user_id()
    now = datetime.utcnow()

    # Generate data for each day in the baseline period
    for days_ago in range(BASELINE_START_DAYS, BASELINE_END_DAYS, -1):
        date = now - timedelta(days=days_ago)

        # Create 2-3 reports per day (normal activity)
        num_reports = random.randint(2, 3)

        for _ in range(num_reports):
            # Random location
            location = random.choice(LOCATIONS)

            # Mild symptoms (baseline = mostly healthy)
            symptoms = random.sample(["fatigue", "headache"], k=random.randint(0, 1))

            # Normal temperature
            temperature = round(random.uniform(36.5, 37.2), 1)

            insert_health_report(user_id, symptoms, temperature, location, date)

        print(f"  ✓ Day {days_ago} ago: {num_reports} reports")

    print(f"✅ Baseline data created: {BASELINE_START_DAYS - BASELINE_END_DAYS} days of normal activity")


def generate_outbreak_data():
    """Generate outbreak data (last 24 hours) - ANOMALOUS SPIKE"""
    print(f"\n🚨 Generating outbreak data ({OUTBREAK_LOCATION})...")

    user_id = get_random_user_id()
    now = datetime.utcnow()

    # Create outbreak in the last 24 hours
    for i in range(OUTBREAK_REPORTS):
        # Spread reports across the last 24 hours
        hours_ago = random.randint(0, 23)
        date = now - timedelta(hours=hours_ago)

        # Outbreak symptoms (severe)
        symptoms = random.sample(["fever", "cough", "headache", "body ache", "fatigue"], k=random.randint(2, 4))

        # Elevated temperature
        temperature = round(random.uniform(37.8, 39.5), 1)

        insert_health_report(user_id, symptoms, temperature, OUTBREAK_LOCATION, date)

        print(f"  ✓ Report {i+1}: {', '.join(symptoms)}, {temperature}°C")

    print(f"✅ Outbreak data created: {OUTBREAK_REPORTS} reports in {OUTBREAK_LOCATION}")


def verify_data():
    """Verify the data was inserted correctly"""
    print("\n🔍 Verifying data...")

    # Count total reports
    response = supabase.table("health_reports").select("*", count="exact").execute()
    total_reports = response.count if hasattr(response, 'count') else len(response.data)

    # Count reports by location
    response_by_location = supabase.table("health_reports").select("location").execute()

    location_counts = {}
    for report in response_by_location.data:
        loc = report["location"]
        location_counts[loc] = location_counts.get(loc, 0) + 1

    print(f"\n📈 Database Statistics:")
    print(f"  Total reports: {total_reports}")
    print(f"  Reports by location:")
    for loc, count in location_counts.items():
        print(f"    • {loc}: {count} reports")

    # Calculate expected Z-score for presentation
    baseline_mean = BASELINE_REPORTS_PER_DAY
    baseline_std = 0.5  # Approximate (will vary based on random data)
    z_score = (OUTBREAK_REPORTS - baseline_mean) / baseline_std
    risk_score = min(z_score * 20, 100)

    print(f"\n🎯 Expected Outbreak Detection:")
    print(f"  Location: {OUTBREAK_LOCATION}")
    print(f"  Baseline mean (μ): {baseline_mean} reports/day")
    print(f"  Current count: {OUTBREAK_REPORTS} reports")
    print(f"  Estimated Z-score: {z_score:.2f}")
    print(f"  Estimated risk: {risk_score:.1f}%")
    print(f"  Expected severity: {'HIGH' if z_score > 3.5 else 'MEDIUM' if z_score > 2.5 else 'LOW'}")


def main():
    """Main execution"""
    print("""
    ╔═══════════════════════════════════════════════╗
    ║   🏥 EPISCAN Demo Data Generator             ║
    ╚═══════════════════════════════════════════════╝

    This script will create:
    • Baseline data (7-14 days ago): Normal activity
    • Outbreak data (today): Anomalous spike in {outbreak_location}

    ⚠️  WARNING: This will insert data into your database!
    """.format(outbreak_location=OUTBREAK_LOCATION))

    confirm = input("    Continue? (yes/no): ").strip().lower()

    if confirm != "yes":
        print("\n❌ Cancelled.")
        return

    try:
        # Step 1: Generate baseline
        generate_baseline_data()

        # Step 2: Generate outbreak
        generate_outbreak_data()

        # Step 3: Verify
        verify_data()

        print("""
    ╔═══════════════════════════════════════════════╗
    ║   ✅ DEMO DATA GENERATION COMPLETE!          ║
    ╚═══════════════════════════════════════════════╝

    Next Steps:
    1. Start the backend server:
       python main.py

    2. Check alerts endpoint:
       http://localhost:8000/alerts

    3. View in React frontend:
       http://localhost:5173

    You should see a HIGH severity alert for {outbreak_location}! 🚨
        """.format(outbreak_location=OUTBREAK_LOCATION))

    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
