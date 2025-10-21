import { Routes, Route, Outlet } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home/Home";
import LoginEmployee from "./pages/LoginEmployee/LoginEmployee";
import LoginManager from "./pages/LoginManager/LoginManager";
import Start from "./pages/Start/Start";
import RegisterEmployee from "./pages/RegisterEmployee/RegisterEmployee";
import ConfirmEmployee from "./pages/ConfirmEmployee/ConfirmEmployee";
import MyShift from "./pages/MyShift/MyShift";
import AllShift from "./pages/AllShift/AllShift";
import TodayShift from "./pages/TodayShift/TodayShift";
import ShiftApply from "./pages/ShiftApply/ShiftApply";
import ShiftEdit from "./pages/ShiftEdit/ShiftEdit";
import SalaryCalc from "./pages/SalaryCalc/SalaryCalc";
import NotFound from "./pages/NotFound/NotFound";
import EmployeeList from "./pages/EmployeeList/EmployeeList";
import EmployeeDetail from "./pages/EmployeeDetail/EmployeeDetail";
import EmployeeEdit from "./pages/EmployeeEdit/EmployeeEdit";
import DeleteEmployeeConfirm from "./pages/DeleteEmployeeConfirm/DeleteEmployeeConfirm";
import Header from "./components/Header";
import ManagerHome from "./pages/ManagerHome/ManagerHome";
import ShiftApplyConfirm from "./pages/ShiftApplyConfirm/ShiftApplyConfirm";
import Ping from "./pages/Ping";
import { ShiftPlanProvider } from "./pages/ShiftPlanner/ShiftPlanContext";
import AdminShiftPlanner from "./pages/ShiftPlanner/AdminShiftPlanner";
import PublicLayout from "./layouts/PublicLayout";
import { RequireAuth, RequireRole } from "./routes/guards";
import ShiftManage from "./pages/ShiftManage/ShiftManage";

function PrivateLayout() {
  return (
    <>
      {/* ログイン後は常にヘッダー表示 */}
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  );
}

function App() {
  return (
    <Routes>
      {/* 公開（未ログイン向け）：常にヘッダーなし */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Start />} />
        <Route path="/_ping" element={<Ping />} />
        <Route path="/loginemployee" element={<LoginEmployee />} />
        <Route path="/loginmanager" element={<LoginManager />} />
      </Route>

      {/* 認証必須：ヘッダーあり */}
      <Route element={<RequireAuth />}>
        <Route element={<PrivateLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/myshift" element={<MyShift />} />
          <Route path="/allshift" element={<AllShift />} />
          <Route path="/todayshift" element={<TodayShift />} />
          <Route path="/shiftapply" element={<ShiftApply />} />
          <Route path="/shiftapplyconfirm" element={<ShiftApplyConfirm />} />
          <Route path="/shiftedit" element={<ShiftEdit />} />
          <Route path="/salarycalc" element={<SalaryCalc />} />
          {/* 管理者専用 */}
          <Route element={<RequireRole roles={["admin"]} />}>
            <Route path="/managerhome" element={<ManagerHome />} />
            <Route path="/employees" element={<EmployeeList />} />
            <Route
              path="/shiftplanner"
              element={
                <ShiftPlanProvider>
                  <AdminShiftPlanner />
                </ShiftPlanProvider>
              }
            />
            <Route path="/shiftmanage" element={<ShiftManage />} />
            <Route
              path="/employees/:employeeId/edit"
              element={<EmployeeEdit />}
            />
            <Route
              path="/employees/:id/delete/confirm"
              element={<DeleteEmployeeConfirm />}
            />
            <Route path="/employees/:id" element={<EmployeeDetail />} />
            <Route path="/registeremployee" element={<RegisterEmployee />} />
            <Route path="/confirmemployee" element={<ConfirmEmployee />} />
          </Route>
        </Route>
      </Route>

      {/* 404：未ログインでも辿り着く可能性があるなら PublicLayout 側に置く */}
      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
