# Frontend & Backend Connection Setup

## Project Structure
- **Frontend**: `legacy-portfolio-app/` (React + Vite)
- **Backend**: `demo/` (Spring Boot - Java)

## Running the Project

### 1. Start the Backend (Spring Boot API)
```bash
cd demo
mvn spring-boot:run
```
The backend will run on `http://localhost:8080`

### 2. Start the Frontend (React)
```bash
cd legacy-portfolio-app
npm run dev
```
The frontend will run on `http://localhost:5173`

## API Connection

### Files Modified:
1. **`legacy-portfolio-app/src/services/api.js`** - Centralized API service with axios
2. **`legacy-portfolio-app/vite.config.js`** - Added proxy for development

### How to Use API in Components

```javascript
import { stocksAPI } from './services/api';

// In your component:
useEffect(() => {
  const fetchStocks = async () => {
    try {
      const response = await stocksAPI.getAllStocks();
      setStocks(response.data);
    } catch (error) {
      console.error('Error fetching stocks:', error);
    }
  };
  fetchStocks();
}, []);
```

## Production API URL

To connect to your live API in production, set the environment variable:
```bash
REACT_APP_API_URL=https://your-live-api-url.com
```

Or edit `legacy-portfolio-app/src/services/api.js` line 5:
```javascript
const API_BASE_URL = 'https://your-live-api-url.com';
```

## Backend API Endpoints (from demo/legacy-demo.rest)
- `POST /stocks` - Create stock
- `GET /stocks` - Get all stocks
- `GET /stocks/{id}` - Get stock by ID
- `PUT /stocks/{id}` - Update stock
- `DELETE /stocks/{id}` - Delete stock

Add more endpoints as your backend develops!
