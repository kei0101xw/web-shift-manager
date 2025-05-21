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
import EmployeeList from "./pages/EmployeeList";
import EmployeeDetail from "./pages/EmployeeDetail";
import EmployeeEdit from "./pages/EmployeeEdit";
import EmployeeDeleteConfirm from "./pages/EmployeeDeleteConfirm";
import Header from "./components/Header";

function App() {
  return (
    <>
      <Header />
      <div>
        <Routes>
          <Route path="/" element={<Start />} />
          <Route path="/loginemployee" element={<LoginEmployee />} />
          <Route path="/loginmanager" element={<LoginManager />} />
          <Route path="/home" element={<Home />} />
          <Route path="/employeelist" element={<EmployeeList />} />
          <Route
            path="/employees/:employeeId/delete-confirm"
            element={<EmployeeDeleteConfirm />}
          />
          <Route
            path="/employees/:employeeId/edit"
            element={<EmployeeEdit />}
          />
          <Route path="/employees/:employeeId" element={<EmployeeDetail />} />
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
    </>
  );
}

export default App;
