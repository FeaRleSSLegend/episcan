# EPISCAN Backend - AI Outbreak Detection System

FastAPI backend with statistical anomaly detection for early disease outbreak warnings.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` folder:

```bash
cp .env.example .env
```

Then edit `.env` and add your Supabase credentials:

```env
SUPABASE_URL=https://fzvbjhuhnuxvcxkrvdzb.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
FASTAPI_PORT=8000
```

**Get your Service Role Key:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Project Settings** → **API**
4. Copy the `service_role` key (secret)

### 3. Run Database Migration

Run the SQL from `Integrations.md` in your Supabase SQL Editor:
1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/fzvbjhuhnuxvcxkrvdzb/sql)
2. Copy the entire SQL block from `Integrations.md`
3. Paste and execute

### 4. Start the Server

```bash
python main.py
```

The server will start at: **http://localhost:8000**

API Documentation: **http://localhost:8000/docs**

---

## 📚 API Endpoints

### POST `/submit-report`
Submit a student health report.

**Request:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "symptoms": ["fever", "headache", "fatigue"],
  "temperature": 38.5,
  "location": "Hostel A"
}
```

**Response:**
```json
{
  "message": "Health report submitted successfully",
  "report_id": "123e4567-e89b-12d3-a456-426614174000",
  "timestamp": "2026-02-01T10:30:00Z"
}
```

### GET `/alerts`
Get active outbreak alerts.

**Response:**
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

---

## 🧠 AI Detection Algorithm

The system uses **Statistical Anomaly Detection** with the following approach:

### Algorithm Steps:

1. **Fetch Historical Data**: Get health reports from the last 14 days
2. **Calculate Baseline**: Compute 7-day mean (μ) and standard deviation (σ) per location
3. **Compare Current**: Count today's reports
4. **Calculate Z-Score**: `Z = (Current - μ) / σ`
5. **Detect Anomaly**: If `Z > 2` (2-sigma rule), flag as outbreak

### Mathematical Foundation:

- **Mean (μ)**: Average daily reports during baseline period
- **Standard Deviation (σ)**: Measure of variability
- **Z-Score**: Number of standard deviations from the mean
- **Threshold**: Z > 2 means 95% confidence (only 5% chance of occurring naturally)

### Risk Score Calculation:

```python
risk_percentage = min(z_score * 20, 100)
```

- Z = 2.0 → 40% risk (Low)
- Z = 3.0 → 60% risk (Medium)
- Z = 5.0 → 100% risk (High)

### Severity Levels:

- **Low**: Z = 2.0 - 2.5 (40-50% risk)
- **Medium**: Z = 2.5 - 3.5 (50-70% risk)
- **High**: Z > 3.5 (70%+ risk)

---

## 🔒 Security

- Uses Supabase **Service Role Key** (bypasses RLS) for backend operations
- Never expose service key in client-side code
- CORS configured to only allow `localhost:5173` (React frontend)
- Input validation with Pydantic models

---

## 🧪 Testing

### Test Health Check:
```bash
curl http://localhost:8000/
```

### Test Submit Report:
```bash
curl -X POST http://localhost:8000/submit-report \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "symptoms": ["fever", "cough"],
    "temperature": 38.5,
    "location": "Hostel A"
  }'
```

### Test Get Alerts:
```bash
curl http://localhost:8000/alerts
```

---

## 📦 Dependencies

- **FastAPI**: Modern Python web framework
- **Uvicorn**: ASGI server
- **Supabase**: Database client
- **Pydantic**: Data validation
- **Python-dotenv**: Environment variable management

---

## 🐛 Troubleshooting

### Issue: "Missing required environment variables"
**Solution**: Ensure `.env` file exists with `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`

### Issue: "CORS error in React frontend"
**Solution**: Verify `allow_origins` in `main.py` includes `http://localhost:5173`

### Issue: "No alerts showing"
**Solution**: Insert sample health reports into the database first

---

## 📖 For School Presentation

**Explain the AI Part:**

> "Our system uses Statistical Anomaly Detection, a branch of AI that identifies unusual patterns in data. We calculate the average number of health reports per location over 7 days (the baseline), then compare today's count. If today's count exceeds the mean by more than 2 standard deviations (2-sigma rule), we flag it as an outbreak. This gives us 95% confidence that the spike is NOT due to random chance. The Z-score tells us how many standard deviations away from normal we are, which we convert to a risk percentage for easy interpretation."

**Show This Math on Slides:**
- Mean (μ) = Average daily reports
- Standard Deviation (σ) = Measure of variability
- Z-Score = (Current - μ) / σ
- Outbreak Threshold = Z > 2 (95% confidence)

---

Built with ❤️ for EPISCAN
