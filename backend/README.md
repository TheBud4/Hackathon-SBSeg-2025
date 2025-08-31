# BluePriori - Vulnerability Prioritization Dashboard

BluePriori is a full-stack web application for vulnerability management and prioritization. It consists of a Flask-based backend API that processes vulnerability data and a React frontend dashboard that visualizes priority scores by asset type to help users decide which vulnerabilities to address first.

## Features

- **Backend API**: RESTful API built with Flask and SQLAlchemy
- **Data Processing**: Loads vulnerability data from JSON files into SQLite database
- **Frontend Dashboard**: Interactive React app with charts and sortable tables
- **Priority Scoring**: Visualizes asset prioritization based on vulnerability scores
- **Real-time Updates**: Refresh data from the backend

## Technologies

- **Backend**: Python 3.12, Flask, SQLAlchemy, SQLite
- **Frontend**: React 19, Vite, Recharts, Axios
- **Database**: SQLite (development) / PostgreSQL (production)

## Prerequisites

- Python 3.12 or higher
- Node.js 18 or higher
- npm or yarn

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/RodrigoAlban/backendSGSeg.git
cd backendSGSeg
```

### 2. Backend Setup

1. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # On Windows:
   .venv\Scripts\activate
   # On macOS/Linux:
   source .venv/bin/activate
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Load vulnerability data into the database:
   ```bash
   python load_data.py
   ```

4. Run the Flask backend:
   ```bash
   python app.py
   ```
   The backend will be available at `http://127.0.0.1:5000`

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`

## Usage

1. Ensure both backend and frontend are running
2. Open your browser and go to `http://localhost:5173`
3. The dashboard will display:
   - Bar chart showing average priority scores by asset type
   - Sortable table with asset details
   - Refresh button to update data from the backend

## API Endpoints

### Assets
- `GET /assets` - Get all assets ordered by priority score (descending)
- `GET /assets/<id>` - Get specific asset with its vulnerabilities

### Vulnerabilities
- `GET /vulnerabilities` - Get all vulnerabilities
- `GET /vulnerabilities/<id>` - Get specific vulnerability by ID

## Project Structure

```
backendSGSeg/
├── app.py                 # Flask application
├── config.py             # Configuration settings
├── models.py             # Database models
├── load_data.py          # Data loading script
├── requirements.txt      # Python dependencies
├── data_JSON/            # Vulnerability data files
├── frontend/             # React frontend
│   ├── src/
│   │   ├── App.jsx       # Main dashboard component
│   │   ├── App.css       # Dashboard styles
│   │   └── main.jsx      # React entry point
│   ├── package.json      # Node dependencies
│   └── vite.config.js    # Vite configuration
└── instance/
    └── vulnerabilities.db # SQLite database
```

## Development

### Backend Development
- The app uses Flask with SQLAlchemy for ORM
- CORS is enabled for frontend communication
- Database models are defined in `models.py`

### Frontend Development
- Built with React and Vite for fast development
- Uses Recharts for data visualization
- Axios for API communication
- Responsive design with CSS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both backend and frontend
5. Submit a pull request

## License

This project is licensed under the MIT License.
