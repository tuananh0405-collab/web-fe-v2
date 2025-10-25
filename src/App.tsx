import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import DepartmentConfig from "./pages/SystemConfiguration/DepartmentConfig";
import UserAccountConfig from "./pages/SystemConfiguration/UserAccountConfig";
import AttributeConfig from "./pages/SystemConfiguration/AttributeConfig";
import DeviceRequest from "./pages/DevicesFaceID/DeviceRequest";
import FaceIDRequest from "./pages/DevicesFaceID/FaceIDRequest";
import AttendenceReport from "./pages/Reports/AttendenceReport";
import EmployeeAttendence from "./pages/Attendence/EmployeeAttendence";
import EditAttendenceHistory from "./pages/Attendence/EditAttendenceHistory";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            // Dashboard
            <Route index path="/" element={<Home />} />
            // System configuration
            <Route
              index
              path="/department-config"
              element={<DepartmentConfig />}
            />
            <Route
              index
              path="/user-account-config"
              element={<UserAccountConfig />}
            />
            <Route
              index
              path="/attribute-config"
              element={<AttributeConfig />}
            />
            // Devices & FaceID
            <Route index path="/device-request" element={<DeviceRequest />} />
            <Route index path="/device-request" element={<FaceIDRequest />} />
            // Reports
            <Route index path="/report" element={<AttendenceReport />} />
            // Attendence check
            <Route
              index
              path="/attendence-check"
              element={<EmployeeAttendence />}
            />
            <Route
              index
              path="/attendence-history"
              element={<EditAttendenceHistory />}
            />
            // Notification
            <Route index path="/list-notification" element={<BasicTables />} />
            // Employee list
            <Route index path="/employee-list" element={<BasicTables />} />
            <Route
              index
              path="/employee-list/create-profile"
              element={<FormElements />}
            />
            <Route
              index
              path="/employee-list/profile-detail"
              element={<UserProfiles />}
            />{" "}
            // update on modal
            <Route
              index
              path="/employee-list/employee-profile/contract"
              element={<UserProfiles />}
            />{" "}
             // Schedule
            <Route index path="/employee-schedule" element={<Calendar />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
