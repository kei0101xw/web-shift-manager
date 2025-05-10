import { Routes, Route, BrowserRouter } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import LoginEmployee from "./pages/LoginEmployee";
import LoginManager from "./pages/LoginManager";
import Start from "./pages/Start";
import RegisterEmployee from "./pages/RegisterEmployee";
import ConfirmEmployee from "./pages/ConfirmEmployee";
import MyShift from "./pages/MyShift";
import AllShift from "./pages/AllShift";
import TodayShift from "./pages/TodayShift";
import ShiftApply from "./pages/ShiftApply";
import ShiftEdit from "./pages/ShiftEdit";
import SalaryCalc from "./pages/SalaryCalc";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <div>
        <Routes>
          <Route path="/" element={<Start />} />
          <Route path="/loginemployee" element={<LoginEmployee />} />
          <Route path="/loginmanager" element={<LoginManager />} />
          <Route path="/home" element={<Home />} />
          <Route path="/registeremployee" element={<RegisterEmployee />} />
          <Route path="/confirmemployee" element={<ConfirmEmployee />} />
          <Route path="/myshift" element={<MyShift />} />
          <Route path="/allshift" element={<AllShift />} />
          <Route path="/todayshift" element={<TodayShift />} />
          <Route path="/shiftapply" element={<ShiftApply />} />
          <Route path="/shiftedit" element={<ShiftEdit />} />
          <Route path="/salarycalc" element={<SalaryCalc />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
