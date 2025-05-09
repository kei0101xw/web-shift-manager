import { Routes, Route, BrowserRouter } from "react-router-dom";
import "./App.css";
import Test from "./pages/Test";
import Home from "./pages/Home";
import LoginEmployee from "./pages/LoginEmployee";
import LoginManager from "./pages/LoginManager";
import Start from "./pages/Start";
import RegisterEmployee from "./pages/RegisterEmployee";

function App() {
  return (
    <BrowserRouter>
      <div>
        <Routes>
          <Route path="/" element={<Start />} />
          <Route path="/loginemployee" element={<LoginEmployee />} />
          <Route path="/loginmanager" element={<LoginManager />} />
          <Route path="/home" element={<Home />} />
          <Route path="/test" element={<Test />} />
          <Route path="/registeremployee" element={<RegisterEmployee />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
