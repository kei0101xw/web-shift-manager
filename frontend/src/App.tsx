import { Routes, Route } from "react-router-dom";
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
import EmployeeDeleteConfirm from "./pages/EmployeeDeleteConfirm/EmployeeDeleteConfirm";
import Header from "./components/Header";
import ManagerHome from "./pages/ManagerHome/ManagerHome";
import DeleteEmployee from "./pages/DeleteEmployee/DeleteEmployee";
import ShiftApplyConfirm from "./pages/ShiftApplyConfirm/ShiftApplyConfirm";
import Ping from "./pages/Ping";
import { RequireAuth, RequireRole } from "./routes/guards";
import { useLocation } from "react-router-dom";

function Layout({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  // /loginemployee や /loginmanager 以外でヘッダーを表示
  const showHeader = !["/loginemployee", "/loginmanager"].includes(
    loc.pathname
  );

  return (
    <>
      {showHeader && <Header />}
      <main>{children}</main>
    </>
  );
}

function App() {
  return (
    <Layout>
      <Routes>
        {/* 公開 */}
        <Route path="/" element={<Start />} />
        <Route path="/_ping" element={<Ping />} />
        <Route path="/loginemployee" element={<LoginEmployee />} />
        <Route path="/loginmanager" element={<LoginManager />} />

        {/* 認証必須 */}
        <Route element={<RequireAuth />}>
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
            <Route path="/deleteemployee" element={<DeleteEmployee />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default App;
