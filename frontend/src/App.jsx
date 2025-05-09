import { Routes, Route, BrowserRouter } from "react-router-dom";
import "./App.css";
import Test from "./pages/Test";
import Home from "./pages/Home";
import LoginEmployee from "./pages/LoginEmployee";
import Start from "./pages/Start";

function App() {
  return (
    <BrowserRouter>
      <div>
        <Routes>
          <Route path="/" element={<Start />} />
          <Route path="/loginemployee" element={<LoginEmployee />} />
          <Route path="/home" element={<Home />} />
          <Route path="/test" element={<Test />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
