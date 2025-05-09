import { Routes, Route, BrowserRouter } from "react-router-dom";
import "./App.css";
import Test from "./pages/Test";
import Home from "./pages/Home";
import LoginEmployee from "./pages/LoginEmployee";

function App() {
  return (
    <BrowserRouter>
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/loginemployee" element={<LoginEmployee />} />
          <Route path="/test" element={<Test />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
