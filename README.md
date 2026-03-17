# PolyU Record App (Meal + Activity)

Web application for PolyU participant self-reporting. The system supports:

- Meal records (with food photos and descriptions)
- Activity records on a 15-minute timeline
- Multi-day workflow (e.g., first workday, second workday, rest day)
- Login/session-based participant tracking

Frontend uses HTML/CSS/vanilla JavaScript, backend uses Flask, and data is stored in Supabase.

## Current User Flow

1. Open landing page and log in/register.
2. Enter the hub page and choose either:
     - Meal recording
     - Activity recording
3. For each day, user can add records, view existing records, edit/delete inline, and complete the day.

## Key Behaviors (Current)

### Meal recording

- Record meal type, time, location, amount, notes, and photo(s)
- Inline edit/delete directly in the record list page
- Meal list is displayed in chronological order
- Already-recorded meal types are disabled when adding more entries

### Activity recording

- Select timeline blocks in 15-minute units
- View page shows a full-day schedule with unrecorded gaps shown as sleep/static segments
- Inline editing supports:
    - Type
    - Specific activity
    - Description
    - Time via HH + MM dropdowns
- Minute options are restricted to `00/15/30/45`
- If edited time conflicts with other records, overlapping records are auto-adjusted (or removed if fully overlapped), and an on-page notice is shown
- Timeline bars and legends are shown in view/summary contexts

## Routes

### Pages

- `GET /` landing page
- `GET /login` login page
- `GET /hub` hub page
- `GET /form` meal page
- `GET /exercise` activity page

### Authentication APIs

- `POST /api/login`
- `POST /api/register`
- `POST /api/logout`

### Meal APIs

- `POST /api/save-meal-record`
- `GET /api/get-meal-records`
- `PUT /api/update-meal-record/<meal_record_id>`
- `DELETE /api/delete-meal-record/<meal_record_id>`
- `POST /api/complete-daily-record`

### Activity APIs

- `POST /api/save-exercise-record`
- `GET /api/get-exercise-records`
- `PUT /api/update-exercise-record/<record_id>`
- `DELETE /api/delete-exercise-record/<record_id>`
- `POST /api/complete-exercise-day`
- `POST /api/mark-no-exercise`

## Local Development (Windows)

1. Clone the repository.
2. Create and activate virtual environment:

```bash
python -m venv .venv
.venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Start server:

```bash
python main.py
```

5. Open:

```text
http://localhost:5000
```

## Project Structure

```text
app.yaml
main.py
requirements.txt
README.md

static/
    css/
        form-style.css
        login-style.css
        style.css
    js/
        exercise-script.js
        form-script.js
        handlers_addition.js
        hub-script.js
        login.js

templates/
    exercise.html
    form.html
    hub.html
    index.html
    login.html

utils/
    check_braces.py
    check_syntax.py
    detailed_check.py
    generate_participant_report.py
    data/
```

## Tech Stack

- Backend: Flask (Python)
- Frontend: Vanilla JavaScript + HTML + CSS
- Database: Supabase
- Deployment config: Google App Engine (`app.yaml`)

## Notes

- UI language is Traditional Chinese.
- Time resolution for activity records is 15 minutes.
- Activity color mapping is centralized in frontend script.
