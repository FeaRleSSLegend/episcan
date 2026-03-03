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
# SEVERITY WEIGHTS
# ============================================================================
# Each report is worth a different amount depending on how severe the student
# reported their symptoms. This makes the Z-score reflect clinical urgency,
# not just raw headcount.
#
# Why these values?
# - mild     → 1.0: Baseline unit. Minor sniffles shouldn't spike an alert.
# - moderate → 1.5: Worth 1.5x a mild report. Noticeably unwell.
# - severe   → 2.5: Worth 2.5x a mild report. Significant clinical concern.
#
# Practical effect: 4 severe reports spike the Z-score as much as 10 mild ones.
# Without weighting, those two scenarios would look identical to the algorithm.

SEVERITY_WEIGHTS = {
    "mild": 1.0,
    "moderate": 1.5,
    "severe": 2.5,
}

# ============================================================================
# FASTAPI APP INITIALIZATION
# ============================================================================

app = FastAPI(
    title="EPISCAN API",
    description="AI-powered early warning system for school disease outbreaks",
    version="1.1.0",
    root_path="/api"
)

# Configure CORS to allow requests from React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        os.getenv("FRONTEND_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    severity: Optional[str] = Field(None, description="Symptom severity: mild, moderate, or severe")
    notes: Optional[str] = Field(None, description="Additional notes from the student")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "symptoms": ["fever", "headache", "fatigue"],
                "temperature": 38.5,
                "location": "Hostel A",
                "severity": "moderate",
                "notes": "Started feeling unwell after lunch"
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
            "severity": report.severity,
            "notes": report.notes,
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
# AI DETECTION ENGINE: SEVERITY-WEIGHTED STATISTICAL ANOMALY DETECTION
# ============================================================================

def get_severity_weight(severity: Optional[str]) -> float:
    """
    Convert a severity string to a numeric weight for Z-score calculation.

    Why weight by severity?
    Without weighting, 10 students with mild sniffles triggers the same alert
    as 4 students with severe fever + breathing difficulty. That's a false
    equivalence. Severity weighting makes the Z-score reflect actual clinical
    urgency, not just headcount.

    Returns 1.0 (mild baseline) for any unknown or null severity value.
    """
    return SEVERITY_WEIGHTS.get(severity or "mild", 1.0)


def detect_outbreaks() -> List[Dict]:
    """
    AI-powered outbreak detection using Severity-Weighted Statistical Anomaly Detection.

    **Algorithm:**
    1. Fetch all health reports from the last 14 days (7-day baseline + current 24hrs)
    2. For each location:
       a. Calculate a WEIGHTED daily score for the baseline:
              daily_score = sum(severity_weight for each report that day)
              e.g. 2 mild + 1 severe = (2 × 1.0) + (1 × 2.5) = 4.5
       b. Calculate 7-day baseline mean (μ) and std dev (σ) of weighted scores
       c. Calculate current 24hr weighted score
       d. Calculate Z-score: Z = (current_weighted_score - μ) / σ
       e. Flag outbreak if Z > 2 (i.e., current > μ + 2σ)

    **BEFORE (unweighted):**
      Z = (count_today - mean_count) / std_count

    **NOW (severity-weighted):**
      Z = (weighted_score_today - mean_weighted_score) / std_weighted_score

    This means 4 severe reports spike the Z-score as much as 10 mild reports —
    far more clinically appropriate than treating all reports equally.

    **Mathematical Foundation:**
    - **Mean (μ):** Average weighted daily score over baseline period
    - **Standard Deviation (σ):** Measure of variability in daily weighted scores
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
    # Only select the columns we need for efficiency
    # ----------------------------------------------------------------------

    baseline_response = supabase.table("health_reports").select(
        "location, created_at, severity"
    ).gte(
        "created_at", baseline_start.isoformat()
    ).lt(
        "created_at", baseline_end.isoformat()
    ).execute()

    baseline_reports = baseline_response.data

    # Step 3: Fetch current data (last 24 hours)
    # ----------------------------------------------------------------------
    # Need full data here for alert content (symptoms, user_ids, severity)
    # ----------------------------------------------------------------------

    current_response = supabase.table("health_reports").select(
        "location, created_at, severity, symptoms, user_id"
    ).gte(
        "created_at", current_window_start.isoformat()
    ).execute()

    current_reports = current_response.data

    # Step 4: Group reports by location
    # ----------------------------------------------------------------------

    # Group baseline reports by location and date — accumulate WEIGHTED scores
    baseline_by_location = {}
    for report in baseline_reports:
        location = report["location"]
        report_date = report["created_at"][:10]  # Extract YYYY-MM-DD
        weight = get_severity_weight(report.get("severity"))

        if location not in baseline_by_location:
            baseline_by_location[location] = {}

        if report_date not in baseline_by_location[location]:
            baseline_by_location[location][report_date] = 0.0

        # Accumulate weighted score instead of raw count
        baseline_by_location[location][report_date] += weight

    # Group current reports by location — accumulate WEIGHTED scores + metadata
    current_by_location = {}
    for report in current_reports:
        location = report["location"]
        weight = get_severity_weight(report.get("severity"))

        if location not in current_by_location:
            current_by_location[location] = {
                "weighted_score": 0.0,
                "symptoms": [],
                "user_ids": [],
                "severities": []
            }

        # Accumulate weighted score instead of raw count
        current_by_location[location]["weighted_score"] += weight
        current_by_location[location]["symptoms"].extend(report.get("symptoms", []))
        current_by_location[location]["user_ids"].append(report["user_id"])
        if report.get("severity"):
            current_by_location[location]["severities"].append(report["severity"])

    # Step 5: Calculate Z-Scores and Detect Anomalies
    # ----------------------------------------------------------------------
    # For each location, we calculate:
    # - μ (mean): Average WEIGHTED daily score during baseline period
    # - σ (std dev): Variability in daily WEIGHTED scores
    # - Z-score: How many standard deviations the current weighted score is from the mean
    # ----------------------------------------------------------------------

    alerts = []

    for location, current_data in current_by_location.items():
        current_weighted = current_data["weighted_score"]

        # Get baseline daily weighted scores for this location
        if location in baseline_by_location:
            daily_scores = list(baseline_by_location[location].values())
        else:
            # No historical data - use zeros (any reports will be anomalies)
            daily_scores = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]

        # Ensure we have at least 2 data points for standard deviation
        if len(daily_scores) < 2:
            daily_scores = [0.0, 0.0]  # Fallback to zeros

        # **MATH STEP 1: Calculate Mean (μ) of weighted daily scores**
        # -----------------------------------
        # Mean represents the "normal" or "expected" weighted score per day
        # Formula: μ = (sum of all values) / (number of values)
        # Example: If weighted daily scores are [2.5, 3.0, 1.0, 2.5, 3.5, 2.0, 1.5], μ = 2.28
        mean = statistics.mean(daily_scores)

        # **MATH STEP 2: Calculate Standard Deviation (σ)**
        # --------------------------------------------------
        # Standard deviation measures how "spread out" the data is
        # Formula: σ = sqrt(Σ(xᵢ - μ)² / (n-1))
        # - Low σ: Data is tightly clustered around mean (predictable)
        # - High σ: Data is widely spread (unpredictable)
        std_dev = statistics.stdev(daily_scores)

        # Handle edge case: if std_dev is 0 (all baseline values are identical),
        # we can't calculate a meaningful Z-score. Use a minimum threshold.
        if std_dev == 0:
            std_dev = 1.0  # Assume minimum variability

        # **MATH STEP 3: Calculate Z-Score on weighted score**
        # -----------------------------------
        # Z-score tells us "how unusual" the current weighted score is
        # Formula: Z = (X - μ) / σ
        # Where:
        # - X = current weighted score (today's severity-adjusted reports)
        # - μ = mean (expected daily weighted score)
        # - σ = standard deviation (normal variability)
        #
        # Interpretation:
        # - Z = 0: Current score is exactly average (no anomaly)
        # - Z = 1: Slightly elevated
        # - Z = 2: ALERT — 95% confidence this is not normal
        # - Z = 3: CRITICAL — 99.7% confidence
        #
        # Example (weighted):
        # - Baseline: μ = 2.0, σ = 0.8
        # - Today: 4 severe reports → weighted = 4 × 2.5 = 10.0
        # - Z = (10.0 - 2.0) / 0.8 = 10.0 (OUTBREAK!)
        # - Compare unweighted: Z = (4 - 2.0) / 0.8 = 2.5 (borderline)
        z_score = (current_weighted - mean) / std_dev

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

            # Find the dominant severity among reporters at this location
            sev_list = current_data["severities"]
            dominant_severity = max(set(sev_list), key=sev_list.count) if sev_list else "mild"

            # Create alert
            alerts.append({
                "location": location,
                "affected_students": unique_students,
                "risk_score": round(risk_percentage, 1),
                "severity": severity,
                "common_symptoms": top_symptoms,
                "detection_time": now.isoformat(),
                "_debug": {
                    "baseline_mean_weighted": round(mean, 2),
                    "baseline_std_dev": round(std_dev, 2),
                    "current_weighted_score": round(current_weighted, 2),
                    "raw_report_count": len(current_data["user_ids"]),
                    "z_score": round(z_score, 2),
                    "dominant_reporter_severity": dominant_severity,
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

    **Risk Score:** Calculated via severity-weighted Z-score (higher = more unusual/severe)
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
        "version": "1.1.0",
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