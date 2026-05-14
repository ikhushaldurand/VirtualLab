import { Routes, Route } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout.jsx";
import { HomePage } from "../pages/HomePage.jsx";
import { ExperimentsPage } from "../pages/ExperimentsPage.jsx";
import { BuoyancyExperimentPage } from "../pages/BuoyancyExperimentPage.jsx";
import { ElectricFieldExperimentPage } from "../pages/ElectricFieldExperimentPage.jsx";
import { ExperimentRunPage } from "../pages/ExperimentRunPage.jsx";
import { LibraryPage } from "../pages/LibraryPage.jsx";
import { RoomsPage } from "../pages/RoomsPage.jsx";
import { AboutPage } from "../pages/AboutPage.jsx";
import { SignInPage } from "../pages/SignInPage.jsx";
import { SignUpPage } from "../pages/SignUpPage.jsx";
import { RoomNewRedirect } from "../pages/RoomNewRedirect.jsx";
import { RoomWorkspacePage } from "../pages/RoomWorkspacePage.jsx";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/room/new" element={<RoomNewRedirect />} />
      <Route path="/room/:roomId" element={<RoomWorkspacePage />} />
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="experiments" element={<ExperimentsPage />} />
        <Route path="experiments/electric-field" element={<ElectricFieldExperimentPage />} />
        <Route path="experiments/buoyancy" element={<BuoyancyExperimentPage />} />
        <Route path="experiments/:experimentId" element={<ExperimentRunPage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="signin" element={<SignInPage />} />
        <Route path="signup" element={<SignUpPage />} />
      </Route>
    </Routes>
  );
}
