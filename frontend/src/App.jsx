import Navbar from "./components/Navbar"
import AppRoutes from "./routes/AppRoutes"

function App() {

  return (
    <>
      <div className="mb-20">
        <Navbar />
      </div>
      <AppRoutes />
    </>
  );
}

export default App
