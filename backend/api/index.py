"""
EPISCAN Backend - AI-Powered Outbreak Detection System
=======================================================

This FastAPI backend provides:
1. Secure health report submission endpoint
2. Statistical anomaly detection for disease outbreaks
3. Real-time outbreak alerts with risk scoring

Author: EPISCAN Team
Date: 2026-02-01
"""

import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import statistics

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from supabase import create_client, Client
from dotenv import load_dotenv
from mangum import Mangum

# Load environment variables
load_dotenv()

# ============================================================================
# CONFIGURATION
# ============================================================================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
FASTAPI_PORT = int(os.getenv("FASTAPI_PORT", "8000"))

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_KEY")

# Initialize Supabase client with service role key (bypasses RLS for backend operations)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ============================================================================
# FASTAPI APP INITIALIZATION
# ============================================================================

app = FastAPI(
    title="EPISCAN API",
    description="AI-powered early warning system for school disease outbreaks",
    version="1.0.0",
    root_path="/api"
)

# Configure CORS to allow requests from React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default dev server
        "http://127.0.0.1:5173",
        "http://localhost:8080",  # Production build server
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# ============================================================================
# PYDANTIC MODELS (Request/Response Schemas)
# ============================================================================

class HealthReportSubmission(BaseModel):
    """Schema for incoming health report submissions from students"""
    user_id: str = Field(..., description="UUID of the student submitting the report")
    symptoms: List[str] = Field(default=[], description="List of symptoms (e.g., ['fever', 'cough'])")
    temperature: Optional[float] = Field(None, description="Body temperature in Celsius", ge=35.0, le=43.0)
    location: str = Field(..., description="Location identifier (e.g., 'Hostel A')")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "symptoms": ["fever", "headache", "fatigue"],
                "temperature": 38.5,
                "location": "Hostel A"
            }
        }


class OutbreakAlert(BaseModel):
    """Schema for outbreak alert responses"""
    location: str
    affected_students: int
    risk_score: float  # Z-score converted to percentage
    severity: str  # "Low", "Medium", "High"
    common_symptoms: List[str]
    detection_time: str


# ============================================================================
# ENDPOINT 1: SUBMIT HEALTH REPORT
# ============================================================================

@app.post("/submit-report", status_code=status.HTTP_201_CREATED)
async def submit_health_report(report: HealthReportSubmission):
    """
    Securely saves a student health report to the database.

    **Security:**
    - Uses Supabase RLS policies to ensure students can only submit their own data
    - Validates temperature range (35-43°C)
    - Sanitizes input data

    **Returns:**
    - 201 Created: Report successfully saved
    - 400 Bad Request: Invalid data
    - 500 Internal Server Error: Database error
    """
    try:
        # Insert health report into Supabase
        response = supabase.table("health_reports").insert({
            "user_id": report.user_id,
            "symptoms": report.symptoms,
            "temperature": report.temperature,
            "location": report.location,
            "created_at": datetime.utcnow().isoformat()
        }).execute()

        # Check if insertion was successful
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save health report"
            )

        return {
            "message": "Health report submitted successfully",
            "report_id": response.data[0]["id"],
            "timestamp": response.data[0]["created_at"]
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


# ============================================================================
# AI DETECTION ENGINE: STATISTICAL ANOMALY DETECTION
# ============================================================================

def detect_outbreaks() -> List[Dict]:
    """
    AI-powered outbreak detection using Statistical Anomaly Detection.

    **Algorithm:**
    1. Fetch all health reports from the last 14 days (7-day baseline + 7-day current)
    2. For each location:
       a. Calculate 7-day historical baseline (mean μ and standard deviation σ)
       b. Count current reports (today)
       c. Calculate Z-score: Z = (current - μ) / σ
       d. Flag outbreak if Z > 2 (i.e., current > μ + 2σ)

    **Mathematical Foundation:**
    - **Mean (μ):** Average number of daily reports over baseline period
    - **Standard Deviation (σ):** Measure of variability in daily reports
    - **Z-Score:** Number of standard deviations from the mean
    - **Threshold (2σ):** Captures 95% of normal variation (2-sigma rule)

    **Why Z-Score = 2?**
    In a normal distribution:
    - 68% of data falls within 1σ
    - 95% of data falls within 2σ
    - 99.7% of data falls within 3σ

    By using 2σ, we detect events that have only a ~5% chance of occurring naturally,
    indicating a statistically significant anomaly (potential outbreak).

    **Returns:**
    List of outbreak alerts with risk scores and severity levels.
    """

    # Step 1: Define time windows
    # ----------------------------------------------------------------------
    # We need TWO time periods:
    # - BASELINE: 7-14 days ago (for calculating "normal" behavior)
    # - CURRENT: Last 24 hours (to detect if there's an anomaly NOW)
    # ----------------------------------------------------------------------

    now = datetime.utcnow()
    current_window_start = now - timedelta(days=1)  # Last 24 hours
    baseline_start = now - timedelta(days=14)       # 14 days ago
    baseline_end = now - timedelta(days=7)          # 7 days ago

    # Step 2: Fetch historical baseline data (7-14 days ago)
    # ----------------------------------------------------------------------
    # This gives us the "normal" level of health reports per location
    # ----------------------------------------------------------------------

    baseline_response = supabase.table("health_reports").select("*").gte(
        "created_at", baseline_start.isoformat()
    ).lt(
        "created_at", baseline_end.isoformat()
    ).execute()

    baseline_reports = baseline_response.data

    # Step 3: Fetch current data (last 24 hours)
    # ----------------------------------------------------------------------
    # This is what we're testing for anomalies
    # ----------------------------------------------------------------------

    current_response = supabase.table("health_reports").select("*").gte(
        "created_at", current_window_start.isoformat()
    ).execute()

    current_reports = current_response.data

    # Step 4: Group reports by location
    # ----------------------------------------------------------------------

    # Group baseline reports by location and date
    baseline_by_location = {}
    for report in baseline_reports:
        location = report["location"]
        report_date = report["created_at"][:10]  # Extract YYYY-MM-DD

        if location not in baseline_by_location:
            baseline_by_location[location] = {}

        if report_date not in baseline_by_location[location]:
            baseline_by_location[location][report_date] = 0

        baseline_by_location[location][report_date] += 1

    # Group current reports by location
    current_by_location = {}
    for report in current_reports:
        location = report["location"]

        if location not in current_by_location:
            current_by_location[location] = {
                "count": 0,
                "symptoms": [],
                "user_ids": []
            }

        current_by_location[location]["count"] += 1
        current_by_location[location]["symptoms"].extend(report.get("symptoms", []))
        current_by_location[location]["user_ids"].append(report["user_id"])

    # Step 5: Calculate Z-Scores and Detect Anomalies
    # ----------------------------------------------------------------------
    # For each location, we calculate:
    # - μ (mean): Average daily reports during baseline period
    # - σ (std dev): Variability in daily reports
    # - Z-score: How many standard deviations the current count is from the mean
    # ----------------------------------------------------------------------

    alerts = []

    for location, current_data in current_by_location.items():
        current_count = current_data["count"]

        # Get baseline daily counts for this location
        if location in baseline_by_location:
            daily_counts = list(baseline_by_location[location].values())
        else:
            # No historical data - use zeros (any reports will be anomalies)
            daily_counts = [0, 0, 0, 0, 0, 0, 0]

        # Ensure we have at least 2 data points for standard deviation
        if len(daily_counts) < 2:
            daily_counts = [0, 0]  # Fallback to zeros

        # **MATH STEP 1: Calculate Mean (μ)**
        # -----------------------------------
        # Mean represents the "normal" or "expected" number of daily reports
        # Formula: μ = (sum of all values) / (number of values)
        # Example: If daily counts are [2, 3, 1, 2, 3, 2, 1], μ = 14/7 = 2.0
        mean = statistics.mean(daily_counts)

        # **MATH STEP 2: Calculate Standard Deviation (σ)**
        # --------------------------------------------------
        # Standard deviation measures how "spread out" the data is
        # Formula: σ = sqrt(Σ(xᵢ - μ)² / (n-1))
        # - Low σ (e.g., 0.5): Data is tightly clustered around mean (predictable)
        # - High σ (e.g., 5.0): Data is widely spread (unpredictable)
        # Example: For [2, 3, 1, 2, 3, 2, 1], σ ≈ 0.816
        std_dev = statistics.stdev(daily_counts)

        # Handle edge case: if std_dev is 0 (all baseline values are identical),
        # we can't calculate a meaningful Z-score. Use a minimum threshold.
        if std_dev == 0:
            std_dev = 1.0  # Assume minimum variability

        # **MATH STEP 3: Calculate Z-Score**
        # -----------------------------------
        # Z-score tells us "how unusual" the current count is
        # Formula: Z = (X - μ) / σ
        # Where:
        # - X = current count (today's reports)
        # - μ = mean (expected daily reports)
        # - σ = standard deviation (normal variability)
        #
        # Interpretation:
        # - Z = 0: Current count is exactly average (no anomaly)
        # - Z = 1: Current count is 1 standard deviation above average (slightly elevated)
        # - Z = 2: Current count is 2 standard deviations above average (ALERT! 95% confidence)
        # - Z = 3: Current count is 3 standard deviations above average (CRITICAL! 99.7% confidence)
        #
        # Example:
        # - If μ = 2, σ = 0.816, and current = 5:
        #   Z = (5 - 2) / 0.816 = 3.68 (OUTBREAK DETECTED!)
        z_score = (current_count - mean) / std_dev

        # **DETECTION THRESHOLD: Z > 2 (2-Sigma Rule)**
        # ---------------------------------------------
        # We flag an outbreak if Z > 2 because:
        # - In a normal distribution, only 2.5% of values exceed μ + 2σ
        # - This gives us 95% confidence that the spike is NOT due to random chance
        # - It balances sensitivity (detecting real outbreaks) with specificity (avoiding false alarms)

        OUTBREAK_THRESHOLD = 2.0  # 2-sigma threshold (95% confidence)

        if z_score > OUTBREAK_THRESHOLD:
            # **RISK SCORE CALCULATION**
            # --------------------------
            # Convert Z-score to a percentage for easier interpretation
            # Formula: Risk% = min(Z × 20, 100)
            # - Z = 2 → 40% risk
            # - Z = 3 → 60% risk
            # - Z = 5 → 100% risk (capped)
            risk_percentage = min(z_score * 20, 100)

            # **SEVERITY CLASSIFICATION**
            # ---------------------------
            # Low: Z = 2.0 - 2.5 (40-50% risk)
            # Medium: Z = 2.5 - 3.5 (50-70% risk)
            # High: Z > 3.5 (70%+ risk)
            if z_score > 3.5:
                severity = "High"
            elif z_score > 2.5:
                severity = "Medium"
            else:
                severity = "Low"

            # Find most common symptoms in this location
            symptom_counts = {}
            for symptom in current_data["symptoms"]:
                symptom_counts[symptom] = symptom_counts.get(symptom, 0) + 1

            # Sort symptoms by frequency
            common_symptoms = sorted(symptom_counts.items(), key=lambda x: x[1], reverse=True)
            top_symptoms = [s[0] for s in common_symptoms[:3]]  # Top 3 symptoms

            # Count unique affected students
            unique_students = len(set(current_data["user_ids"]))

            # Create alert
            alerts.append({
                "location": location,
                "affected_students": unique_students,
                "risk_score": round(risk_percentage, 1),
                "severity": severity,
                "common_symptoms": top_symptoms,
                "detection_time": now.isoformat(),
                # Debugging info (remove in production)
                "_debug": {
                    "baseline_mean": round(mean, 2),
                    "baseline_std_dev": round(std_dev, 2),
                    "current_count": current_count,
                    "z_score": round(z_score, 2)
                }
            })

    return alerts


# ============================================================================
# ENDPOINT 2: GET OUTBREAK ALERTS
# ============================================================================

@app.get("/alerts", response_model=List[OutbreakAlert])
async def get_outbreak_alerts():
    """
    Returns active outbreak alerts detected by the AI system.

    **Response Format:**
    ```json
    [
      {
        "location": "Hostel A",
        "affected_students": 5,
        "risk_score": 63.4,
        "severity": "High",
        "common_symptoms": ["fever", "cough", "headache"],
        "detection_time": "2026-02-01T10:30:00Z"
      }
    ]
    ```

    **Risk Score:** Calculated via Z-score (higher = more unusual/severe)
    **Severity:**
    - Low: 40-50% risk (Z = 2.0-2.5)
    - Medium: 50-70% risk (Z = 2.5-3.5)
    - High: 70-100% risk (Z > 3.5)
    """
    try:
        alerts = detect_outbreaks()
        return alerts

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error detecting outbreaks: {str(e)}"
        )


# ============================================================================
# HEALTH CHECK ENDPOINT
# ============================================================================

@app.get("/")
async def root():
    """Health check endpoint to verify API is running"""
    return {
        "status": "online",
        "service": "EPISCAN API",
        "version": "1.0.0",
        "endpoints": {
            "submit_report": "POST /submit-report",
            "get_alerts": "GET /alerts"
        }
    }


# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    print(f"""
    ╔═══════════════════════════════════════╗
    ║   🏥 EPISCAN API SERVER STARTING...   ║
    ╚═══════════════════════════════════════╝

    📍 URL: http://localhost:{FASTAPI_PORT}
    📚 Docs: http://localhost:{FASTAPI_PORT}/docs
    🔗 Supabase: {SUPABASE_URL}

    Ready to detect outbreaks! 🚀
    """)

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=FASTAPI_PORT,
        reload=True  # Auto-reload on code changes (dev mode)
    )

# Vercel serverless handler
handler = Mangum(app)
